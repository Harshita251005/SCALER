import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/cards/[cardId]/labels/[labelId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ cardId: string; labelId: string }> }
) {
  try {
    const { labelId } = await params;
    await prisma.label.delete({ where: { id: labelId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 });
  }
}
