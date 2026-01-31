import { Socket } from "socket.io-client";
import { Room, Mission, GameLog, GameMode } from "@/types/game";

export type LiarMode = "fool" | "classic";

export type WordPayload = {
  word: string | null;
  topic: string;
  mode: LiarMode;
};

export type JoinResponse = {
  room: Room;
  self: { playerId: string };
};

export class GameService {
  constructor(private socket: Socket) {}

  createRoom(nickname: string, gameMode: GameMode, maxPlayers: number) {
    return new Promise<{ code: string; room: Room; self: { playerId: string } }>((resolve, reject) => {
      this.socket.emit("room:create", { nickname, gameMode, maxPlayers }, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }

  joinRoom(code: string, nickname: string) {
    return new Promise<JoinResponse>((resolve, reject) => {
      this.socket.emit("room:join", { code, nickname }, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }

  rejoinRoom(code: string, nickname: string) {
    return new Promise<JoinResponse>((resolve, reject) => {
      this.socket.emit("room:rejoin", { code, nickname }, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve(response);
      });
    });
  }

  leaveRoom(roomId: string) {
    return new Promise<void>((resolve, reject) => {
      this.socket.emit("room:leave", { roomId }, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve();
      });
    });
  }

  startGame(roomId: string, mode?: LiarMode) {
    return new Promise<void>((resolve, reject) => {
      const data: any = { roomId };
      if (mode) data.mode = mode;

      this.socket.emit("game:start", data, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve();
      });
    });
  }

  // 한 판 더하기(호스트 전용)
  restartGame(roomId: string, mode?: LiarMode) {
    return new Promise<void>((resolve, reject) => {
      const data: any = { roomId };
      if (mode) data.mode = mode;

      this.socket.emit("game:restart", data, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve();
      });
    });
  }

  submitMissionConfirmation(missionId: string, confirmed: boolean) {
    return new Promise<void>((resolve, reject) => {
      this.socket.emit("game:mission-confirm", { missionId, confirmed }, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve();
      });
    });
  }

  vote(roomId: string, voterId: string, targetId: string) {
    return new Promise<void>((resolve, reject) => {
      this.socket.emit("game:vote", { roomId, voterId, targetId }, (response: any) => {
        if (response?.error) reject(new Error(response.error));
        else resolve();
      });
    });
  }

  // ===== 리스너 =====
  onRoomStateUpdate(callback: (room: Room) => void) {
    this.socket.on("room:state-update", callback);
  }

  onMissionAssign(callback: (data: { playerId: string; mission: Mission }) => void) {
    this.socket.on("game:mission-assign", callback);
  }

  onPhaseChange(callback: (data: { roomId: string; phase: string }) => void) {
    this.socket.on("game:phase-change", callback);
  }

  onWord(callback: (data: WordPayload) => void) {
    this.socket.on("game:word", callback);
  }

  onGameEnd(callback: (data: { roomId: string; result: GameLog | null }) => void) {
    this.socket.on("game:end", callback);
  }

  onError(callback: (data: any) => void) {
    this.socket.on("error", callback);
  }

  // ===== 리스너 제거 =====
  offRoomStateUpdate(callback?: (room: Room) => void) {
    this.socket.off("room:state-update", callback);
  }
  offMissionAssign(callback?: (data: { playerId: string; mission: Mission }) => void) {
    this.socket.off("game:mission-assign", callback);
  }
  offPhaseChange(callback?: (data: { roomId: string; phase: string }) => void) {
    this.socket.off("game:phase-change", callback);
  }
  offWord(callback?: (data: WordPayload) => void) {
    this.socket.off("game:word", callback);
  }
  offGameEnd(callback?: (data: { roomId: string; result: GameLog | null }) => void) {
    this.socket.off("game:end", callback);
  }
  offError(callback?: (data: any) => void) {
    this.socket.off("error", callback);
  }
}

export default GameService;
