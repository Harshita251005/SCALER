'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CardModal from '@/components/CardModal';

type Card = { id: string; title: string; description?: string | null; dueDate?: string | null; order: number; listId: string; archived?: boolean; labels?: any[]; members?: any[]; checklists?: any[] };
type List = { id: string; title: string; order: number; cards: Card[] };
type BoardData = { id: string; title: string; lists: List[] };

export default function BoardWrapper({ initialBoard }: { initialBoard: BoardData }) {
  const [board, setBoard] = useState<BoardData>(initialBoard);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const [addingCardFor, setAddingCardFor] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Inline list title editing
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState('');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [allMembers, setAllMembers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setAllMembers).catch(() => {});
  }, []);

  const isFiltering = searchQuery.trim().length > 0 || filterLabel !== '' || filterDate !== '' || filterMember !== '';

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragEnd = async (result: any) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
      const listsBase = Array.from(board.lists);
      const [movedList] = listsBase.splice(source.index, 1);
      listsBase.splice(destination.index, 0, movedList);
      const newLists = listsBase.map((l, idx) => ({ ...l, order: idx }));
      setBoard({ ...board, lists: newLists });
      await fetch('/api/lists/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newLists.map(l => ({ id: l.id, order: l.order })) })
      });
      return;
    }

    const sourceListIndex = board.lists.findIndex(l => l.id === source.droppableId);
    const destListIndex = board.lists.findIndex(l => l.id === destination.droppableId);
    if (sourceListIndex === -1 || destListIndex === -1) return;

    const sourceList = board.lists[sourceListIndex];
    const destList = board.lists[destListIndex];
    const sourceCards = Array.from(sourceList.cards);
    const destCards = source.droppableId === destination.droppableId ? sourceCards : Array.from(destList.cards);

    const [movedCard] = sourceCards.splice(source.index, 1);
    movedCard.listId = destination.droppableId;
    destCards.splice(destination.index, 0, movedCard);

    const newLists = [...board.lists];
    if (source.droppableId === destination.droppableId) {
      newLists[sourceListIndex] = { ...sourceList, cards: destCards.map((c, i) => ({ ...c, order: i })) };
    } else {
      newLists[sourceListIndex] = { ...sourceList, cards: sourceCards.map((c, i) => ({ ...c, order: i })) };
      newLists[destListIndex] = { ...destList, cards: destCards.map((c, i) => ({ ...c, order: i })) };
    }
    setBoard({ ...board, lists: newLists });

    const updatedCards = newLists[destListIndex].cards.map(c => ({ id: c.id, order: c.order, listId: c.listId }));
    if (source.droppableId !== destination.droppableId) {
      updatedCards.push(...newLists[sourceListIndex].cards.map(c => ({ id: c.id, order: c.order, listId: c.listId })));
    }
    await fetch('/api/cards/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: updatedCards })
    });
  };

  // ── Lists ────────────────────────────────────────────────────────────────────
  const handleAddList = async () => {
    if (!newListTitle.trim()) { setAddingList(false); return; }
    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newListTitle, boardId: board.id })
    });
    if (res.ok) {
      const createdList = await res.json();
      setBoard({ ...board, lists: [...board.lists, { ...createdList, cards: [] }] });
    }
    setNewListTitle('');
    setAddingList(false);
  };

  const handleListDelete = async (listId: string) => {
    if (!confirm('Delete this list and all its cards?')) return;
    const res = await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
    if (res.ok) setBoard({ ...board, lists: board.lists.filter(l => l.id !== listId) });
  };

  const startEditingList = (list: List) => {
    setEditingListId(list.id);
    setEditingListTitle(list.title);
  };

  const saveListTitle = async (listId: string) => {
    if (!editingListTitle.trim()) { setEditingListId(null); return; }
    const res = await fetch(`/api/lists/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editingListTitle })
    });
    if (res.ok) {
      setBoard({ ...board, lists: board.lists.map(l => l.id === listId ? { ...l, title: editingListTitle } : l) });
    }
    setEditingListId(null);
  };

  // ── Cards ────────────────────────────────────────────────────────────────────
  const handleAddCard = async (listId: string) => {
    if (!newCardTitle.trim()) { setAddingCardFor(null); return; }
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newCardTitle, listId })
    });
    if (res.ok) {
      const createdCard = await res.json();
      setBoard({
        ...board,
        lists: board.lists.map(list =>
          list.id === listId ? { ...list, cards: [...list.cards, { ...createdCard, labels: [], members: [], checklists: [] }] } : list
        )
      });
    }
    setNewCardTitle('');
    setAddingCardFor(null);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Search & Filter Bar */}
      <div className="mb-4 px-1 shrink-0 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="🔍 Search cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-300 w-52 text-sm shadow-sm bg-white/80"
        />
        <select
          value={filterLabel}
          onChange={e => setFilterLabel(e.target.value)}
          className="px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-300 text-sm shadow-sm text-slate-600 bg-white/80"
        >
          <option value="">🏷 Any Label</option>
          <option value="#61bd4f">Green</option>
          <option value="#f2d600">Yellow</option>
          <option value="#ff9f1a">Orange</option>
          <option value="#eb5a46">Red</option>
          <option value="#c377e0">Purple</option>
          <option value="#0079bf">Blue</option>
        </select>
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-300 text-sm shadow-sm text-slate-600 bg-white/80"
        >
          <option value="">👤 Any Member</option>
          {allMembers.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          title="Filter by due date"
          className="px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-300 text-sm shadow-sm text-slate-600 bg-white/80"
        />
        {isFiltering && (
          <button
            onClick={() => { setSearchQuery(''); setFilterLabel(''); setFilterDate(''); setFilterMember(''); }}
            className="text-xs text-white bg-black/25 hover:bg-black/40 px-3 py-2 rounded-lg transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 items-start pb-4 flex-1 overflow-x-auto"
            >
              {board.lists.map((list, index) => {
                const visibleCards = list.cards.filter(card => {
                  if (card.archived) return false;
                  if (!isFiltering) return true;
                  const matchesSearch = !searchQuery.trim() || card.title.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesLabel = !filterLabel || card.labels?.some(l => l.color === filterLabel);
                  const matchesDate = !filterDate || (card.dueDate && card.dueDate.startsWith(filterDate));
                  const matchesMember = !filterMember || card.members?.some(m => m.id === filterMember);
                  return matchesSearch && matchesLabel && matchesDate && matchesMember;
                });

                return (
                  <Draggable key={list.id} draggableId={list.id} index={index} isDragDisabled={isFiltering}>
                    {(providedList) => (
                      <div
                        ref={providedList.innerRef}
                        {...providedList.draggableProps}
                        className="w-72 flex-shrink-0 bg-[#ebecf0] rounded-xl flex flex-col max-h-[calc(100vh-200px)]"
                      >
                        {/* List Header */}
                        <div
                          {...providedList.dragHandleProps}
                          className="px-3 py-3 flex justify-between items-center group"
                        >
                          {editingListId === list.id ? (
                            <input
                              autoFocus
                              value={editingListTitle}
                              onChange={e => setEditingListTitle(e.target.value)}
                              onBlur={() => saveListTitle(list.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveListTitle(list.id);
                                if (e.key === 'Escape') setEditingListId(null);
                              }}
                              className="flex-1 font-semibold text-sm text-slate-700 bg-white rounded px-2 py-1 border-2 border-blue-500 focus:outline-none mr-2"
                            />
                          ) : (
                            <span
                              className="font-semibold text-slate-700 text-sm cursor-text flex-1 py-1 px-1 hover:bg-slate-200 rounded transition-colors"
                              onClick={() => startEditingList(list)}
                              title="Click to edit list name"
                            >
                              {list.title}
                              <span className="ml-1.5 text-xs text-slate-400 font-normal">({visibleCards.length})</span>
                            </span>
                          )}
                          <button
                            onClick={() => handleListDelete(list.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 ml-1 rounded hover:bg-red-50"
                            title="Delete list"
                          >✕</button>
                        </div>

                        {/* Cards */}
                        <Droppable droppableId={list.id} type="card">
                          {(providedCards, snapshot) => (
                            <div
                              ref={providedCards.innerRef}
                              {...providedCards.droppableProps}
                              className={`flex-1 overflow-y-auto px-2 space-y-2 pb-2 min-h-[40px] transition-colors rounded ${snapshot.isDraggingOver ? 'bg-blue-100/50' : ''}`}
                            >
                              {visibleCards.map((card, cardIndex) => (
                                <Draggable key={card.id} draggableId={card.id} index={cardIndex} isDragDisabled={isFiltering}>
                                  {(providedCard, dragSnapshot) => (
                                    <div
                                      ref={providedCard.innerRef}
                                      {...providedCard.draggableProps}
                                      {...providedCard.dragHandleProps}
                                      onClick={() => setSelectedCard(card)}
                                      className={`bg-white p-3 rounded-lg shadow-sm text-sm text-slate-700 hover:bg-slate-50 border border-transparent hover:border-blue-300 cursor-pointer transition-all ${dragSnapshot.isDragging ? 'shadow-xl rotate-1 border-blue-400' : ''}`}
                                    >
                                      {/* Labels */}
                                      {card.labels && card.labels.length > 0 && (
                                        <div className="flex gap-1 mb-2 flex-wrap">
                                          {card.labels.map((lbl: any) => (
                                            <span
                                              key={lbl.id}
                                              className="h-2 w-10 block rounded-full"
                                              style={{ backgroundColor: lbl.color }}
                                              title={lbl.text}
                                            />
                                          ))}
                                        </div>
                                      )}

                                      <div className="font-medium whitespace-pre-wrap">{card.title}</div>

                                      {/* Card Meta */}
                                      <div className="flex gap-2 items-center flex-wrap mt-1.5">
                                        {card.dueDate && (
                                          <span className={`text-xs flex items-center gap-1 px-1.5 py-0.5 rounded ${new Date(card.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                            📅 {new Date(card.dueDate).toLocaleDateString()}
                                          </span>
                                        )}
                                        {card.checklists && card.checklists.length > 0 && (
                                          <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                            ☑ {card.checklists.filter((c: any) => c.completed).length}/{card.checklists.length}
                                          </span>
                                        )}
                                        {card.members && card.members.length > 0 && (
                                          <div className="flex -space-x-1 mt-0.5">
                                            {card.members.slice(0, 3).map((m: any) => (
                                              <span
                                                key={m.id}
                                                title={m.name}
                                                className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold border border-white uppercase"
                                              >
                                                {m.name.charAt(0)}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {providedCards.placeholder}

                              {/* Add Card Input */}
                              {addingCardFor === list.id && (
                                <div className="pt-1">
                                  <textarea
                                    autoFocus
                                    value={newCardTitle}
                                    onChange={(e) => setNewCardTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(list.id); }
                                      if (e.key === 'Escape') { setAddingCardFor(null); setNewCardTitle(''); }
                                    }}
                                    className="w-full text-sm p-2 rounded shadow-sm border-2 border-blue-400 focus:outline-none resize-none"
                                    rows={2}
                                    placeholder="Enter a title for this card..."
                                  />
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <button onClick={() => handleAddCard(list.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded font-medium text-sm hover:bg-blue-700">
                                      Add card
                                    </button>
                                    <button onClick={() => { setAddingCardFor(null); setNewCardTitle(''); }} className="text-slate-500 hover:text-slate-800 p-1">✕</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>

                        {/* Add Card Button */}
                        {addingCardFor !== list.id && (
                          <div className="p-2">
                            <button
                              onClick={() => { setAddingCardFor(list.id); setNewCardTitle(''); }}
                              className="flex items-center gap-1.5 text-slate-500 hover:bg-slate-300 hover:text-slate-700 w-full rounded p-2 text-sm transition-colors font-medium"
                            >
                              <span className="text-base leading-none">+</span> Add a card
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}

              {/* Add List */}
              {!addingList ? (
                <div
                  onClick={() => setAddingList(true)}
                  className="w-72 flex-shrink-0 bg-white/20 hover:bg-white/30 transition-colors py-3 px-4 rounded-xl cursor-pointer text-white font-medium shadow-sm flex items-center gap-2"
                >
                  <span>+</span> Add another list
                </div>
              ) : (
                <div className="w-72 flex-shrink-0 bg-[#ebecf0] rounded-xl p-2 flex flex-col gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddList();
                      if (e.key === 'Escape') { setAddingList(false); setNewListTitle(''); }
                    }}
                    placeholder="Enter list title..."
                    className="w-full text-sm p-2 border-2 border-blue-500 rounded focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handleAddList} className="bg-blue-600 text-white px-3 py-1.5 rounded font-medium text-sm hover:bg-blue-700">Add list</button>
                    <button onClick={() => { setAddingList(false); setNewListTitle(''); }} className="text-slate-500 hover:text-slate-800 p-1">✕</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Card Modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onDelete={(cardId) => {
            setBoard({
              ...board,
              lists: board.lists.map(list => ({
                ...list,
                cards: list.cards.filter(c => c.id !== cardId)
              }))
            });
            setSelectedCard(null);
          }}
          onUpdate={(updatedCard) => {
            setBoard({
              ...board,
              lists: board.lists.map(list => ({
                ...list,
                cards: list.cards.map(c => c.id === updatedCard.id ? { ...c, ...updatedCard } : c)
              }))
            });
            setSelectedCard(null);
          }}
        />
      )}
    </div>
  );
}
