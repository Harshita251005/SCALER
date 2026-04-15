import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/cards/[cardId]/labels  → add a label
export async function POST(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const { color, text } = await req.json();
    const label = await prisma.label.create({
      data: { color, text: text || null, cardId },
    });
    return NextResponse.json(label);
  } catch {
    return NextResponse.json({ error: 'Failed to add label' }, { status: 500 });
  }
}

// GET /api/cards/[cardId]/labels  → list labels on a card
export async function GET(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const labels = await prisma.label.findMany({ where: { cardId } });
    return NextResponse.json(labels);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}
