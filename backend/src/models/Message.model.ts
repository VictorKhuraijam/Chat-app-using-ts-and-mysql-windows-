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

  static async markConversationAsReadBetweenUsers(readerId: number, senderId: number): Promise<void> {
    await pool.execute(
      'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ? AND is_read = FALSE',
      [readerId, senderId]
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
       `
        SELECT
          u.id AS other_user_id,
          u.username AS other_username,
          u.avatar AS other_avatar,
          m.content AS last_message,
          m.created_at AS last_message_time,
          (
            SELECT COUNT(*)
            FROM messages
            WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE
          ) AS unread_count
        FROM (
          SELECT
            CASE
              WHEN sender_id = ? THEN receiver_id
              ELSE sender_id
            END AS user_id,
            MAX(created_at) AS last_time
          FROM messages
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY user_id
        ) AS recent
        JOIN users u ON u.id = recent.user_id
        JOIN messages m ON (
          ((m.sender_id = ? AND m.receiver_id = u.id) OR (m.sender_id = u.id AND m.receiver_id = ?))
          AND m.created_at = recent.last_time
        )
        ORDER BY m.created_at DESC
        `,
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
