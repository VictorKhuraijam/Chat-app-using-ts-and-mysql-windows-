export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  is_online: boolean;
  last_seen: Date;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  created_at: Date;
  sender_username?: string;
  receiver_username?: string;
}

export interface Conversation {
  other_user_id: number;
  other_username: string;
  other_avatar?: string;
  last_message: string;
  last_message_time: Date;
  unread_count: number;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface SendMessageData {
  receiver_id: number;
  content: string;
  message_type?: 'text' | 'image' | 'file';
}

export interface TypingData {
  userId: number;
  username: string;
  typing: boolean;
}
