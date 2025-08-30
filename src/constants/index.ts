// Application-wide constants
export const APP_NAME = 'Project Zero Chat';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Real-time chat application';

// UI Constants
export const SIDEBAR_WIDTH = {
  MOBILE: '280px',
  DESKTOP: '320px',
} as const;

export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Chat Constants
export const CHAT_LIMITS = {
  MESSAGE_MAX_LENGTH: 1000,
  CHAT_NAME_MAX_LENGTH: 50,
  MAX_PARTICIPANTS: 50,
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;

// Supported file types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  ...SUPPORTED_IMAGE_TYPES,
] as const;

// WebSocket Constants
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  MESSAGE_NEW: 'message:new',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_FAILED: 'Authentication failed. Please login again.',
  CHAT_NOT_FOUND: 'Chat not found.',
  MESSAGE_SEND_FAILED: 'Failed to send message. Please try again.',
  FILE_TOO_LARGE: 'File too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
  PASSWORDS_NOT_MATCH: 'Passwords do not match.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTER_SUCCESS: 'Account created successfully!',
  MESSAGE_SENT: 'Message sent!',
  CHAT_CREATED: 'Chat created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  CHAT_SETTINGS: 'chat_settings',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// API Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;
