import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import {
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  AlertCircle,
  User,
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { CodeBlock } from './CodeBlock';

interface ChatMessageProps {
  message: ChatMessageType;
  userName?: string;
  isLastAssistant?: boolean;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, feedback: 'up' | 'down' | null) => void;
  onRetry?: () => void;
}

interface ContentSegment {
  type: 'markdown' | 'code';
  content: string;
  language?: string;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  userName = 'Anda',
  isLastAssistant = false,
  isLoading = false,
  onRegenerate,
  onFeedback,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = message.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Split content into code blocks and markdown segments for interactive code blocks
  const segments = useMemo<ContentSegment[]>(() => {
    if (isUser) {
      return [{ type: 'markdown', content: message.content }];
    }

    const text = message.content;
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)[^\S\r\n]*\r?\n([\s\S]*?)```/g;
    const result: ContentSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'markdown',
          content: text.slice(lastIndex, match.index),
        });
      }
      result.push({
        type: 'code',
        language: match[1] ? match[1].trim() : 'code',
        content: match[2].trimEnd(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      result.push({
        type: 'markdown',
        content: text.slice(lastIndex),
      });
    }

    return result;
  }, [message.content, isUser]);

  const formattedTime = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [message.timestamp]);

  return (
    <div className="w-full py-5 px-4 sm:px-6 transition-colors">
      <div
        className={`max-w-3xl mx-auto flex gap-3.5 sm:gap-4 ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10"
              title={userName}
            >
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
          ) : (
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-sky-500/10 ring-1 ring-white/20"
              title="Nova AI"
            >
              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            </div>
          )}
        </div>

        {/* Message Container */}
        <div className={`flex flex-col flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Header info */}
          <div className="flex items-center gap-2 mb-1 text-[11px] font-medium text-slate-400">
            <span>{isUser ? userName : 'Nova AI'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{formattedTime}</span>
          </div>

          {/* Bubble content */}
          {message.isError ? (
            <div className="rounded-2xl p-4 bg-red-950/40 border border-red-500/30 text-red-200 text-sm max-w-2xl w-full">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-semibold text-red-300">Terjadi Kesalahan</p>
                  <p className="text-xs leading-relaxed text-red-200/90">{message.content}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      disabled={isLoading}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/30 hover:bg-red-600/50 text-red-100 border border-red-500/40 transition-colors disabled:opacity-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Coba Lagi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : isUser ? (
            <div className="rounded-2xl rounded-tr-sm px-4.5 py-3 bg-[#1e293b] text-slate-100 text-[14.5px] leading-relaxed shadow-sm border border-slate-700/60 max-w-xl break-words whitespace-pre-wrap">
              {message.content}
            </div>
          ) : (
            <div className="w-full text-slate-200 text-[14.5px] leading-relaxed break-words">
              {segments.map((seg, idx) => {
                if (seg.type === 'code') {
                  return (
                    <CodeBlock
                      key={idx}
                      language={seg.language || ''}
                      code={seg.content}
                    />
                  );
                }

                // Render markdown
                const parsedHtml = marked.parse(seg.content, {
                  breaks: true,
                  gfm: true,
                }) as string;

                return (
                  <div
                    key={idx}
                    className="prose-chat text-slate-200"
                    dangerouslySetInnerHTML={{ __html: parsedHtml }}
                  />
                );
              })}

              {/* Action Toolbar for AI message */}
              <div className="mt-3 pt-2 flex items-center gap-1 sm:gap-2 text-slate-400 border-t border-slate-800/60">
                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopyFull}
                  aria-label={copied ? 'Jawaban disalin' : 'Salin jawaban'}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[11px]">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Salin</span>
                    </>
                  )}
                </button>

                {/* Regenerate button (especially on last AI response) */}
                {isLastAssistant && onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    disabled={isLoading}
                    aria-label="Buat ulang jawaban"
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 transition-colors disabled:opacity-40"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-[11px]">Buat Ulang</span>
                  </button>
                )}

                {/* Thumbs Feedback */}
                {onFeedback && (
                  <div className="flex items-center gap-0.5 ml-auto sm:ml-2">
                    <button
                      type="button"
                      onClick={() =>
                        onFeedback(
                          message.id,
                          message.feedback === 'up' ? null : 'up'
                        )
                      }
                      aria-label="Tanggapan membantu"
                      className={`p-1.5 rounded-md text-xs transition-colors ${
                        message.feedback === 'up'
                          ? 'text-emerald-400 bg-emerald-500/15'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onFeedback(
                          message.id,
                          message.feedback === 'down' ? null : 'down'
                        )
                      }
                      aria-label="Tanggapan kurang memuaskan"
                      className={`p-1.5 rounded-md text-xs transition-colors ${
                        message.feedback === 'down'
                          ? 'text-rose-400 bg-rose-500/15'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
