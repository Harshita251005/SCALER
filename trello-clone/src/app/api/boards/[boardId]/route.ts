import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ boardId: string }> }) {
  try {
    // Next.js 15 requires awaiting params
    const { boardId } = await params;
    
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        lists: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: {
                labels: true,
                members: true,
                checklists: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch board details' }, { status: 500 });
  }
}
