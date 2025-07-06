import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = {
  host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '62V3@bvr',
  database: process.env.DB_NAME || 'chat_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
//   acquireTimeout: 60000,
//   timeout: 60000,
};

export const pool = mysql.createPool(db);

// Test database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
