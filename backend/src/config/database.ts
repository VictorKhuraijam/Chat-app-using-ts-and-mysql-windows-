import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// const dbConfig = {
//   host: process.env.DB_HOST || 'localhost',
//   port: parseInt(process.env.DB_PORT || '3306'),
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'chat_app',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   acquireTimeout: 60000,
//   timeout: 60000,
// };

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

};

export const pool = mysql.createPool(dbConfig);

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
