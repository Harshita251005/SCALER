'use client';

import { useState, useEffect } from 'react';

const LABEL_PRESETS = [
  { color: '#61bd4f', name: 'Green' },
  { color: '#f2d600', name: 'Yellow' },
  { color: '#ff9f1a', name: 'Orange' },
  { color: '#eb5a46', name: 'Red' },
  { color: '#c377e0', name: 'Purple' },
  { color: '#0079bf', name: 'Blue' },
  { color: '#00c2e0', name: 'Sky' },
  { color: '#51e898', name: 'Lime' },
  { color: '#ff78cb', name: 'Pink' },
  { color: '#344563', name: 'Black' },
];

type User = { id: string; name: string; email: string };
type Label = { id: string; color: string; text?: string | null };
type ChecklistItem = { id: string; text: string; completed: boolean };

type CardModalProps = {
  card: any;
  onClose: () => void;
  onUpdate: (updatedCard: any) => void;
  onDelete: (cardId: string) => void;
};

export default function CardModal({ card, onClose, onUpdate, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');

  const [labels, setLabels] = useState<Label[]>(card.labels || []);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const [checklists, setChecklists] = useState<ChecklistItem[]>(card.checklists || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const [members, setMembers] = useState<User[]>(card.members || []);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setAllUsers).catch(() => {});
  }, []);

  const saveDetails = async () => {
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, dueDate: dueDate || null })
    });
    if (res.ok) {
      const updated = await res.json();
      onUpdate({ ...updated, labels, members, checklists });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    const res = await fetch(`/api/cards/${card.id}`, { method: 'DELETE' });
    if (res.ok) onDelete(card.id);
  };

  const handleArchive = async () => {
    if (!confirm('Archive this card? It will be hidden from the board.')) return;
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true })
    });
    if (res.ok) onDelete(card.id); // remove from board view
  };

  // ── Labels ─────────────────────────────────────────────────────────────────
  const toggleLabel = async (preset: { color: string; name: string }) => {
    const existing = labels.find(l => l.color === preset.color);
    if (existing) {
      // remove
      await fetch(`/api/cards/${card.id}/labels/${existing.id}`, { method: 'DELETE' });
      setLabels(labels.filter(l => l.id !== existing.id));
    } else {
      // add
      const res = await fetch(`/api/cards/${card.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: preset.color, text: preset.name })
      });
      if (res.ok) {
        const newLabel = await res.json();
        setLabels([...labels, newLabel]);
      }
    }
  };

  // ── Members ────────────────────────────────────────────────────────────────
  const toggleMember = async (user: User) => {
    const isAssigned = members.some(m => m.id === user.id);
    const res = await fetch(`/api/cards/${card.id}/members`, {
      method: isAssigned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    if (res.ok) {
      if (isAssigned) {
        setMembers(members.filter(m => m.id !== user.id));
      } else {
        setMembers([...members, user]);
      }
    }
  };

  // ── Checklists ─────────────────────────────────────────────────────────────
  const toggleChecklist = async (id: string, completed: boolean) => {
    setChecklists(checklists.map(c => c.id === id ? { ...c, completed } : c));
    await fetch(`/api/checklists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed })
    });
  };

  const addChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    const res = await fetch(`/api/cards/${card.id}/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newChecklistItem })
    });
    if (res.ok) {
      const item = await res.json();
      setChecklists([...checklists, item]);
    }
    setNewChecklistItem('');
  };

  const deleteChecklistItem = async (id: string) => {
    setChecklists(checklists.filter(c => c.id !== id));
    await fetch(`/api/checklists/${id}`, { method: 'DELETE' });
  };

  const completedCount = checklists.filter(c => c.completed).length;
  const checklistProgress = checklists.length > 0 ? (completedCount / checklists.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#f4f5f7] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col relative max-h-[92vh]">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 z-10 text-lg leading-none">✕</button>

        <div className="p-6 overflow-y-auto flex-1 text-slate-800 space-y-6">

          {/* Title */}
          <div className="flex items-start gap-3">
            <span className="text-xl mt-1">📋</span>
            <div className="flex-1">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-xl font-bold bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-2 py-1 w-full -ml-2 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">Due Date</h3>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-slate-200 hover:bg-slate-300 focus:bg-white text-sm p-2 rounded shadow-sm border border-transparent focus:border-blue-400 transition-colors w-full"
              />
            </div>

            {/* Members */}
            <div>
              <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">Members</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {members.map(m => (
                  <span
                    key={m.id}
                    title={m.name}
                    className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold uppercase shadow cursor-default"
                  >
                    {m.name.charAt(0)}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowMemberPicker(!showMemberPicker)}
                className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded font-medium transition-colors"
              >
                {showMemberPicker ? 'Close' : '+ Assign Members'}
              </button>
              {showMemberPicker && (
                <div className="mt-2 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                  {allUsers.map(user => {
                    const assigned = members.some(m => m.id === user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleMember(user)}
                        className="flex items-center gap-3 w-full px-3 py-2 hover:bg-slate-50 text-left"
                      >
                        <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold uppercase flex-shrink-0">
                          {user.name.charAt(0)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        </div>
                        {assigned && <span className="text-green-500 text-sm font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">Labels</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels.map(lbl => (
                <span
                  key={lbl.id}
                  className="px-3 py-1 rounded text-white text-xs font-semibold shadow-sm"
                  style={{ backgroundColor: lbl.color }}
                >
                  {lbl.text}
                </span>
              ))}
            </div>
            <button
              onClick={() => setShowLabelPicker(!showLabelPicker)}
              className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded font-medium transition-colors"
            >
              {showLabelPicker ? 'Close' : '+ Edit Labels'}
            </button>
            {showLabelPicker && (
              <div className="mt-2 grid grid-cols-5 gap-1.5 bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                {LABEL_PRESETS.map(preset => {
                  const active = labels.some(l => l.color === preset.color);
                  return (
                    <button
                      key={preset.color}
                      onClick={() => toggleLabel(preset)}
                      title={preset.name}
                      className="h-7 rounded font-bold text-white text-xs transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: preset.color }}
                    >
                      {active && <span className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">Description</h3>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              className="w-full bg-slate-200 hover:bg-slate-300 focus:bg-white text-sm p-3 rounded shadow-sm border border-transparent focus:border-blue-400 resize-y min-h-[80px] transition-colors"
            />
          </div>

          {/* Checklist */}
          <div>
            <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">
              Checklist {checklists.length > 0 && `(${completedCount}/${checklists.length})`}
            </h3>
            {checklists.length > 0 && (
              <div className="bg-slate-200 h-2 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            )}
            <ul className="space-y-1.5 mb-3">
              {checklists.map((item) => (
                <li key={item.id} className="flex items-center gap-2 group bg-white rounded px-2 py-1.5 shadow-sm">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => toggleChecklist(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : ''}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => deleteChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity text-xs p-0.5"
                  >✕</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newChecklistItem}
                onChange={e => setNewChecklistItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                placeholder="Add an item..."
                className="flex-1 bg-slate-200 focus:bg-white text-sm p-2 rounded border border-transparent focus:border-blue-400 transition-colors"
              />
              <button onClick={addChecklistItem} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 rounded text-sm transition-colors">Add</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-200 p-4 border-t border-slate-300 flex justify-between items-center rounded-b-xl gap-2">
          <div className="flex gap-2">
            <button onClick={handleDelete} className="text-red-600 hover:text-red-800 font-medium px-3 py-1.5 hover:bg-red-50 rounded text-sm transition-colors">
              🗑 Delete
            </button>
            <button onClick={handleArchive} className="text-slate-600 hover:text-slate-800 font-medium px-3 py-1.5 hover:bg-slate-300 rounded text-sm transition-colors">
              📦 Archive
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 rounded font-medium hover:bg-slate-300 text-sm transition-colors">Cancel</button>
            <button onClick={saveDetails} className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700 text-sm transition-colors">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
