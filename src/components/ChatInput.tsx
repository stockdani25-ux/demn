import React, { useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  onStop,
  placeholder = 'Kirim pesan ke Nova AI...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height up to 200px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 200);
    el.style.height = `${Math.max(newHeight, 48)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSend(value);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      if (onStop) onStop();
      return;
    }
    if (value.trim()) {
      onSend(value);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end rounded-2xl bg-[#141b29] border border-slate-700/70 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-xl transition-all duration-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={false}
            className="w-full py-3.5 pl-4 pr-14 text-sm text-slate-100 placeholder-slate-500 bg-transparent resize-none outline-none leading-relaxed overflow-y-auto max-h-[200px]"
            aria-label="Pesan untuk AI"
          />

          <div className="absolute right-2 bottom-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Hentikan pembuatan pesan"
                className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all duration-150 shadow-md shadow-rose-600/30"
                title="Hentikan pembuatan pesan"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!value.trim()}
                aria-label="Kirim pesan"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  value.trim()
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-md shadow-emerald-500/25 active:scale-95'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                title={value.trim() ? 'Kirim pesan (Enter)' : 'Ketik pesan terlebih dahulu'}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-500">
          <span>
            Tekan <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400 font-mono text-[10px]">Enter</kbd> untuk kirim, <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400 font-mono text-[10px]">Shift + Enter</kbd> baris baru
          </span>
          <span className="hidden sm:inline">Nova AI Assistant</span>
        </div>
      </form>
    </div>
  );
};
