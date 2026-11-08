import React from 'react';
import { Sparkles, Code2, PenLine, Cpu, Compass, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  userName?: string;
}

interface PromptSuggestion {
  category: string;
  icon: React.ReactNode;
  title: string;
  prompt: string;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectPrompt,
  userName = 'Anda',
}) => {
  const suggestions: PromptSuggestion[] = [
    {
      category: 'Pemrograman',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      title: 'Fungsi Debounce JavaScript',
      prompt: 'Buatkan fungsi debounce di JavaScript modern lengkap dengan penjelasan dan contoh penggunaannya.',
    },
    {
      category: 'Penulisan Profesional',
      icon: <PenLine className="w-4 h-4 text-sky-400" />,
      title: 'Email Pengajuan Perpanjangan',
      prompt: 'Bantu saya menyusun draf email formal dan sopan untuk meminta perpanjangan deadline tugas proyek.',
    },
    {
      category: 'Analisis & Edukasi',
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      title: 'Konsep Quantum Computing',
      prompt: 'Jelaskan konsep dasar Quantum Computing dan qubits secara sederhana dengan analogi yang mudah dipahami.',
    },
    {
      category: 'Produktivitas',
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      title: 'Metode Fokus Kerja Deep Work',
      prompt: 'Berikan 5 strategi praktis dan terbukti untuk menjaga fokus mendalam (deep work) saat bekerja.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full text-center">
      {/* Brand Icon Mark */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/20 ring-1 ring-white/20">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-500 opacity-20 blur-lg -z-10" />
      </div>

      {/* Greeting */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
        Halo, {userName}! Ada yang bisa dibantu?
      </h1>
      <p className="text-sm sm:text-base text-slate-400 max-w-lg mb-8 leading-relaxed">
        Nova AI siap membantu Anda menulis kode, menyusun dokumen, membedah konsep rumit, atau merencanakan strategi.
      </p>

      {/* Suggestion Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group relative p-4 rounded-xl bg-[#121826] hover:bg-[#182032] border border-slate-800 hover:border-slate-700/80 transition-all duration-200 text-left shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
