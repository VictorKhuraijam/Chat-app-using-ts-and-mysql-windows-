import api from './api';
import type { Message, Conversation, SendMessageData } from '../types';

export const messageService = {
  async sendMessage(data: SendMessageData) {
    const response = await api.post('/messages', data);
    return response.data;
  },

  async getConversation(userId: number, limit = 50): Promise<Message[]> {
    const response = await api.get(`/messages/conversation/${userId}?limit=${limit}`);
    return response.data.messages;
  },

  async getRecentConversations(): Promise<Conversation[]> {
    const response = await api.get('/messages/conversations');
    return response.data.conversations;
  },

  async markAsRead(messageId: number) {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/messages/unread-count');
    return response.data.unread_count;
  },

  async deleteMessage(messageId: number) {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  async deleteConversation(userId: number) {
    const response = await api.delete(`/messages/conversations/${userId}`);
    return response.data;
  },

  async deleteAllMessages() {
    const response = await api.delete('/messages/user/all');
    return response.data;
  }
};
