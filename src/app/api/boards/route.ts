import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(boards);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, bgImgRes } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const board = await prisma.board.create({
      data: {
        title,
        bgImgRes: bgImgRes || '#0079bf',
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
