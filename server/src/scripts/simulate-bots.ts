import { io, Socket } from 'socket.io-client';
import { pool } from '../config/db.js';

interface BotConfig {
  name: string;
  avatarId: string;
  catchphrases: string[];
}

const BOTS: BotConfig[] = [
  {
    name: 'كريم',
    avatarId: 'avatar_1',
    catchphrases: [
      'أنا طبعاً بدون نقاش 😎',
      'بيتزا بيبروني 🍕',
      'كشري مصري 🍲',
      'الموضوع ده مبيتسألش فيه 🤣',
      'روقان ع الآخر يا شباب ✌️',
    ],
  },
  {
    name: 'سارة',
    avatarId: 'avatar_2',
    catchphrases: [
      'ضربة في الظلام وسرعة خارقة 🥷',
      'سوشي ياباني 🍣',
      'شاورما عربي بالثومية 🌯',
      'لعبتكم اتكشفت في صمت 🕶️',
      'الحسابات عندي دايماً دقيقة 🧠',
    ],
  },
  {
    name: 'عمر',
    avatarId: 'avatar_3',
    catchphrases: [
      'شاورما عربي بالثومية 🌯',
      'أنا جاي أروق وأخطف الأضواء 💃',
      'ستيك مشوي فاخر 🥩',
      'غمزة واحدة وتكسب الجولة 😉',
      'أحلى مسا على الكل ✨',
    ],
  },
  {
    name: 'مريم',
    avatarId: 'avatar_4',
    catchphrases: [
      'إيه اللي بيحصل هنا ده؟! 😱',
      'نودلز كورية سبايسي 🔥',
      'مين اللي جاوب الإجابة دي بجد؟! 😳',
      'أنا مصدومة ومش مصدقة نفسي 😭',
      'برجر دبل تشيز 🍔',
    ],
  },
  {
    name: 'زياد',
    avatarId: 'avatar_5',
    catchphrases: [
      'GG يا شباب الجيم ده بتاعي 🎮',
      'تاكوس مكسيكي 🌮',
      'هاك للمنظومة وسكور في الجون ⚡',
      'القهوة مع الجيمنج عالم تاني ☕',
      'ملوخية طشة بلدي 🥄',
    ],
  },
];

const BASE_API = 'http://localhost:4000/api/v1';
const SOCKET_URL = 'http://localhost:4000';

async function registerGuest(name: string, avatarId: string): Promise<{ token: string; userId: string }> {
  const res = await fetch(`${BASE_API}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: name, avatarId }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Failed to create guest bot: ${data.message || JSON.stringify(data) || res.statusText}`);
  }

  return { token: data.data.token, userId: data.data.user.id };
}

async function resolveGameId(roomCode: string): Promise<string> {
  const res = await fetch(`${BASE_API}/games/code/${roomCode}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Room not found: ${data.message || res.statusText}`);
  }
  if (!data.data.canJoin) {
    throw new Error('Room is full or the game already started');
  }
  return data.data.gameId;
}

interface BotState {
  userId: string;
  gamePlayerId: string | null;
  currentRoundId: string | null;
}

function pickId(p: any): string | null {
  return p.gamePlayerId || p.game_player_id || p.id || null;
}

function pickUserId(p: any): string | null {
  return p.userId || p.user_id || null;
}

function connectBotSocket(token: string, gameId: string, bot: BotConfig, state: BotState) {
  const socket: Socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  const tag = `[${bot.name}]`;

  const learnSelfId = (players: any[]) => {
    if (!players || state.gamePlayerId) return;
    const me = players.find((p) => pickUserId(p) === state.userId);
    if (me) {
      state.gamePlayerId = pickId(me);
      console.log(`🤖 ${tag} عرف الـ gamePlayerId بتاعه: ${state.gamePlayerId}`);
    }
  };

  socket.on('connect', () => {
    console.log(`🤖 ${tag} متصل بنجاح بالسيرفر`);
    socket.emit('LOBBY:JOIN_ROOM', { gameId });
  });

  socket.on('GAME:CURRENT_STATE', (data: any) => {
    learnSelfId(data.players);
    if (data.game) {
      console.log(`🤖 ${tag} استلم حالة اللعبة (status=${data.game.status}, players=${data.players?.length ?? 0})`);
    }
  });

  socket.on('LOBBY:UPDATE_PLAYERS', (data: any) => {
    learnSelfId(data.players);
    console.log(`🤖 ${tag} تحديث اللاعبين (${data.players?.length ?? 0} لاعب)`);
  });

  socket.on('ROUND:START', (data: any) => {
    state.currentRoundId = data.roundId || null;
    console.log(`🤖 ${tag} بدأت مرحلة الإجابة: ${data.question?.text_ar || ''}`);
    const delay = Math.floor(Math.random() * 3000) + 1500;
    setTimeout(() => {
      if (!state.currentRoundId) return;
      const phrase = bot.catchphrases[Math.floor(Math.random() * bot.catchphrases.length)];
      console.log(`🤖 ${tag} يرسل إجابته: "${phrase}"`);
      socket.emit('ROUND:SUBMIT_ANSWER', {
        gameId,
        roundId: state.currentRoundId,
        text: phrase,
      });
    }, delay);
  });

  socket.on('ROUND:ANSWER_STATUSES', (data: any) => {
    console.log(`🤖 ${tag} حال الإجابات: ${data.submittedCount}/${data.totalPlayers}`);
  });

  socket.on('ROUND:START_MATCHING', (data: any) => {
    if (data.roundId) state.currentRoundId = data.roundId;
    console.log(`🤖 ${tag} بدأت مرحلة التخمين والتوصيل!`);
    const delay = Math.floor(Math.random() * 4000) + 2000;
    setTimeout(() => {
      const roundId = state.currentRoundId;
      if (!roundId) return;
      const answers: any[] = data.anonymousAnswers || [];
      const players: any[] = data.playersToMatch || [];
      const others = players.filter((p) => pickId(p) !== state.gamePlayerId);
      const pool = others.length > 0 ? others : players;
      const guesses = answers.map((ans) => {
        const target = pool[Math.floor(Math.random() * pool.length)];
        return {
          answerId: ans.answerId || ans.id,
          guessedPlayerId: pickId(target),
        };
      });

      console.log(`🤖 ${tag} يرسل ${guesses.length} تخمينات`);
      socket.emit('MATCHING:SUBMIT_GUESSES', { gameId, roundId, guesses });
    }, delay);
  });

  socket.on('ROUND:RESULTS', (data: any) => {
    console.log(`🤖 ${tag} تم كشف نتائج الجولة ${data.roundNumber}!`);
  });

  socket.on('GAME:FINAL_RESULTS', (data: any) => {
    console.log(`🤖 ${tag} انتهت المباراة 🎉 الفائز: ${data.winner?.nickname ?? '؟'}`);
  });

  socket.on('LOBBY:ERROR', (e: any) => console.error(`🤖 ${tag} LOBBY:ERROR:`, e?.message));
  socket.on('GAME:ERROR', (e: any) => console.error(`🤖 ${tag} GAME:ERROR:`, e?.message));
  socket.on('ROUND:ERROR', (e: any) => console.error(`🤖 ${tag} ROUND:ERROR:`, e?.message));
  socket.on('MATCHING:ERROR', (e: any) => console.error(`🤖 ${tag} MATCHING:ERROR:`, e?.message));

  socket.on('disconnect', () => {
    console.log(`🤖 ${tag} انقطع الاتصال`);
  });

  return socket;
}

async function main() {
  const roomCode = process.argv[2]?.toUpperCase();

  if (!roomCode) {
    console.error('❌ الرجاء إدخال كود الغرفة كوسيط (Argument). مثال:');
    console.error('   npm run bots 8R3VNC');
    process.exit(1);
  }

  console.log(`🚀 بدء محاكاة شلة الأصحاب في الغرفة: ${roomCode}...`);

  const gameId = await resolveGameId(roomCode);
  console.log(`🎮 gameId = ${gameId}`);

  const sockets: Socket[] = [];

  for (const bot of BOTS) {
    try {
      console.log(`⏳ تسجيل ${bot.name}...`);
      const { token, userId } = await registerGuest(bot.name, bot.avatarId);
      console.log(`   تم التسجيل (userId: ${userId})`);

      const state: BotState = { userId, gamePlayerId: null, currentRoundId: null };
      const sock = connectBotSocket(token, gameId, bot, state);
      sockets.push(sock);

      await new Promise((r) => setTimeout(r, 600));
    } catch (err: any) {
      console.error(`❌ فشل انضمام ${bot.name}:`, err.message);
    }
  }

  console.log(`✅ انضم ${sockets.length} بوتات للغرفة ${roomCode} — ابدأ اللعبة من حساب المضيف!`);
  console.log('اضغط Ctrl+C لإنهاء المحاكاة وفصل الاتصال.');

  process.on('SIGINT', async () => {
    console.log('\n🛑 إغلاق الاتصالات...');
    sockets.forEach((s) => s.disconnect());
    await pool.end();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
