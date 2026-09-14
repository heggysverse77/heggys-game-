import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function setupAndMigrate() {
  console.log('🚀 Initializing Heggy Game Database & Running Migrations...\n');

  // 1. Connect to default 'postgres' database to ensure 'heggy_game' exists
  const rootUrl =
    process.env.DATABASE_URL?.replace('/heggy_game', '/postgres') ||
    'postgresql://postgres:postgres@localhost:5432/postgres';

  const rootPool = new Pool({ connectionString: rootUrl });

  try {
    const checkDb = await rootPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'heggy_game';"
    );

    if (checkDb.rows.length === 0) {
      console.log("📦 Creating database 'heggy_game'...");
      await rootPool.query('CREATE DATABASE heggy_game;');
      console.log("✅ Database 'heggy_game' created successfully!");
    } else {
      console.log("✅ Database 'heggy_game' already exists.");
    }
  } catch (err) {
    console.error('⚠️ Could not check/create database via root pool:', err);
  } finally {
    await rootPool.end();
  }

  // 2. Connect directly to 'heggy_game' database to run schema and seeds
  const gamePool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/heggy_game',
  });

  try {
    const schemaPath = path.resolve(process.cwd(), 'src/database/schema.sql');
    const seedPath = path.resolve(process.cwd(), 'src/database/seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    console.log('📜 Executing schema.sql (Tables, Types, Constraints)...');
    await gamePool.query(schemaSql);
    console.log('✅ Tables, Types, and Indexes created successfully!');

    console.log('🌱 Executing seed.sql (Questions, Dares, Canonical Aliases)...');
    await gamePool.query(seedSql);
    console.log('✅ Seed Data inserted successfully!');

    console.log('\n🎉 ALL DONE! Database is 100% migrated and ready for gameplay!\n');
  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await gamePool.end();
  }
}

setupAndMigrate();
