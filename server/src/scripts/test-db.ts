import { pool, testDbConnection } from '../config/db.js';

async function run() {
  console.log('Testing PostgreSQL connection...');
  await testDbConnection();

  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    console.log('\n📊 Tables currently in PostgreSQL:');
    if (res.rows.length === 0) {
      console.log('⚠️ No tables found in database. The schema SQL has not been executed yet.');
    } else {
      res.rows.forEach((r) => console.log(`  ✅ ${r.table_name}`));
    }
  } catch (err) {
    console.error('❌ Query error:', err);
  } finally {
    await pool.end();
  }
}

run();
