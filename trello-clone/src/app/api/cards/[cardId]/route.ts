import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const body = await req.json();
    const { title, description, dueDate, archived } = body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate || null;
    if (archived !== undefined) dataToUpdate.archived = archived;

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: dataToUpdate,
      include: {
        labels: true,
        members: true,
        checklists: true,
      }
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    await prisma.card.delete({ where: { id: cardId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
