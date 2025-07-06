import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  is_online: boolean;
  last_seen: Date;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(userData: {
    username: string;
    email: string;
    password: string;
    avatar?: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password, avatar)
       VALUES (?, ?, ?, ?)`,
      [userData.username, userData.email, hashedPassword, userData.avatar || null]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    return rows[0] as User;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    return rows.length > 0 ? (rows[0] as User) : null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return rows.length > 0 ? (rows[0] as User) : null;
  }

  static async updateOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await pool.execute(
      'UPDATE users SET is_online = ?, last_seen = NOW() WHERE id = ?',
      [isOnline, userId]
    );
  }

  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAllUsers(excludeUserId?: number): Promise<User[]> {
    const query = excludeUserId
      ? 'SELECT id, username, email, avatar, is_online, last_seen FROM users WHERE id != ?'
      : 'SELECT id, username, email, avatar, is_online, last_seen FROM users';

    const params = excludeUserId ? [excludeUserId] : [];
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);

    return rows as User[];
  }
}
