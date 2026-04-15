import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BoardWrapper from './BoardWrapper';

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      lists: {
        orderBy: { order: 'asc' },
        include: {
          cards: {
            orderBy: { order: 'asc' },
            include: {
              labels: true,
              members: true,
              checklists: true,
            },
          },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: board.bgImgRes || '#0079bf' }}
    >
      <header className="bg-black/20 backdrop-blur-md text-white p-4 flex gap-4 items-center shadow-sm border-b border-white/10 shrink-0 z-10 relative">
        <Link href="/" className="hover:bg-white/20 p-2 rounded-lg transition-colors font-bold text-xl tracking-tight flex items-center justify-center bg-white/10">
          <span className="opacity-90">⌂</span>
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-md">{board.title}</h1>
      </header>
      
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-6 items-start h-full">
        <BoardWrapper initialBoard={board} />
      </main>
    </div>
  );
}
