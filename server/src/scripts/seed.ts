import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const QUESTIONS: string[] = [
  'إيه أكتر فيلم بتحبه؟',
  'إيه لونك المفضل؟',
  'إيه أكتر عربية نفسك تجيبها؟',
  'إيه أكتر دولة نفسك تسافرها؟',
  'إيه أكتر دولة نفسك تعيش فيها؟',
  'إيه أكتر أغنية بتحبها؟',
  'إيه أكتر سورة من القرآن بتحبها؟',
  'إيه أكتر كوكب بتحبه؟',
  'إيه أكتر لعبة بتحبها؟',
  'إيه أكتر رياضة بتحبها؟',

  'مين المطرب المفضل عندك؟',
  'مين الممثل المفضل عندك؟',
  'مين لاعب الكورة المفضل عندك؟',
  'إيه ناديك المفضل؟',
  'إيه أكتر مسلسل بتحبه؟',
  'إيه شخصية الكرتون المفضلة عندك؟',
  'إيه شخصية الأنمي المفضلة عندك؟',
  'إيه شخصية السوبر هيرو المفضلة عندك؟',
  'إيه أكتر كتاب بتحبه؟',
  'إيه أكتر لعبة بلايستيشن بتحبها؟',

  'إيه أكتر أكلة بتحبها؟',
  'إيه أكتر مشروب بتحبه؟',
  'إيه الفاكهة المفضلة عندك؟',
  'إيه نوع الحلو المفضل عندك؟',
  'إيه أكتر نوع قهوة بتحبه؟',
  'إيه أكتر مطعم بتحبه؟',
  'إيه أكتر براند بتحبه؟',
  'إيه ماركة الموبايل المفضلة عندك؟',
  'إيه البراند المفضل عندك في اللبس؟',
  'إيه البراند المفضل عندك في الكوتشيات؟',

  'إيه الحيوان المفضل عندك؟',
  'إيه أكتر حيوان نفسك تربيه؟',
  'إيه أكتر لغة بتحب تسمعها؟',
  'إيه اللغة اللي نفسك تتعلمها؟',
  'إيه أكتر مادة دراسية بتحبها؟',
  'إيه أكتر مهنة كنت نفسك تشتغلها وإنت صغير؟',
  'إيه أكتر تطبيق بتحبه؟',
  'إيه أكتر منصة سوشيال ميديا بتحبها؟',
  'إيه أكتر لعبة كنت بتحبها وإنت صغير؟',
  'إيه أكتر كرتون كنت بتحبه وإنت صغير؟',

  'إيه أكتر جهاز نفسك تشتريه؟',
  'إيه أكتر اختراع بتحبه؟',
  'إيه أكتر شخصية تاريخية بتحبها؟',
  'إيه أكتر شخصية مشهورة بتحبها؟',
  'إيه أكتر رياضة نفسك تجربها؟',
  'إيه أكتر مادة بتحبها في الفن؟',
  'إيه أكتر آلة موسيقية بتحب صوتها؟',
  'إيه أكتر نوع موسيقى بتحبه؟',
  'إيه أكتر فصل دراسي كنت بتحبه؟',
  'إيه أكتر مكان بتحب تروحه؟',

  'لو كنت هتمسك وزارة، تختار وزارة إيه؟',
  'لو هتسمي ابنك، هتسميه إيه؟',
  'لو هتسمي بنتك، هتسميها إيه؟',
  'مين الـ Celebrity Crush بتاعك؟',
  'إيه أكتر فيلم كرتون بتحبه؟',
  'لو كنت هتاخد شخصية تاريخية معاك في رحلة، هتاخد مين؟',
  'لو اسمك كان أجنبي، كنت عاوز يبقى إيه؟',
  'لو هتنزل تخرج مع شخص مشهور، هتختار مين؟',
  'لو كنت هتختار حيوان يكون الـ Mascot بتاعك، تختار إيه؟',
  'لو كنت هتعيش أسبوع في زمن غير زمنك، تختار أنهي فترة؟',
  'لو كنت هتقدر تمتلك أي محل أو مكان مشهور، تختار إيه؟',
  'لو كنت هتقدر تستخدم أي Gadget من فيلم، تختار إيه؟',
  'إيه السوبر هيرو المفضل عندك؟',
  'لو كنت هتقدر تمنع اختراع واحد من الظهور أصلًا، تختار إيه؟',
  'لو كنت تقدر تعمل أي حاجة حرام هتعمل إيه؟',
  'لو كنت هتقدر تختار مهنة غريبة وتجربها يوم واحد، تختار إيه؟',
  'لو كنت هتقدر تسمع حفلة لأي فنان من التاريخ، تختار مين؟',
  'لو كنت هتقدر تحضر مباراة تاريخية من جديد، تختار أنهي مباراة؟',
];

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function seedDatabase() {
  console.log(`🌱 Seeding & Shuffling ${QUESTIONS.length} specific questions into Heggy Game Database...\n`);

  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/heggy_game',
  });

  try {
    const client = await pool.connect();

    // 1. Clear old test games, rounds, and questions
    await client.query(`
      DELETE FROM round_guesses;
      DELETE FROM round_scores;
      DELETE FROM round_answers;
      DELETE FROM game_rounds;
      DELETE FROM game_players;
      DELETE FROM games;
      DELETE FROM questions;
    `);
    console.log('🧹 Cleared all old test games, rounds, and questions.');

    // 2. Shuffle questions before inserting
    const shuffledQuestions = shuffleArray(QUESTIONS);

    for (const q of shuffledQuestions) {
      await client.query(
        'INSERT INTO questions (text_ar, is_active) VALUES ($1, true);',
        [q]
      );
    }
    console.log(`✅ Successfully inserted ${shuffledQuestions.length} shuffled questions!`);

    // 3. Verify inserted questions
    const res = await client.query('SELECT count(*) FROM questions WHERE is_active = true;');
    console.log(`\n🎉 Total Active Questions in Database: ${res.rows[0].count}`);

    const all = await client.query('SELECT id, text_ar FROM questions ORDER BY id ASC LIMIT 10;');
    console.log('\n📋 Preview of first 10 Shuffled Questions in Database:');
    all.rows.forEach((r, i) => console.log(`   ${i + 1}. ${r.text_ar}`));

    client.release();
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await pool.end();
  }
}

seedDatabase();
