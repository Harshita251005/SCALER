import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const { text } = await req.json();
    const item = await prisma.checklistItem.create({
      data: { text, cardId }
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
