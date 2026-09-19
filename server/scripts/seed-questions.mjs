// Phase 17: Seed 12 new questions to the DB
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const NEW_QUESTIONS = [
  'إيه أكتر فيلم أو مسلسل غير حياتك أو فكرتك في حاجة؟',
  'إيه أكتر أغنية بتفكرك بطفولتك؟',
  'إيه قرار في حياتك لو رجعت بالزمن كنت هتغيره؟',
  'إيه أكتر يوتيوبر أو كريتور بتحب تتفرج عليه؟',
  'مين لاعب الكورة اللي شايفه underrated والناس مش مدياه حقه؟',
  'مين لاعب الكورة اللي شايفه overrated والناس مدياله أكبر من حجمه؟',
  'مين أكتر رياضي بتحبه في رياضة غير كرة القدم؟',
  'إيه أكتر حفلة موسيقية نفسك تحضرها؟',
  'إيه أكتر فرقة موسيقية نفسك تحضر حفلتها؟',
  'لو هتاخد شخصية مشهورة تعيش معاها يوم كامل، هتختار مين؟',
  'إيه أكتر وجبة تاكلها لو عرفت إنها آخر وجبة في حياتك؟',
  'إيه الحاجة اللي لو عملتها هتبقى فخور بنفسك بعد 10 سنين؟',
];

const client = await pool.connect();
try {
  console.log('🌱 Seeding 12 new questions...');
  
  let inserted = 0;
  for (const q of NEW_QUESTIONS) {
    const existing = await client.query(
      'SELECT id FROM questions WHERE text_ar = $1',
      [q]
    );
    if (existing.rows.length === 0) {
      await client.query(
        'INSERT INTO questions (text_ar, is_active) VALUES ($1, true)',
        [q]
      );
      console.log(`  ✅ Added: ${q}`);
      inserted++;
    } else {
      console.log(`  ⏭️  Already exists: ${q}`);
    }
  }
  
  console.log(`\n✅ Done! Inserted ${inserted}/${NEW_QUESTIONS.length} new questions.`);
} finally {
  client.release();
  await pool.end();
}
