'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateBoardButton() {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const router = useRouter();

  const handleCreate = async () => {
    if (!title.trim()) return;
    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, bgImgRes: '#0079bf' })
    });
    if (res.ok) {
      const board = await res.json();
      router.push(`/board/${board.id}`);
    }
  };

  if (!isCreating) {
    return (
      <div 
        onClick={() => setIsCreating(true)}
        className="h-32 bg-gray-200 hover:bg-gray-300 transition-colors rounded flex items-center justify-center text-gray-600 font-semibold cursor-pointer shadow-sm"
      >
        + Create new board
      </div>
    );
  }

  return (
    <div className="h-32 bg-white rounded shadow border border-blue-500 p-4 flex flex-col justify-between">
      <input 
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleCreate()}
        placeholder="Board title"
        className="w-full text-sm p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-800 text-sm">Cancel</button>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Create</button>
      </div>
    </div>
  );
}
