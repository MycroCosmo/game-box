export type GameMode = "active-mafia" | "custom-liar";
export type GameState = "waiting" | "night" | "day" | "discussion" | "voting" | "ended";
export type PlayerRole = "citizen" | "mafia" | "liar" | "hidden";
export type Difficulty = "low" | "normal" | "high";

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  role: PlayerRole;
  alive: boolean;
  points: number;
  confirmedMissions: number;
}

export interface Room {
  id: string;
  code: string;
  host: string;
  gameMode: GameMode;
  state: GameState;
  players: Player[];
  maxPlayers: number;
  createdAt: Date;
  currentPhase: "day" | "night";
  phaseEndTime?: Date;
}

export interface Mission {
  id: string;
  playerId: string;
  missionText: string;
  type: "question" | "action";
  targetPlayerId?: string;
  completed: boolean;
  confirmedBy?: string;
  createdAt: Date;
}

export interface WordSet {
  id: string;
  answer: string;
  decoy: string;
  category: string;     // ✅ DB 컬럼은 유지 (topic으로 쓰고 싶으면 migration)
  difficulty: Difficulty;
  // hint?: string;      // ✅ 필요 없으면 제거해도 됨
}

export interface GameLog {
  id: string;
  roomId: string;
  gameMode: GameMode;
  result: "citizen-win" | "mafia-win" | "liar-win" | "draw";
  startedAt: Date;
  endedAt: Date;
  players: Array<{
    playerId: string;
    nickname: string;
    role: PlayerRole;
    points: number;
  }>;
  missions?: Mission[];
  deletedAt?: Date;
}

// Socket 이벤트 타입(필요 시 확장)
export interface SocketEvents {
  "room:create": (data: { nickname: string; gameMode: GameMode; maxPlayers: number }) => void;
  "room:join": (data: { code: string; nickname: string }) => void;
  "room:leave": (data: { roomId: string; playerId: string }) => void;
  "room:state-update": (data: Room) => void;

  "game:start": (data: { roomId: string }) => void;
  "game:phase-change": (data: { roomId: string; phase: GameState }) => void;
  "game:mission-assign": (data: { playerId: string; mission: Mission }) => void;
  "game:mission-confirm": (data: { missionId: string; confirmed: boolean }) => void;
  "game:vote": (data: { roomId: string; voterId: string; targetId: string }) => void;
  "game:end": (data: { roomId: string; result: GameLog }) => void;

  error: (data: { message: string; code: string }) => void;
}
