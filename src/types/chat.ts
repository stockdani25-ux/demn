export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
  feedback?: 'up' | 'down' | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface UserSettings {
  userName: string;
  avatarSeed: string;
  theme: 'dark' | 'light';
  customApiUrl?: string;
  systemPrompt?: string;
}

export interface ApiResponse {
  success: boolean;
  reply?: string;
  error?: string;
}
