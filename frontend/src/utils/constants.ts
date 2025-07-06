export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  MESSAGES: {
    SEND: '/messages',
    CONVERSATION: '/messages/conversation',
    CONVERSATIONS: '/messages/conversations',
    READ: '/messages/read',
    UNREAD_COUNT: '/messages/unread-count',
  },
  USERS: {
    LIST: '/users',
  },
} as const;
