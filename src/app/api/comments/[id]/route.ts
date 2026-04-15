import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/comments/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
