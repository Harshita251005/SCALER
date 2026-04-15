import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { title, listId } = await req.json();

    if (!title || !listId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lastCard = await prisma.card.findFirst({
      where: { listId },
      orderBy: { order: 'desc' },
    });
    
    const newOrder = lastCard ? lastCard.order + 1 : 0;

    const card = await prisma.card.create({
      data: {
        title,
        listId,
        order: newOrder,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
