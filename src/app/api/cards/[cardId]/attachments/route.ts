import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET /api/cards/[cardId]/attachments
export async function GET(_req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const attachments = await prisma.attachment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(attachments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

// POST /api/cards/[cardId]/attachments  (multipart/form-data)
export async function POST(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and make unique
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${safeName}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, uniqueName), buffer);

    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        url: `/uploads/${uniqueName}`,
        cardId,
      },
    });

    return NextResponse.json(attachment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}
