import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  try {
    const { listId } = await params;
    await prisma.list.delete({ where: { id: listId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  try {
    const { listId } = await params;
    const body = await req.json();
    const updated = await prisma.list.update({ 
      where: { id: listId }, 
      data: { title: body.title } 
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}
