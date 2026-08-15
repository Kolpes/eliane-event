import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Função auxiliar para lidar com a corrida de criação (Unique constraint failed)
async function createOrderWithRetry(input: any, maxRetries = 3) {
  const { name, bi, whatsapp, province, residence, isInukaMember, ticketTypeId, quantity } = input;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Passo A — Lote (guarda atómica via UPDATE)
        const ticketUpdateCount = await tx.$executeRaw`
          UPDATE "TicketType"
          SET sold = sold + ${quantity}
          WHERE id = ${ticketTypeId}
            AND (quantity - sold) >= ${quantity}
        `;

        if (ticketUpdateCount === 0) {
          throw new Error('Quantidade indisponível no momento');
        }
        
        // Vamos precisar do preço para calcular o total do pedido
        const type = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
          select: { price: true, id: true }
        });

        // Passo B — Comprador (lock pessimista + fallback para criação)
        const existingBuyer = await tx.$queryRaw<{ id: string; ticketsPurchased: number }[]>`
          SELECT id, "ticketsPurchased" FROM "Buyer" WHERE bi = ${bi} FOR UPDATE
        `;

        let buyerId: string;

        if (existingBuyer.length > 0) {
          const buyer = existingBuyer[0];
          if (buyer.ticketsPurchased + quantity > 5) {
            throw new Error('Limite de 5 ingressos por B.I. excedido');
          }
          await tx.buyer.update({
            where: { id: buyer.id },
            data: { ticketsPurchased: { increment: quantity } },
          });
          buyerId = buyer.id;
        } else {
          // Comprador novo — quantity já foi validada <=5 antes da chamada
          const newBuyer = await tx.buyer.create({
            data: { 
              name, 
              bi, 
              whatsapp, 
              province, 
              residence, 
              isInukaMember, 
              ticketsPurchased: quantity 
            },
          });
          buyerId = newBuyer.id;
        }

        // Criar o Pedido
        const newOrder = await tx.order.create({
          data: {
            buyerId,
            status: 'PENDING',
            total: Number(type!.price) * quantity
          }
        });

        // Gerar os Ingressos
        const ticketsData = Array.from({ length: quantity }).map(() => ({
          orderId: newOrder.id,
          ticketTypeId: type!.id,
          status: 'RESERVED'
        }));

        await tx.ticket.createMany({
          data: ticketsData
        });

        return newOrder;
      });
    } catch (err: any) {
      if (err.code === 'P2002' && attempt < maxRetries - 1) {
        continue; // retry: na próxima tentativa, o SELECT ... FOR UPDATE vai encontrar o buyer já criado
      }
      throw err;
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, bi, whatsapp, province, residence, isInukaMember, ticketTypeId, quantity } = body;

    // 1. Validação básica de campos
    if (!name || !bi || !whatsapp || !province || !residence || !ticketTypeId || !quantity) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    if (quantity > 5) {
      return NextResponse.json({ error: 'O limite máximo é de 5 ingressos' }, { status: 400 });
    }

    // 2. Validação de WhatsApp (com ou sem DDI +244 base)
    const phoneNumber = parsePhoneNumberFromString(whatsapp, 'AO'); // Default Angola
    if (!phoneNumber || !phoneNumber.isValid()) {
      return NextResponse.json({ error: 'Número de WhatsApp inválido' }, { status: 400 });
    }

    // 3. Validação Rápida de Lote
    const ticketType = await prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!ticketType) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    if (ticketType.quantity - ticketType.sold < quantity) {
      return NextResponse.json({ error: 'Quantidade indisponível neste lote' }, { status: 400 });
    }

    // 4. Validação Rápida de limite por BI
    const existingBuyer = await prisma.buyer.findUnique({
      where: { bi }
    });

    if (existingBuyer && existingBuyer.ticketsPurchased + quantity > 5) {
        return NextResponse.json({ error: 'Limite de 5 ingressos por B.I. excedido' }, { status: 400 });
    }

    // 5. Início de Transação com Retry (Lock/Reserva)
    const input = {
      name, 
      bi, 
      whatsapp: phoneNumber.number, 
      province, 
      residence, 
      isInukaMember, 
      ticketTypeId, 
      quantity
    };

    const order = await createOrderWithRetry(input);

    return NextResponse.json({ success: true, order }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'Quantidade indisponível no momento' || error.message === 'Limite de 5 ingressos por B.I. excedido') {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
