import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, bi, whatsapp, province, residence, isInukaMember, ticketTypeId, quantity } = body;

    // 1. Validação básica de campos
    if (!name || !bi || !whatsapp || !province || !residence || !ticketTypeId || !quantity) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    // 2. Validação de WhatsApp (com ou sem DDI +244 base)
    const phoneNumber = parsePhoneNumberFromString(whatsapp, 'AO'); // Default Angola
    if (!phoneNumber || !phoneNumber.isValid()) {
      return NextResponse.json({ error: 'Número de WhatsApp inválido' }, { status: 400 });
    }

    // 3. Validação de Lote e Overselling
    const ticketType = await prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!ticketType) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    if (ticketType.quantity - ticketType.sold < quantity) {
      return NextResponse.json({ error: 'Quantidade indisponível neste lote' }, { status: 400 });
    }

    // 4. Validação de limite por BI (máx 5 ingressos)
    const existingBuyer = await prisma.buyer.findFirst({
      where: { bi },
      include: {
        orders: {
          include: { tickets: true }
        }
      }
    });

    let currentTicketsCount = 0;
    if (existingBuyer) {
        currentTicketsCount = existingBuyer.orders.reduce((acc, order) => {
            if (order.status !== 'CANCELLED') {
                return acc + order.tickets.length;
            }
            return acc;
        }, 0);
    }

    if (currentTicketsCount + quantity > 5) {
        return NextResponse.json({ error: 'Limite de 5 ingressos por B.I. excedido' }, { status: 400 });
    }

    // 5. Início de Transação (Lock/Reserva)
    const order = await prisma.$transaction(async (tx) => {
      // Re-checagem da quantidade dentro da transação para garantir concorrência
      const type = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
      });
      
      if (!type || type.quantity - type.sold < quantity) {
          throw new Error('Quantidade indisponível no momento');
      }

      // 6. Atualizar a quantidade vendida no lote
      await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { sold: { increment: quantity } }
      });

      // 7. Criar/Obter o Comprador
      let buyerId = existingBuyer?.id;
      if (!buyerId) {
          const newBuyer = await tx.buyer.create({
              data: { name, bi, whatsapp: phoneNumber.number, province, residence, isInukaMember }
          });
          buyerId = newBuyer.id;
      }

      // 8. Criar o Pedido
      const newOrder = await tx.order.create({
          data: {
              buyerId,
              status: 'PENDING',
              total: Number(type.price) * quantity
          }
      });

      // 9. Gerar os Ingressos
      const ticketsData = Array.from({ length: quantity }).map(() => ({
          orderId: newOrder.id,
          ticketTypeId: type.id,
          status: 'RESERVED'
      }));

      await tx.ticket.createMany({
          data: ticketsData
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, order }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'Quantidade indisponível no momento') {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
