import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/cards/[cardId]/comments
export async function GET(_req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const comments = await prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(comments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/cards/[cardId]/comments
export async function POST(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const { text, author } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });
    const comment = await prisma.comment.create({
      data: { text: text.trim(), author: author?.trim() || 'You', cardId },
    });
    return NextResponse.json(comment);
  } catch {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
