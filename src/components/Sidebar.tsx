import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  Sparkles,
  User,
} from 'lucide-react';
import { ChatSession, UserSettings } from '../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  userSettings: UserSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onOpenSettings,
  userSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const saveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase().trim();
    return sessions.filter((s) => {
      if (s.title.toLowerCase().includes(q)) return true;
      return s.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [sessions, searchQuery]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-[#0c101a] border-r border-slate-800/80 transition-all duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-[280px]'
        }`}
      >
        {/* Top Header: Brand & Collapse Toggle */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/10 ring-1 ring-white/10">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                Nova AI
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Assistant</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-label="Tutup menu sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Tutup sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            aria-label="Mulai percakapan baru"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 font-medium text-xs tracking-wide transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Percakapan Baru</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari riwayat..."
              aria-label="Cari riwayat percakapan"
              className="w-full py-1.5 pl-8 pr-7 text-xs bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                aria-label="Hapus teks pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Riwayat Chat
          </div>

          {filteredSessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-slate-400">
              {searchQuery ? 'Tidak ada percakapan ditemukan' : 'Belum ada riwayat percakapan'}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingId;
              const isConfirmingDelete = session.id === confirmDeleteId;

              if (isEditing) {
                return (
                  <form
                    key={session.id}
                    onSubmit={(e) => saveRename(session.id, e)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-slate-200 outline-none"
                    />
                    <button
                      type="submit"
                      className="p-1 text-emerald-400 hover:text-emerald-300"
                      aria-label="Simpan nama"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="p-1 text-slate-400 hover:text-slate-300"
                      aria-label="Batal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-medium border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate" title={session.title}>
                      {session.title}
                    </span>
                  </div>

                  {/* Actions: Rename / Delete */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isConfirmingDelete ? (
                      <div
                        className="flex items-center gap-1 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-red-300">Hapus?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSession(session.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-red-400 hover:text-red-200 p-0.5"
                          title="Konfirmasi hapus"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-slate-400 hover:text-slate-200 p-0.5"
                          title="Batal"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => startRename(session, e)}
                          aria-label={`Ubah nama ${session.title}`}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded"
                          title="Ubah nama"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(session.id);
                          }}
                          aria-label={`Hapus ${session.title}`}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded"
                          title="Hapus percakapan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Settings & User Profile */}
        <div className="p-3 border-t border-slate-800/80 space-y-1">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Buka pengaturan"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Pengaturan</span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-slate-200 truncate block">
                {userSettings.userName}
              </span>
              <span className="text-[10px] text-slate-400 block">Akun Pengguna</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
