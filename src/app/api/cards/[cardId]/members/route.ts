import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/cards/[cardId]/members  → assign a member
export async function POST(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const { userId } = await req.json();
    const card = await prisma.card.update({
      where: { id: cardId },
      data: { members: { connect: { id: userId } } },
      include: { members: true },
    });
    return NextResponse.json(card.members);
  } catch {
    return NextResponse.json({ error: 'Failed to assign member' }, { status: 500 });
  }
}

// DELETE /api/cards/[cardId]/members  → unassign a member
export async function DELETE(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const { userId } = await req.json();
    const card = await prisma.card.update({
      where: { id: cardId },
      data: { members: { disconnect: { id: userId } } },
      include: { members: true },
    });
    return NextResponse.json(card.members);
  } catch {
    return NextResponse.json({ error: 'Failed to unassign member' }, { status: 500 });
  }
}
