import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const buyers = await prisma.buyer.findMany({
      include: {
        orders: {
          include: { tickets: true }
        }
      }
    });

    const header = ['Nome', 'Nº BI', 'WhatsApp', 'Provincia', 'Moradia', 'Membro Inuka', 'Total Ingressos Comprados'];
    const rows = buyers.map(buyer => {
      const totalTickets = buyer.orders.reduce((acc, order) => {
        if (order.status !== 'CANCELLED') {
          return acc + order.tickets.length;
        }
        return acc;
      }, 0);

      return [
        `"${buyer.name.replace(/"/g, '""')}"`,
        `"${buyer.bi}"`,
        `"${buyer.whatsapp}"`,
        `"${buyer.province}"`,
        `"${buyer.residence}"`,
        buyer.isInukaMember ? 'Sim' : 'Não',
        totalTickets
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="compradores.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao exportar compradores' }, { status: 500 });
  }
}
