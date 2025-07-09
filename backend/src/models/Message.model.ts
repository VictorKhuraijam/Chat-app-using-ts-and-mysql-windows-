import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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

export class MessageModel {

  static async create(messageData: {
    sender_id: number;
    receiver_id: number;
    content: string;
    message_type?: 'text' | 'image' | 'file';
  }): Promise<Message> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO messages (sender_id, receiver_id, content, message_type)
       VALUES (?, ?, ?, ?)`,
      [
        messageData.sender_id,
        messageData.receiver_id,
        messageData.content,
        messageData.message_type || 'text'
      ]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT m.*,
              s.username as sender_username,
              r.username as receiver_username
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    return rows[0] as Message;
  }

  static async getConversation(userId1: number, userId2: number, limit: number = 50): Promise<Message[]> {
     const numericLimit = Number(limit);

  if (
    typeof userId1 !== 'number' ||
    typeof userId2 !== 'number' ||
    isNaN(numericLimit)
  ) {
    throw new Error('Invalid parameters for getConversation');
  }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT m.*,
              s.username as sender_username,
              r.username as receiver_username
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at DESC
       LIMIT ${numericLimit}`,
      [userId1, userId2, userId2, userId1]
    );

    console.log('[getConversation] Params:', userId1, userId2, numericLimit);


    return (rows as Message[]).reverse();
  }

  static async markAsRead(messageId: number): Promise<void> {
    await pool.execute(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [messageId]
    );
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
      [userId]
    );

    return rows[0].count;
  }

  static async getRecentConversations(userId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        CASE
          WHEN m.sender_id = ? THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        CASE
          WHEN m.sender_id = ? THEN r.username
          ELSE s.username
        END as other_username,
        CASE
          WHEN m.sender_id = ? THEN r.avatar
          ELSE s.avatar
        END as other_avatar,
        m.content as last_message,
        m.created_at as last_message_time,
        COUNT(CASE WHEN m.receiver_id = ? AND m.is_read = FALSE THEN 1 END) as unread_count
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       GROUP BY other_user_id, other_username, other_avatar
       ORDER BY m.created_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );

    return rows as any[];
  }

   // NEW: Find message by ID
  static async findById(messageId: number): Promise<Message | null> {
    const [rows] = await pool.execute(
      `SELECT m.*,
              s.username as sender_username,
              r.username as receiver_username
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.id = ?`,
      [messageId]
    );

    const messages = rows as Message[];
    return messages.length > 0 ? messages[0] : null;
  }

  // NEW: Delete message by ID
  static async deleteById(messageId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM messages WHERE id = ?',
      [messageId]
    );

    return result.affectedRows > 0;
  }

  // NEW: Delete entire conversation between two users
  static async deleteConversation(userId1: number, userId2: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `DELETE FROM messages
       WHERE (sender_id = ? AND receiver_id = ?)
          OR (sender_id = ? AND receiver_id = ?)`,
      [userId1, userId2, userId2, userId1]
    );

    return result.affectedRows;
  }

  // NEW: Delete all messages sent by a specific user
  static async deleteAllUserMessages(userId: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM messages WHERE sender_id = ?',
      [userId]
    );

    return result.affectedRows;
  }

  // NEW: Soft delete message (mark as deleted instead of actually deleting)
  // You might want to add a 'deleted_at' column to your messages table for this
  static async softDeleteById(messageId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE messages SET deleted_at = NOW() WHERE id = ?',
      [messageId]
    );

    return result.affectedRows > 0;
  }

  // NEW: Delete messages older than specified days
  static async deleteOldMessages(days: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );

    return result.affectedRows;
  }
}
