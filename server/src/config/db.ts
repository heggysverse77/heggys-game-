// Config: Database connection pool configuration
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isRemoteDb =
  process.env.DATABASE_URL?.includes('supabase') ||
  process.env.DATABASE_URL?.includes('pooler.supabase.com') ||
  process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/heggy_game',
  max: 20, // Max 20 concurrent connections
  idleTimeoutMillis: 30000,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
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

export default pool;
