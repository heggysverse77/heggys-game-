# 📚 Heggy Game Server - API & WebSocket Documentation

Backend service for the multiplayer party game **"اعرف صاحبك وعلّم عليه"** (Know Your Friend & Expose Them).

---

## 🌐 Quick Links & Tools

* **Interactive Swagger UI**: [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
* **Postman Collection**: [heggy-game.postman_collection.json](file:///c:/Users/muham/OneDrive/Desktop/heggys%20game/server/heggy-game.postman_collection.json)

---

## 🧠 Arabic NLP Normalization Engine

All user submitted answers are processed through the Arabic NLP pipeline ([`arabic.nlp.ts`](file:///c:/Users/muham/OneDrive/Desktop/heggys%20game/server/src/utils/arabic.nlp.ts)):
* **Tashkeel Stripping**: Removes diacritics (`َ ً ُ ٌ ِ ٍ ّ ْ`).
* **Tatweel Removal**: Removes kashida (`ـ`).
* **Letter Normalization**: Unifies `[أ, إ, آ]` $\rightarrow$ `ا`, `[ة]` $\rightarrow$ `ه`, `[ى]` $\rightarrow$ `ي`.
* **Elongation Reduction**: Collapses `لاااااا` $\rightarrow$ `لا`, `هههههه` $\rightarrow$ `هه`.
* **Fuzzy Similarity Checker**: Uses Levenshtein distance to detect and handle semantic duplicate answers.

---

## 🔐 REST API Endpoints

### 1. Authentication (`/api/v1/auth`)

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/guest` | `POST` | Public | Instant guest login with `username` & `avatarId` |
| `/api/v1/auth/register` | `POST` | Public | Register with `username`, `email`, `password` |
| `/api/v1/auth/login` | `POST` | Public | Login with `email` & `password` |
| `/api/v1/auth/me` | `GET` | Bearer Token | Fetch authenticated user profile |

---

### 2. Game Rooms (`/api/v1/games`)

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/games` | `POST` | Bearer Token | Host creates room (returns `gameId` & `roomCode`) |
| `/api/v1/games/code/:code`| `GET` | Public | Pre-check room availability & capacity |
| `/api/v1/games/:id` | `GET` | Bearer Token | Fetch full room metadata & connected players |

---

### 3. Question Bank (`/api/v1/questions`)

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/questions` | `POST` | Public | Community contributes a new question to the game bank |
| `/api/v1/questions` | `GET` | Public | List all active questions |

---

## ⚡ Socket.io Real-Time Event Catalogue

Connecting to WebSocket: `ws://localhost:4000` with `auth: { token: "<JWT_TOKEN>" }`.

### 1. Lobby Events
| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `LOBBY:JOIN_ROOM` | Client $\rightarrow$ Server | `{ gameId, nickname? }` | Enters room or reconnects |
| `LOBBY:UPDATE_PLAYERS` | Server $\rightarrow$ Room | `{ gameId, players: [...] }` | Broadcasts live player avatars |
| `GAME:CURRENT_STATE` | Server $\rightarrow$ Client | `{ game, players, isReconnection }` | Syncs current game phase |
| `LOBBY:LEAVE_ROOM` | Client $\rightarrow$ Server | `{ gameId }` | Player leaves room |

### 2. Gameplay Round Events
| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `LOBBY:START_GAME` | Host $\rightarrow$ Server | `{ gameId }` | Host starts the game |
| `ROUND:START` | Server $\rightarrow$ Room | `{ roundId, question, timer, players }` | Starts Answering phase |
| `ROUND:SUBMIT_ANSWER` | Client $\rightarrow$ Server | `{ gameId, roundId, text }` | Submits secret answer |
| `ROUND:ANSWER_STATUSES` | Server $\rightarrow$ Room | `{ submittedCount, totalPlayers, players }` | Live per-avatar typing/answered badges |
| `ROUND:START_MATCHING` | Server $\rightarrow$ Room | `{ anonymousAnswers, playersToMatch, timer }` | Starts Matching phase |
| `MATCHING:SUBMIT_GUESSES`| Client $\rightarrow$ Server | `{ gameId, roundId, guesses }` | Submits friend matches |
| `ROUND:RESULTS` | Server $\rightarrow$ Room | `{ leaderboard: [...] }` | Round scores & witty badges |
| `ROUND:NEXT_ROUND` | Host $\rightarrow$ Server | `{ gameId }` | Advances round or finishes game |

### 3. Final Results & Dare Events
| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `GAME:FINAL_RESULTS` | Server $\rightarrow$ Room | `{ finalLeaderboard, winner, loser, dareCards }` | Podium & celebration |
| `DARE:ASSIGN` | Winner $\rightarrow$ Server | `{ gameId, dareId }` | Winner assigns penalty |
| `DARE:ANNOUNCED` | Server $\rightarrow$ Room | `{ dareText, winnerNickname, loserNickname }` | Broadcasts penalty |
| `DARE:COMPLETE` | Loser $\rightarrow$ Server | `{ gameId, assignmentId }` | Marks penalty finished |
