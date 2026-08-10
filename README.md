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
| `chat_messages` | Persistent room chat history |

The hosted project also uses an `avatars` storage bucket and a `cleanup-rooms`
Edge Function for stale room cleanup. Public rooms stop showing after 10 minutes
without activity; stale lobbies are deleted and stale games are marked finished.
The deployed app also exposes `/api/cron/cleanup-rooms`, scheduled in
`vercel.json` every 5 minutes as a Vercel-side backup cleanup path. Set
`CRON_SECRET` if you want that endpoint locked behind a bearer token.

AI practice tables use `bot_profiles` plus bot-aware room player, secret, and
vote rows. They are labeled as AI tables in the app and do not create fake auth
users or count toward player stats.

Migrations live in `supabase/migrations/`. Apply via Supabase CLI.

## Getting Started

```bash
git clone https://github.com/FWT-bs/impostor
cd impostor
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xqujzzfnkgbhoymhcvmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_or_service_role_key

# Optional: premium checkout
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_PRICE_ID=
```

For guest play, enable anonymous sign-ins in Supabase Auth.

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
