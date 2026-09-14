import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:4000';
const roomCode = (process.argv[2] || 'Q99589').toUpperCase();

interface BotConfig {
  username: string;
  avatarId: string;
  defaultAnswer: string;
}

const BOTS: BotConfig[] = [
  { username: 'أحمد_الذكي', avatarId: 'avatar-2', defaultAnswer: 'شاورما دجاج' },
  { username: 'سارة_الفنانة', avatarId: 'avatar-3', defaultAnswer: 'سوشي سلمون' },
];

async function loginGuest(botConfig: BotConfig) {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: botConfig.username,
      avatarId: botConfig.avatarId,
    }),
  });

  const data = await res.json();
  return data.data?.token || data.token;
}

async function startBot(botConfig: BotConfig) {
  console.log(`🤖 Starting bot: [${botConfig.username}]...`);
  const token = await loginGuest(botConfig);
  if (!token) {
    console.error(`❌ Failed to authenticate bot ${botConfig.username}`);
    return;
  }

  // Find gameId from roomCode
  const gameRes = await fetch(`${BACKEND_URL}/api/v1/games/code/${roomCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const gameData = await gameRes.json();
  const gameId = gameData.data?.gameId || gameData.data?.id || gameData.gameId || gameData.id;

  if (!gameId) {
    console.error(`❌ Game not found for room code [${roomCode}]`);
    return;
  }

  const socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log(`✅ [${botConfig.username}] connected to socket. Joining room ${roomCode}...`);
    socket.emit('LOBBY:JOIN_ROOM', { gameId, nickname: botConfig.username });
  });

  socket.on('LOBBY:ERROR', (err: any) => {
    console.error(`⚠️ [${botConfig.username}] Lobby Error:`, err);
  });

  socket.on('ROUND:START', (data: any) => {
    console.log(`📝 [${botConfig.username}] Round ${data.roundNumber} started! Question: "${data.question?.text_ar}"`);
    setTimeout(() => {
      const randomAnswer = `${botConfig.defaultAnswer} ${Math.floor(Math.random() * 90 + 10)}`;
      console.log(`⚡ [${botConfig.username}] Submitting answer: "${randomAnswer}"...`);
      socket.emit('ROUND:SUBMIT_ANSWER', {
        gameId,
        roundId: data.roundId,
        text: randomAnswer,
      });
    }, 1500);
  });

  socket.on('ROUND:START_MATCHING', (data: any) => {
    console.log(`🎯 [${botConfig.username}] Matching phase started with ${data.anonymousAnswers?.length} answers!`);
    setTimeout(() => {
      const candidates = (data.playersToMatch || []).filter(
        (p: any) => p.nickname !== botConfig.username
      );
      const answers = (data.anonymousAnswers || []).filter(
        (a: any) => a.authorUserId !== botConfig.username && a.authorPlayerId !== botConfig.username
      );

      const guesses = answers.map((a: any, idx: number) => {
        const candidate = candidates[idx % Math.max(1, candidates.length)];
        return {
          answerId: a.answerId || a.answer_id || a.id,
          guessedPlayerId: candidate?.gamePlayerId || candidate?.userId || candidate?.id,
        };
      }).filter((g: any) => g.answerId && g.guessedPlayerId);

      console.log(`⚡ [${botConfig.username}] Submitting ${guesses.length} guesses...`);
      socket.emit('MATCHING:SUBMIT_GUESSES', {
        gameId,
        roundId: data.roundId,
        guesses,
      });
    }, 2000);
  });

  socket.on('ROUND:RESULTS', (data: any) => {
    console.log(`🏆 [${botConfig.username}] Round results received!`);
  });
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🎮 Multi-Player Bot Simulator for Room: [${roomCode}]`);
  console.log(`======================================================\n`);

  for (const bot of BOTS) {
    await startBot(bot);
  }
}

main();
