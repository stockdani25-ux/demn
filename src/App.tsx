/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu,
  Plus,
  ArrowDown,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { ChatSession, UserSettings } from './types/chat';
import {
  createSession,
  addMessageToSession,
  updateMessageFeedback,
  renameSession,
  removeLastAssistantMessage,
  loadSessionsFromStorage,
  saveSessionsToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  STORAGE_KEY_ACTIVE_SESSION,
} from './utils/chatStorage';
import { sendChatMessage } from './services/chatApi';
import { Sidebar } from './components/Sidebar';
import { ChatMessageItem } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  // Persistence state
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessionsFromStorage());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (saved) return saved;
    }
    const initial = loadSessionsFromStorage();
    return initial.length > 0 ? initial[0].id : null;
  });

  const [userSettings, setUserSettings] = useState<UserSettings>(() => loadSettingsFromStorage());
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isRenamingHeader, setIsRenamingHeader] = useState(false);
  const [headerTitleDraft, setHeaderTitleDraft] = useState('');

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    if (activeSessionId && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, activeSessionId);
    }
  }, [activeSessionId]);

  // Sync settings
  const handleSaveSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  // Current active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Detect scroll position for "scroll to bottom" button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 150);
  };

  // Scroll to bottom when messages change or loading state starts
  useEffect(() => {
    scrollToBottom(true);
  }, [activeSession?.messages.length, isLoading, scrollToBottom]);

  // Create new chat
  const handleNewChat = () => {
    const newSession = createSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputMessage('');
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Select existing session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Rename session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? renameSession(s, newTitle) : s))
    );
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  // Clear all chats
  const handleClearAllChats = () => {
    setSessions([]);
    setActiveSessionId(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // Send message
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    // Ensure session exists
    let targetSession = activeSession;
    let currentSessions = sessions;

    if (!targetSession) {
      targetSession = createSession();
      currentSessions = [targetSession, ...sessions];
      setSessions(currentSessions);
      setActiveSessionId(targetSession.id);
    }

    // Add user message
    const { updatedSession: sessionWithUser } = addMessageToSession(
      targetSession,
      'user',
      trimmed
    );

    // Update state with user message
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionWithUser.id ? sessionWithUser : s))
    );
    setInputMessage('');
    setIsLoading(true);

    // Setup abort controller for cancelation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const reply = await sendChatMessage({
        message: trimmed,
        signal: controller.signal,
        customEndpoint: userSettings.customApiUrl,
      });

      // Add assistant response
      const { updatedSession: sessionWithAssistant } = addMessageToSession(
        sessionWithUser,
        'assistant',
        reply
      );

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionWithAssistant.id ? sessionWithAssistant : s))
      );
    } catch (err: unknown) {
      const isAbort = controller.signal.aborted;
      const errorMsg = isAbort
        ? 'Pembuatan jawaban dihentikan oleh pengguna.'
        : err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menghubungi server AI.';

      const { updatedSession: sessionWithError } = addMessageToSession(
        sessionWithUser,
        'assistant',
        errorMsg,
        !isAbort // only flag as error if not user abort
      );

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionWithError.id ? sessionWithError : s))
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = async () => {
    if (!activeSession || isLoading) return;

    const { updatedSession, lastUserMessage } = removeLastAssistantMessage(activeSession);
    if (!lastUserMessage) return;

    // Save popped session
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const reply = await sendChatMessage({
        message: lastUserMessage.content,
        signal: controller.signal,
        customEndpoint: userSettings.customApiUrl,
      });

      const { updatedSession: sessionWithReply } = addMessageToSession(
        updatedSession,
        'assistant',
        reply
      );

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionWithReply.id ? sessionWithReply : s))
      );
    } catch (err: unknown) {
      const isAbort = controller.signal.aborted;
      const errorMsg = isAbort
        ? 'Pembuatan jawaban dihentikan oleh pengguna.'
        : err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat memproses jawaban baru.';

      const { updatedSession: sessionWithError } = addMessageToSession(
        updatedSession,
        'assistant',
        errorMsg,
        !isAbort
      );

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionWithError.id ? sessionWithError : s))
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Feedback (thumbs up / down)
  const handleFeedback = (messageId: string, feedback: 'up' | 'down' | null) => {
    if (!activeSession) return;
    const updated = updateMessageFeedback(activeSession, messageId, feedback);
    setSessions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        userSettings={userSettings}
      />

      {/* Main Chat Canvas */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative bg-[#0b0f17]">
        {/* Top Navbar */}
        <header className="h-14 px-4 sm:px-6 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0b0f17]/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Buka menu sidebar"
                className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Buka sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Active Session Title (Editable inline) */}
            {activeSession && (
              <div className="flex items-center gap-2 min-w-0">
                {isRenamingHeader ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={headerTitleDraft}
                      onChange={(e) => setHeaderTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSession(activeSession.id, headerTitleDraft);
                          setIsRenamingHeader(false);
                        } else if (e.key === 'Escape') {
                          setIsRenamingHeader(false);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 text-xs text-white border border-slate-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleRenameSession(activeSession.id, headerTitleDraft);
                        setIsRenamingHeader(false);
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderTitleDraft(activeSession.title);
                      setIsRenamingHeader(true);
                    }}
                    className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors truncate text-left"
                    title="Klik untuk mengubah nama percakapan"
                  >
                    <span className="truncate max-w-[220px] sm:max-w-md">
                      {activeSession.title}
                    </span>
                    <Edit3 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Header: Model badge & Quick New Chat */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] font-medium text-slate-300">Nova AI Model</span>
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              aria-label="Percakapan baru"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Percakapan Baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Stream Scroll Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto flex flex-col"
        >
          {!activeSession || activeSession.messages.length === 0 ? (
            <WelcomeScreen
              userName={userSettings.userName}
              onSelectPrompt={(p) => {
                handleSendMessage(p);
              }}
            />
          ) : (
            <div className="flex-1 py-4 divide-y divide-slate-800/40">
              {activeSession.messages.map((msg, index) => {
                const isLastAssistant =
                  msg.role === 'assistant' &&
                  index === activeSession.messages.length - 1;

                return (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    userName={userSettings.userName}
                    isLastAssistant={isLastAssistant}
                    isLoading={isLoading}
                    onRegenerate={handleRegenerate}
                    onFeedback={handleFeedback}
                    onRetry={handleRegenerate}
                  />
                );
              })}

              {/* Typing indicator */}
              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            aria-label="Gulir ke pesan terbaru"
            className="absolute bottom-24 right-6 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-xl transition-all hover:scale-105 z-20"
            title="Pesan terbaru"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Bottom Chat Input */}
        <footer className="shrink-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17] to-transparent pt-2">
          <ChatInput
            value={inputMessage}
            onChange={setInputMessage}
            onSend={handleSendMessage}
            isLoading={isLoading}
            onStop={handleStopGeneration}
          />
        </footer>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={userSettings}
        onSaveSettings={handleSaveSettings}
        sessions={sessions}
        onClearAllChats={handleClearAllChats}
      />
    </div>
  );
}
