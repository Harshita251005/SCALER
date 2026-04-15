// import Link from 'next/link';
// import { prisma } from '@/lib/prisma';
// import CreateBoardButton from '@/components/CreateBoardButton';

// export default async function Home() {
//   const boards = await prisma.board.findMany({
//     orderBy: { createdAt: 'desc' },
//   });

//   return (
//     <main className="max-w-6xl mx-auto p-8 pt-12 min-h-screen">
//       <div className="flex items-center gap-3 mb-10">
//         <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm shadow-inner">
//           <span className="text-3xl">🗂️</span>
//         </div>
//         <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Your Workspaces</h1>
//       </div>
      
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         {boards.map((board) => (
//           <Link href={`/board/${board.id}`} key={board.id}>
//             <div 
//               className="h-36 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex p-5 cursor-pointer border border-white/10 overflow-hidden relative group transform hover:-translate-y-1"
//               style={{ background: board.bgImgRes || '#0079bf' }}
//             >
//               <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
//               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
//               <h2 className="text-white font-bold text-xl relative z-10 mt-auto drop-shadow-lg">{board.title}</h2>
//             </div>
//           </Link>
//         ))}
        
//         {/* Create new board component */}
//         <div className="transform hover:-translate-y-1 transition-transform duration-300">
//           <CreateBoardButton />
//         </div>
//       </div>
//     </main>
//   );
// }
export const dynamic = "force-dynamic";

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import CreateBoardButton from '@/components/CreateBoardButton';

export default async function Home() {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-6xl mx-auto p-8 pt-12 min-h-screen">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm shadow-inner">
          <span className="text-3xl">🗂️</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
          Your Workspaces
        </h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {boards.map((board) => (
          <Link href={`/board/${board.id}`} key={board.id}>
            <div 
              className="h-36 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex p-5 cursor-pointer border border-white/10 overflow-hidden relative group transform hover:-translate-y-1"
              style={{ background: board.bgImgRes || '#0079bf' }}
            >
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
              <h2 className="text-white font-bold text-xl relative z-10 mt-auto drop-shadow-lg">
                {board.title}
              </h2>
            </div>
          </Link>
        ))}
        
        <div className="transform hover:-translate-y-1 transition-transform duration-300">
          <CreateBoardButton />
        </div>
      </div>
    </main>
  );
}