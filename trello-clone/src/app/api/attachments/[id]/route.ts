import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

// DELETE /api/attachments/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const attachment = await prisma.attachment.findUnique({ where: { id } });

    if (attachment) {
      // Remove physical file from public/uploads/
      const filePath = path.join(process.cwd(), 'public', attachment.url);
      await unlink(filePath).catch(() => {}); // ignore if file already gone
      await prisma.attachment.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
