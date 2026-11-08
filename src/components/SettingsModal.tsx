import React, { useState } from 'react';
import {
  X,
  User,
  Server,
  Download,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ChatSession, UserSettings } from '../types/chat';
import { testApiConnection, PRIMARY_API_ENDPOINT } from '../services/chatApi';
import { exportSessionAsMarkdown } from '../utils/chatStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  sessions: ChatSession[];
  onClearAllChats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  sessions,
  onClearAllChats,
}) => {
  const [userName, setUserName] = useState(settings.userName);
  const [customApiUrl, setCustomApiUrl] = useState(settings.customApiUrl || '');
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    tested: boolean;
    ok: boolean;
    latencyMs?: number;
    message?: string;
  }>({ tested: false, ok: false });
  const [confirmClear, setConfirmClear] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingApi(true);
    const target = customApiUrl.trim() || PRIMARY_API_ENDPOINT;
    const res = await testApiConnection(target);
    setApiStatus({
      tested: true,
      ok: res.ok,
      latencyMs: res.latencyMs,
      message: res.message,
    });
    setTestingApi(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      userName: userName.trim() || 'User',
      customApiUrl: customApiUrl.trim() || undefined,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nova_ai_chats_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    const allMd = sessions.map(exportSessionAsMarkdown).join('\n\n====================\n\n');
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(allMd);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nova_ai_chats_${Date.now()}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Pengaturan Aplikasi"
    >
      <div className="w-full max-w-lg bg-[#0e1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <h2 className="text-base font-semibold text-white">Pengaturan Nova AI</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Profil */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Profil Pengguna</span>
            </div>
            <div>
              <label htmlFor="user-name-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                Nama Panggilan
              </label>
              <input
                id="user-name-input"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Section 2: API & Konektivitas */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>Backend REST API</span>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingApi}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testingApi ? 'animate-spin' : ''}`} />
                <span>{testingApi ? 'Memeriksa...' : 'Tes Koneksi'}</span>
              </button>
            </div>

            <div>
              <label htmlFor="api-endpoint-input" className="block text-xs font-medium text-slate-300 mb-1">
                Endpoint URL
              </label>
              <input
                id="api-endpoint-input"
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder={PRIMARY_API_ENDPOINT}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              />
              <span className="block mt-1 text-[11px] text-slate-400">
                Default: {PRIMARY_API_ENDPOINT}
              </span>
            </div>

            {apiStatus.tested && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  apiStatus.ok
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}
              >
                {apiStatus.ok ? (
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div>
                  <p className="font-semibold">
                    {apiStatus.ok ? 'Koneksi Berhasil' : 'Koneksi Gagal'}
                  </p>
                  <p className="mt-0.5 text-[11px] opacity-90">{apiStatus.message}</p>
                  {apiStatus.latencyMs !== undefined && (
                    <span className="block mt-1 font-mono text-[10px] text-slate-400">
                      Waktu respon: {apiStatus.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Manajemen Data */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cadangan & Ekspor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportMarkdown}
                disabled={sessions.length === 0}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition-colors disabled:opacity-40"
              >
                Ekspor Markdown (.md)
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                disabled={sessions.length === 0}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700/60 transition-colors disabled:opacity-40"
              >
                Ekspor Data JSON
              </button>
            </div>
          </div>

          {/* Section 4: Hapus Riwayat */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Area Berbahaya</span>
            </div>
            {confirmClear ? (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                <p className="text-xs text-rose-200">
                  Apakah Anda yakin ingin menghapus semua riwayat percakapan? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllChats();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                  >
                    Ya, Hapus Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={sessions.length === 0}
                className="w-full py-2 px-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-rose-900/40 text-xs font-medium transition-colors disabled:opacity-40"
              >
                Hapus Semua Riwayat Percakapan
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Pengaturan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
