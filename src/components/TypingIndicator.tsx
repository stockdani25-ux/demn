import React from 'react';
import { Sparkles } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="w-full py-5 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex gap-3.5 sm:gap-4 items-start">
        {/* Animated Avatar */}
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 ring-1 ring-white/20 animate-pulse">
            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Typing Bubble */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2 mb-1 text-[11px] font-medium text-slate-400">
            <span>Nova AI</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">Mengetik...</span>
          </div>

          <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#131b2e] border border-sky-500/20 shadow-sm text-slate-300">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-2 text-xs text-slate-400 font-medium">Sedang memproses jawaban...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
