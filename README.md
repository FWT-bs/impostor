# Impostor — Social Deduction Party Game

A real-time social deduction party game where players try to identify the impostor among them. One player doesn't know the secret word and must bluff their way through — can your group catch them?

## Game Modes

### Local Party Mode (Pass & Play)
Play on a single device. Pass it around the table, give clues, and vote.

### Online Multiplayer
Create or join a room with a 4-character code. Each player uses their own device with real-time synchronization.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Realtime)
- **State**: Zustand (client), Supabase Realtime (multiplayer sync)
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd impostor
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy your:
   - Project URL
   - `anon` public key
   - `service_role` secret key
3. Go to **Authentication → Providers** and enable:
   - Email (already enabled by default)
   - Anonymous Sign-Ins (under Settings → Authentication → User Signups, enable "Allow anonymous sign-ins")
4. Go to the **SQL Editor** and run the contents of `supabase/migrations/000_combined.sql`

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the three environment variables in Vercel's project settings
4. Deploy

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, signup, callback
│   ├── api/                # Server API routes
│   │   ├── rooms/          # Room CRUD + game actions
│   │   └── auth/           # Guest auth
│   ├── local/              # Local party mode
│   ├── rooms/              # Online room browser + lobby + play
│   ├── profile/            # User profile + stats
│   └── leaderboard/        # Global leaderboard
├── components/
│   ├── ui/                 # Reusable UI primitives
│   ├── layout/             # Header
│   └── game/               # Game-specific components
├── lib/
│   ├── supabase/           # Client setup (browser, server, admin)
│   ├── game/               # Game engine, word selection
│   └── hooks/              # React hooks for auth, rooms, realtime
├── stores/                 # Zustand stores
├── data/                   # Word list JSON
└── types/                  # Shared TypeScript types
```

## Database Schema

- **profiles** — User accounts with game statistics
- **rooms** — Online game rooms with state tracking
- **room_players** — Players in each room
- **player_secrets** — Role assignments (RLS: players can only see their own)
- **game_rounds** — Round history with word/topic/winner
- **votes** — Individual votes per round

All tables have Row Level Security (RLS) policies. See `supabase/migrations/` for the full schema.

## Security

- Role assignments stored in `player_secrets` with strict RLS — no player can see another's role
- Game state transitions validated server-side via API routes using the service role key
- Votes hidden until the round completes
- Impostor identity revealed only after the round ends (via `game_rounds_public` view)
