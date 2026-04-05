# Impostor

A real-time multiplayer social deduction game. Players try to identify an impostor who doesn't know the secret word — with room codes, live voting, and persistent leaderboards.

## Overview

Impostor supports two modes: **local** (pass-and-play on one device) and **online** (join via room code). Online play uses Supabase Realtime for multiplayer synchronization, meaning all game state — roles, votes, round results — is reflected live across every connected client.

Player profiles and stats persist across sessions. A leaderboard tracks performance over time.

## Features

- **Online multiplayer** — Room-code-based sessions with real-time sync via Supabase Realtime
- **Local mode** — Pass-and-play on a single device, no account required
- **Anonymous + authenticated play** — Supports both guest and logged-in users
- **Voting system** — Live vote tallying with reveal mechanics
- **Leaderboards** — Persistent stats across sessions (wins, detection rate, etc.)
- **Row-level security** — Role assignment and game state validated server-side to prevent client manipulation

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| State | Zustand |
| Backend / DB | Supabase (PostgreSQL + Realtime + Auth) |
| Hosting | Vercel |

## Database Schema

Key tables:

| Table | Purpose |
|---|---|
| `profiles` | User data and lifetime stats |
| `rooms` | Active and completed game rooms |
| `room_players` | Player-room membership |
| `player_secrets` | Secret word assignments (RLS-protected) |
| `game_rounds` | Round history |
| `votes` | Per-round vote records |

Migrations live in `supabase/migrations/`. Apply via Supabase CLI.

## Getting Started

```bash
git clone https://github.com/FWT-bs/impostor
cd impostor
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run migrations:

```bash
npx supabase db push
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## License

MIT
