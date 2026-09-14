// Config: Database connection pool configuration
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/heggy_game',
  max: 20, // Max 20 concurrent connections
  idleTimeoutMillis: 30000,
});

export const testDbConnection = async () => {
  try {
    const connection = await pool.connect();
    console.log('✅ PostgreSQL Database connected successfully!');
    connection.release();
  } catch (err) {
    console.error('❌ PostgreSQL Database connection error:', err);
  }
};
