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
type Comment = { id: string; text: string; author: string; createdAt: string };
type Attachment = { id: string; filename: string; url: string; createdAt: string };

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

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setAllUsers).catch(() => {});

    fetch(`/api/cards/${card.id}/comments`)
      .then(r => r.json())
      .then(data => { setComments(Array.isArray(data) ? data : []); setLoadingComments(false); })
      .catch(() => setLoadingComments(false));

    fetch(`/api/cards/${card.id}/attachments`)
      .then(r => r.json())
      .then(data => setAttachments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [card.id]);

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
    if (res.ok) onDelete(card.id);
  };

  // ── Labels ────────────────────────────────────────────────────────────────
  const toggleLabel = async (preset: { color: string; name: string }) => {
    const existing = labels.find(l => l.color === preset.color);
    if (existing) {
      await fetch(`/api/cards/${card.id}/labels/${existing.id}`, { method: 'DELETE' });
      setLabels(labels.filter(l => l.id !== existing.id));
    } else {
      const res = await fetch(`/api/cards/${card.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: preset.color, text: preset.name })
      });
      if (res.ok) setLabels([...labels, await res.json()]);
    }
  };

  // ── Members ───────────────────────────────────────────────────────────────
  const toggleMember = async (user: User) => {
    const isAssigned = members.some(m => m.id === user.id);
    const res = await fetch(`/api/cards/${card.id}/members`, {
      method: isAssigned ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    if (res.ok) {
      setMembers(isAssigned ? members.filter(m => m.id !== user.id) : [...members, user]);
    }
  };

  // ── Checklists ────────────────────────────────────────────────────────────
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
    if (res.ok) setChecklists([...checklists, await res.json()]);
    setNewChecklistItem('');
  };

  const deleteChecklistItem = async (id: string) => {
    setChecklists(checklists.filter(c => c.id !== id));
    await fetch(`/api/checklists/${id}`, { method: 'DELETE' });
  };

  // ── Comments ──────────────────────────────────────────────────────────────
  const addComment = async () => {
    if (!newComment.trim()) return;
    const res = await fetch(`/api/cards/${card.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment })
    });
    if (res.ok) setComments([await res.json(), ...comments]);
    setNewComment('');
  };

  const deleteComment = async (id: string) => {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    setComments(comments.filter(c => c.id !== id));
  };

  // ── Attachments ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/cards/${card.id}/attachments`, { method: 'POST', body: fd });
    if (res.ok) setAttachments([await res.json(), ...attachments]);
    setUploading(false);
    e.target.value = '';
  };

  const deleteAttachment = async (id: string) => {
    await fetch(`/api/attachments/${id}`, { method: 'DELETE' });
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const completedCount = checklists.filter(c => c.completed).length;
  const checklistProgress = checklists.length > 0 ? (completedCount / checklists.length) * 100 : 0;
  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#f4f5f7] w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col relative max-h-[95vh] sm:max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 z-10 text-lg leading-none"
        >✕</button>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-800 space-y-5">

          {/* Title */}
          <div className="flex items-start gap-3 pr-6">
            <span className="text-xl mt-1">📋</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-lg sm:text-xl font-bold bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-blue-400 rounded px-2 py-1 w-full transition-colors"
            />
          </div>

          {/* Due Date + Members row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">Due Date</h3>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-slate-200 hover:bg-slate-300 focus:bg-white text-sm p-2 rounded shadow-sm border border-transparent focus:border-blue-400 transition-colors w-full"
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">Members</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {members.map(m => (
                  <span key={m.id} title={m.name}
                    className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold uppercase shadow">
                    {m.name.charAt(0)}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowMemberPicker(!showMemberPicker)}
                className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded font-medium transition-colors"
              >{showMemberPicker ? 'Close' : '+ Assign Members'}</button>
              {showMemberPicker && (
                <div className="mt-2 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                  {allUsers.map(user => {
                    const assigned = members.some(m => m.id === user.id);
                    return (
                      <button key={user.id} onClick={() => toggleMember(user)}
                        className="flex items-center gap-3 w-full px-3 py-2 hover:bg-slate-50 text-left">
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
                <span key={lbl.id} className="px-3 py-1 rounded text-white text-xs font-semibold shadow-sm"
                  style={{ backgroundColor: lbl.color }}>{lbl.text}</span>
              ))}
            </div>
            <button onClick={() => setShowLabelPicker(!showLabelPicker)}
              className="text-xs bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded font-medium transition-colors">
              {showLabelPicker ? 'Close' : '+ Edit Labels'}
            </button>
            {showLabelPicker && (
              <div className="mt-2 grid grid-cols-5 gap-1.5 bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                {LABEL_PRESETS.map(preset => {
                  const active = labels.some(l => l.color === preset.color);
                  return (
                    <button key={preset.color} onClick={() => toggleLabel(preset)} title={preset.name}
                      className="h-7 rounded font-bold text-white text-xs transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: preset.color }}>
                      {active && <span className="absolute inset-0 flex items-center justify-center">✓</span>}
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
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${checklistProgress}%` }} />
              </div>
            )}
            <ul className="space-y-1.5 mb-3">
              {checklists.map(item => (
                <li key={item.id} className="flex items-center gap-2 group bg-white rounded px-2 py-1.5 shadow-sm">
                  <input type="checkbox" checked={item.completed}
                    onChange={e => toggleChecklist(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : ''}`}>{item.text}</span>
                  <button onClick={() => deleteChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity text-xs p-0.5">✕</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChecklistItem()} placeholder="Add an item..."
                className="flex-1 bg-slate-200 focus:bg-white text-sm p-2 rounded border border-transparent focus:border-blue-400 transition-colors" />
              <button onClick={addChecklistItem}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 rounded text-sm transition-colors">Add</button>
            </div>
          </div>

          {/* ── Attachments ─────────────────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-widest">📎 Attachments</h3>
            <label className={`inline-flex items-center gap-2 cursor-pointer text-xs font-medium px-3 py-1.5 rounded transition-colors
              ${uploading ? 'bg-slate-300 text-slate-400 cursor-wait' : 'bg-slate-200 hover:bg-slate-300'}`}>
              {uploading ? '⏳ Uploading…' : '+ Add Attachment'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>

            {attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {attachments.map(att => (
                  <li key={att.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 shadow-sm group">
                    {isImage(att.url) ? (
                      <img src={att.url} alt={att.filename} className="w-12 h-10 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-10 bg-slate-100 rounded flex items-center justify-center text-xl flex-shrink-0">📄</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <a href={att.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline truncate block">
                        {att.filename}
                      </a>
                      <span className="text-xs text-slate-400">{formatDate(att.createdAt)}</span>
                    </div>
                    <button onClick={() => deleteAttachment(att.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1 text-xs flex-shrink-0">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Activity / Comments ─────────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold mb-3 text-slate-500 uppercase tracking-widest">💬 Activity</h3>

            {/* Add comment */}
            <div className="flex gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold uppercase flex-shrink-0">Y</div>
              <div className="flex-1 flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                  placeholder="Write a comment…"
                  className="flex-1 bg-slate-200 focus:bg-white text-sm p-2 rounded border border-transparent focus:border-blue-400 transition-colors"
                />
                <button onClick={addComment}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 rounded text-sm transition-colors flex-shrink-0">Post</button>
              </div>
            </div>

            {/* Comments list */}
            {loadingComments ? (
              <p className="text-sm text-slate-400 text-center py-2">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">No activity yet. Add a comment!</p>
            ) : (
              <ul className="space-y-3">
                {comments.map(c => (
                  <li key={c.id} className="flex gap-3 group">
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold uppercase flex-shrink-0">
                      {c.author.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{c.author}</span>
                        <span className="text-xs text-slate-400">{formatDate(c.createdAt)}</span>
                        <button onClick={() => deleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-red-500 transition-opacity ml-auto">
                          Delete
                        </button>
                      </div>
                      <p className="text-sm bg-white rounded-lg px-3 py-2 mt-1 shadow-sm whitespace-pre-wrap break-words">{c.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-200 p-3 sm:p-4 border-t border-slate-300 flex justify-between items-center rounded-b-xl gap-2 flex-wrap">
          <div className="flex gap-2">
            <button onClick={handleDelete}
              className="text-red-600 hover:text-red-800 font-medium px-3 py-1.5 hover:bg-red-50 rounded text-sm transition-colors">
              🗑 Delete
            </button>
            <button onClick={handleArchive}
              className="text-slate-600 hover:text-slate-800 font-medium px-3 py-1.5 hover:bg-slate-300 rounded text-sm transition-colors">
              📦 Archive
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-1.5 rounded font-medium hover:bg-slate-300 text-sm transition-colors">Cancel</button>
            <button onClick={saveDetails}
              className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700 text-sm transition-colors">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
