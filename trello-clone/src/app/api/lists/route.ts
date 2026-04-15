import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { title, boardId } = await req.json();

    if (!title || !boardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    });
    
    const newOrder = lastList ? lastList.order + 1 : 0;

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
        order: newOrder,
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
