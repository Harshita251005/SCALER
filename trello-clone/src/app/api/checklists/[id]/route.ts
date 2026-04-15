import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { completed } = await req.json();
    const item = await prisma.checklistItem.update({
      where: { id },
      data: { completed }
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.checklistItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
