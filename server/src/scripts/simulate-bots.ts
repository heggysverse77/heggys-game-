import { io, Socket } from 'socket.io-client';
import { pool } from '../config/db.js';

interface BotConfig {
  name: string;
  avatarId: string;
  catchphrases: string[];
}

const BOTS: BotConfig[] = [
  {
    name: 'كريم التحدي ⚡',
    avatarId: 'avatar_1',
    catchphrases: [
      'أنا طبعاً بدون نقاش 😎',
      'الموضوع ده مبيتسألش فيه 🤣',
      'لو قولت مين هتزعلو مني 🤐',
      'هو في غيره بيعملها كل يوم؟ 😂',
      'أنا بريء المرة دي صدقوني 🙈',
    ],
  },
  {
    name: 'سارة الفرفوشة 🎭',
    avatarId: 'avatar_2',
    catchphrases: [
      'أكيد فلان بدون أدنى شك 💅',
      'الموقف ده فكرني بيوم الخميس اللي فات 😂',
      'مستحيل اعترف بالحقيقة 🤫',
      'دي تصرفات معروفة ومحفوظة 🤣',
      'أنا مش هقول عشان الفضايح 💃',
    ],
  },
  {
    name: 'عمر الذكي 🧠',
    avatarId: 'avatar_4',
    catchphrases: [
      'التحليلات العلمية بتقول إنه أنا 🤖',
      'من واقع الخبرة الميدانية هو صاحبنا 🎮',
      'البصمات تدل على الفاعل بوضوح 🕵️',
      'مش هحرق المفاجأة هسيبكم تخمنوا 🕶️',
      'يا جماعة عيب نطلع أسرار بعض كده 😅',
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
    throw new Error(`Failed to create guest bot: ${data.message || res.statusText}`);
  }

  return {
    token: data.data.token,
    userId: data.data.user.id,
  };
}

async function findRoom(roomCodeArg?: string): Promise<{ gameId: string; roomCode: string }> {
  if (roomCodeArg && roomCodeArg.trim()) {
    const code = roomCodeArg.trim().toUpperCase();
    const res = await fetch(`${BASE_API}/games/code/${code}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Room code [${code}] not found or invalid.`);
    }
    return { gameId: data.data.gameId, roomCode: code };
  }

  // Auto-find latest active room in LOBBY state
  const dbRes = await pool.query(
    "SELECT id, room_code FROM games WHERE status = 'LOBBY' ORDER BY created_at DESC LIMIT 1;"
  );

  if (dbRes.rows.length === 0) {
    throw new Error(
      'لم يتم العثور على أي غرفة نشطة حالياً! أنشئ غرفة أولاً من المتصفح أو اكتب الكود كالتالي:\n   npm run bots <ROOM_CODE>'
    );
  }

  return {
    gameId: dbRes.rows[0].id,
    roomCode: dbRes.rows[0].room_code,
  };
}

async function startBots() {
  console.log('\n🤖=======================================================');
  console.log('       🎮 HEGGY GAME TEST BOTS SIMULATOR 🎮');
  console.log('=======================================================\n');

  const argCode = process.argv[2];

  let roomInfo: { gameId: string; roomCode: string };
  try {
    roomInfo = await findRoom(argCode);
    console.log(`🎯 Target Room: [${roomInfo.roomCode}] (Game ID: ${roomInfo.gameId})`);
  } catch (err: any) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  const { gameId, roomCode } = roomInfo;
  const activeSockets: Socket[] = [];

  for (let i = 0; i < BOTS.length; i++) {
    const botCfg = BOTS[i];
    try {
      console.log(`🤖 Initializing [${botCfg.name}]...`);
      const { token, userId } = await registerGuest(botCfg.name, botCfg.avatarId);

      const socket: Socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      activeSockets.push(socket);

      socket.on('connect', () => {
        console.log(`   ✅ [${botCfg.name}] Connected via socket! Joining lobby...`);
        socket.emit('LOBBY:JOIN_ROOM', {
          gameId,
          nickname: botCfg.name,
        });
      });

      socket.on('LOBBY:UPDATE_PLAYERS', (payload: any) => {
        console.log(`   👥 [${botCfg.name}] sees updated player list (${payload.players.length} players)`);
      });

      // Handle Round Start -> Submit secret answer after 1.5 - 3.5s
      socket.on('ROUND:START', async (payload: any) => {
        const { roundId, roundNumber, question } = payload;
        console.log(`   🎯 [${botCfg.name}] Round ${roundNumber} started! Question: "${question?.text_ar || question?.text_en}"`);

        const delay = 1500 + Math.random() * 2000 + i * 400;
        setTimeout(() => {
          const phraseIdx = (roundNumber + i) % botCfg.catchphrases.length;
          const answerText = botCfg.catchphrases[phraseIdx];

          console.log(`   ✍️ [${botCfg.name}] Submitting answer: "${answerText}"`);
          socket.emit('ROUND:SUBMIT_ANSWER', {
            gameId,
            roundId,
            text: answerText,
          });
        }, delay);
      });

      // Handle Matching Phase -> Submit valid guesses after 1.5 - 3.5s
      socket.on('ROUND:START_MATCHING', async (payload: any) => {
        const { roundId } = payload;
        const answers = payload.anonymousAnswers || payload.answers || [];
        const players = payload.playersToMatch || payload.players || [];

        console.log(`   🔍 [${botCfg.name}] Matching phase started! Total answers: ${answers.length}, Total players: ${players.length}`);

        const delay = 1500 + Math.random() * 1500 + i * 300;
        setTimeout(() => {
          if (answers.length === 0 || players.length === 0) {
            console.warn(`   ⚠️ [${botCfg.name}] No answers or players to match!`);
            return;
          }

          // Exclude self from potential answers and candidates
          const otherAnswers = answers.filter((a: any) => a.authorUserId !== userId);
          const otherPlayers = players.filter((p: any) => p.userId !== userId);

          if (otherPlayers.length === 0) return;

          const shuffledPlayers = [...otherPlayers].sort(() => Math.random() - 0.5);
          const guesses = otherAnswers.map((ans: any, idx: number) => ({
            answerId: ans.answerId,
            guessedPlayerId: shuffledPlayers[idx % shuffledPlayers.length]?.gamePlayerId || otherPlayers[0]?.gamePlayerId,
          }));

          console.log(`   🎲 [${botCfg.name}] Submitting ${guesses.length} matching guesses...`);
          socket.emit('MATCHING:SUBMIT_GUESSES', {
            gameId,
            roundId,
            guesses,
          });
        }, delay);
      });

      socket.on('MATCHING:ERROR', (err: any) => {
        console.error(`   ⚠️ [${botCfg.name}] Matching error:`, err.message);
      });

      // Handle Dare Announcement
      socket.on('DARE:ANNOUNCED', (payload: any) => {
        console.log(`   😈 [${botCfg.name}] Dare Announced for loser [${payload.loserNickname}]! Dare: "${payload.title}"`);
        if (payload.loserUserId === userId) {
          console.log(`   💥 [${botCfg.name}] I am the loser! Completing dare in 3 seconds...`);
          setTimeout(() => {
            socket.emit('DARE:COMPLETE', {
              gameId,
              assignmentId: payload.assignmentId,
            });
          }, 3000);
        }
      });

      socket.on('GAME:FINAL_RESULTS', () => {
        console.log(`   🏆 [${botCfg.name}] Game finished! Celebrations! 🎉`);
      });

      socket.on('disconnect', () => {
        console.log(`   🔌 [${botCfg.name}] Disconnected.`);
      });

      // Stagger bot joining slightly
      await new Promise((r) => setTimeout(r, 400));
    } catch (err: any) {
      console.error(`   ❌ Failed to setup [${botCfg.name}]:`, err.message);
    }
  }

  console.log('\n✨=======================================================');
  console.log(`   🚀 ${activeSockets.length} BOTS ACTIVE IN ROOM [${roomCode}]!`);
  console.log('   You can now start the game from your browser host screen.');
  console.log('   Press Ctrl+C anytime to stop and disconnect the bots.');
  console.log('=======================================================\n');

  process.on('SIGINT', () => {
    console.log('\n🛑 Disconnecting all bots and exiting...');
    activeSockets.forEach((s) => s.disconnect());
    pool.end();
    process.exit(0);
  });
}

startBots();
