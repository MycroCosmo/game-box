# GameBox

GameBox is a real-time party-game platform built around a server-managed room and game state.

The project combines a Next.js client with a Node.js/Socket.io backend so multiple players can join the same room and receive state transitions in real time.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, Express |
| Real-time transport | Socket.io |
| Database | PostgreSQL via Supabase |
| Deployment | Vercel / Render |

## Architecture

```text
Players
  │
  ▼
Next.js client
  │  Socket.io
  ▼
Express / Socket.io server
  │
  ├── RoomManager
  ├── GameEngine
  └── persistence
  │
  ▼
PostgreSQL
```

The server is responsible for room membership and game-state transitions. Clients render the state they receive instead of independently deciding the authoritative game result.

## Game modes

### Active Mafia

Players receive missions during the game and other players can participate in verifying whether those missions were completed.

### Custom Liar

The liar game supports multiple information levels, including a mode where the liar receives a similar but incorrect answer rather than being explicitly told their role.

## Backend responsibilities

- create/join/leave room;
- maintain player membership;
- start a game and transition phases;
- assign roles and missions;
- receive votes and mission confirmations;
- broadcast authoritative state changes;
- persist game results/logs.

Representative Socket.io events include:

```text
room:create
room:join
room:leave
game:start
game:phase-change
game:mission-assign
game:mission-confirm
game:vote
game:end
```

## Failure cases

Real-time applications need to handle more than the happy path.

This project treats the following as explicit engineering concerns:

- socket disconnection;
- reconnection with stale client state;
- duplicate/late events;
- player departure during a game;
- server/client state synchronization.

Reconnection/state recovery is an area that continues to be improved.

## Repository structure

```text
game-box/
├── src/                    # Next.js client
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── server/
│   └── src/
│       ├── game/
│       │   ├── RoomManager.ts
│       │   └── GameEngine.ts
│       └── database/
└── database-schema.sql
```

## Local setup

Install frontend and backend dependencies:

```bash
npm install
cd server
npm install
```

Start the development processes using the scripts defined in each package.

Environment values such as the Supabase connection and frontend/backend origins must be supplied locally and should not be committed.

## What this project demonstrates

- authoritative server state for multiplayer interaction;
- event-driven backend design;
- real-time room synchronization;
- modeling game phases and role-based state;
- practical failure cases specific to WebSocket applications.
