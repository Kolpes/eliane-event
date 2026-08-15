import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      include: { tickets: true }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + Number(order.total), 0);
    const totalTicketsSold = orders.reduce((acc, order) => acc + order.tickets.length, 0);

    const ticketTypes = await prisma.ticketType.findMany();
    const capacity = ticketTypes.reduce((acc, type) => acc + type.quantity, 0);

    return NextResponse.json({
      totalRevenue,
      totalTicketsSold,
      capacity
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
  }
}
