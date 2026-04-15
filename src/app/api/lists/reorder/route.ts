import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const { items } = await req.json();

    // items should be an array of { id, order }
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items format' }, { status: 400 });
    }

    const transaction = items.map((item: { id: string; order: number }) =>
      prisma.list.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    );

    await prisma.$transaction(transaction);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reorder lists' }, { status: 500 });
  }
}
