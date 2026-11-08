import { ChatMessage, ChatSession, Role, UserSettings } from '../types/chat';

export const STORAGE_KEY_SESSIONS = 'nova_chat_sessions_v1';
export const STORAGE_KEY_SETTINGS = 'nova_chat_settings_v1';
export const STORAGE_KEY_ACTIVE_SESSION = 'nova_chat_active_session_id';

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'User',
  avatarSeed: 'nova-user',
  theme: 'dark',
};

/**
 * Generates an intelligent, clean title from user prompt (up to 45 chars).
 */
export function generateChatTitle(prompt: string): string {
  if (!prompt || !prompt.trim()) return 'Percakapan Baru';
  const clean = prompt.trim().replace(/\s+/g, ' ');
  if (clean.length <= 45) return clean;
  // Truncate neatly at last space if possible
  const cut = clean.slice(0, 45);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 20) {
    return cut.slice(0, lastSpace) + '...';
  }
  return cut + '...';
}

/**
 * Creates a new blank chat session.
 */
export function createSession(title = 'Percakapan Baru'): ChatSession {
  const now = Date.now();
  return {
    id: 'chat_' + now + '_' + Math.random().toString(36).substring(2, 8),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

/**
 * Appends a message to a session and updates timestamp.
 * If this is the first user message and title was default, auto-titles it.
 */
export function addMessageToSession(
  session: ChatSession,
  role: Role,
  content: string,
  isError = false
): { updatedSession: ChatSession; newMessage: ChatMessage } {
  const now = Date.now();
  const newMessage: ChatMessage = {
    id: 'msg_' + now + '_' + Math.random().toString(36).substring(2, 8),
    role,
    content,
    timestamp: now,
    isError,
  };

  let title = session.title;
  if (role === 'user' && (session.title === 'Percakapan Baru' || !session.title)) {
    title = generateChatTitle(content);
  }

  const updatedSession: ChatSession = {
    ...session,
    title,
    updatedAt: now,
    messages: [...session.messages, newMessage],
  };

  return { updatedSession, newMessage };
}

/**
 * Updates user feedback on an assistant message (thumbs up/down).
 */
export function updateMessageFeedback(
  session: ChatSession,
  messageId: string,
  feedback: 'up' | 'down' | null
): ChatSession {
  return {
    ...session,
    messages: session.messages.map((msg) =>
      msg.id === messageId ? { ...msg, feedback } : msg
    ),
  };
}

/**
 * Renames a chat session.
 */
export function renameSession(session: ChatSession, newTitle: string): ChatSession {
  const clean = newTitle.trim();
  return {
    ...session,
    title: clean || session.title,
    updatedAt: Date.now(),
  };
}

/**
 * Deletes a message from a session (useful for regeneration).
 */
export function removeLastAssistantMessage(session: ChatSession): {
  updatedSession: ChatSession;
  lastUserMessage?: ChatMessage;
} {
  const messages = [...session.messages];
  if (messages.length === 0) return { updatedSession: session };

  let lastUserMsg: ChatMessage | undefined;
  // If last is assistant, pop it
  if (messages[messages.length - 1].role === 'assistant') {
    messages.pop();
  }
  // Find last user message
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      lastUserMsg = messages[i];
      break;
    }
  }

  return {
    updatedSession: {
      ...session,
      updatedAt: Date.now(),
      messages,
    },
    lastUserMessage: lastUserMsg,
  };
}

/**
 * Pure search filter for chat sessions by title or message content.
 */
export function searchSessions(sessions: ChatSession[], query: string): ChatSession[] {
  const q = query.trim().toLowerCase();
  if (!q) return sessions;

  return sessions.filter((s) => {
    if (s.title.toLowerCase().includes(q)) return true;
    return s.messages.some((m) => m.content.toLowerCase().includes(q));
  });
}

/**
 * Safe local storage loader for sessions.
 */
export function loadSessionsFromStorage(storage?: Storage): ChatSession[] {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return [];
    const raw = s.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item.id === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Safe local storage saver for sessions.
 */
export function saveSessionsToStorage(sessions: ChatSession[], storage?: Storage): void {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return;
    s.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save chat sessions to localStorage:', err);
  }
}

/**
 * Safe local storage loader for settings.
 */
export function loadSettingsFromStorage(storage?: Storage): UserSettings {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return DEFAULT_SETTINGS;
    const raw = s.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Safe local storage saver for settings.
 */
export function saveSettingsToStorage(settings: UserSettings, storage?: Storage): void {
  try {
    const s = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!s) return;
    s.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Formats a chat session as Markdown export.
 */
export function exportSessionAsMarkdown(session: ChatSession): string {
  const dateStr = new Date(session.createdAt).toLocaleString('id-ID');
  let md = `# ${session.title}\n*Tanggal: ${dateStr}*\n\n---\n\n`;
  for (const m of session.messages) {
    const roleLabel = m.role === 'user' ? '👤 Pengguna' : '🤖 Nova AI';
    md += `### ${roleLabel}\n\n${m.content}\n\n`;
  }
  return md;
}
