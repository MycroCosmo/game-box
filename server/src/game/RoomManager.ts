import { v4 as uuidv4 } from "uuid";

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  role: "citizen" | "mafia" | "liar" | "hidden";
  alive: boolean;
  points: number;
  confirmedMissions: number;
}

export interface Room {
  id: string;
  code: string;
  host: string;
  gameMode: "active-mafia" | "custom-liar";
  state: "waiting" | "night" | "day" | "discussion" | "voting" | "ended";
  players: Player[];
  maxPlayers: number;
  createdAt: Date;
  currentPhase: "day" | "night";
  phaseEndTime?: Date;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  createRoom(
    socketId: string,
    data: { nickname: string; gameMode: "active-mafia" | "custom-liar"; maxPlayers: number }
  ): { code: string; room: Room } {
    const code = this.generateRoomCode();
    const playerId = uuidv4();

    const room: Room = {
      id: uuidv4(),
      code,
      host: playerId,
      gameMode: data.gameMode,
      state: "waiting",
      players: [
        {
          id: playerId,
          socketId,
          nickname: data.nickname,
          role: "hidden",
          alive: true,
          points: 0,
          confirmedMissions: 0,
        },
      ],
      maxPlayers: data.maxPlayers,
      createdAt: new Date(),
      currentPhase: "night",
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(socketId, code);

    return { code, room };
  }

  joinRoom(code: string, socketId: string, nickname: string): Room {
    const room = this.rooms.get(code);
    if (!room) throw new Error("방을 찾을 수 없습니다.");
    if (room.state !== "waiting") throw new Error("진행 중인 게임입니다.");

    if (room.players.some((p) => p.socketId === socketId)) {
      console.log(`[Room] Player ${socketId} already in room ${code}`);
      return room;
    }

    if (room.players.length >= room.maxPlayers) throw new Error("방이 가득 찼습니다.");

    const playerId = uuidv4();
    room.players.push({
      id: playerId,
      socketId,
      nickname,
      role: "hidden",
      alive: true,
      points: 0,
      confirmedMissions: 0,
    });

    this.socketToRoom.set(socketId, code);
    return room;
  }

  leaveRoom(roomId: string, socketId: string): Room | null {
    let room: Room | null = null;

    for (const r of this.rooms.values()) {
      if (r.id === roomId) {
        room = r;
        break;
      }
    }

    if (!room) return null;

    room.players = room.players.filter((p) => p.socketId !== socketId);
    this.socketToRoom.delete(socketId);

    if (room.players.length === 0) {
      this.rooms.delete(room.code);
      return null;
    }

    return room;
  }

  // ✅ code 기반 제거도 가능하도록 헬퍼 추가
  leaveRoomByCode(code: string, socketId: string): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    return this.leaveRoom(room.id, socketId);
  }

  // ✅ disconnect 정리 버그 수정
  removePlayerBySocketId(socketId: string): void {
    const code = this.socketToRoom.get(socketId);
    if (!code) return;
    this.leaveRoomByCode(code, socketId);
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomById(roomId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.id === roomId) return room;
    }
    return undefined;
  }

  updateRoom(code: string, updates: Partial<Room>): Room {
    const room = this.rooms.get(code);
    if (!room) throw new Error("방을 찾을 수 없습니다.");
    Object.assign(room, updates);
    return room;
  }

  getRoomsCount(): number {
    return this.rooms.size;
  }

  private generateRoomCode(): string {
    let code: string;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.rooms.has(code));
    return code;
  }
}
