// Global type definitions for better type safety. This file is for schema validation
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Chat {
  id: string;
  name: string;
  description?: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  isGroup: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  isEdited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface ChatState {
  currentChat: Chat | null;
  chats: Chat[];
  messages: Message[];
  users: User[];
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T = any> {
  success?: boolean
  data: T;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// WebSocket event types
export interface WebSocketEvents {
  'user:join': { userId: string; chatId: string };
  'user:leave': { userId: string; chatId: string };
  'message:new': Message;
  'message:edit': { messageId: string; content: string };
  'message:delete': { messageId: string };
  'typing:start': { userId: string; chatId: string };
  'typing:stop': { userId: string; chatId: string };
  'user:online': { userId: string };
  'user:offline': { userId: string };
}

export type WebSocketEventType = keyof WebSocketEvents;
