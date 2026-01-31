import { Server as SocketIOServer } from "socket.io";
import { RoomManager } from "./RoomManager";

type LiarMode = "fool" | "classic";
type WordPayload = { word: string | null; topic: string; mode: LiarMode };

// 최소 동작을 위한 GameEngine 구현(제시어 배포 포함)
export class GameEngine {
  // privateWords: roomId -> (playerId -> payload)
  private privateWords: Map<string, Map<string, WordPayload>> = new Map();

  // 샘플 단어 세트 (나중에 DB에서 가져오도록 교체 가능)
  private sampleWordSets: Array<{ answer: string; decoy: string; category: string }> = [
    { answer: "사과", decoy: "배", category: "과일" },
    { answer: "강아지", decoy: "고양이", category: "동물" },
    { answer: "축구", decoy: "농구", category: "스포츠" },
  ];

  constructor(private io: SocketIOServer, private roomManager: RoomManager) {}

  // 게임 시작: 역할 배정(간단히 라이어 1명), 제시어 생성 및 전송
  async startGame(roomId: string, io: SocketIOServer, mode: LiarMode = "classic") {
    const room = this.roomManager.getRoomById(roomId);
    if (!room) throw new Error("방을 찾을 수 없습니다.");

    // 역할 배정: 라이어 1명 랜덤
    const players = room.players.slice();
    if (players.length === 0) throw new Error("플레이어가 없습니다.");

    const liarIndex = Math.floor(Math.random() * players.length);
    players.forEach((p, idx) => {
      p.role = idx === liarIndex ? "liar" : "citizen";
    });

    // 샘플 단어 선택
    const ws = this.sampleWordSets[Math.floor(Math.random() * this.sampleWordSets.length)];

    // prepare privateWords map for this room
    const roomMap = new Map<string, WordPayload>();

    for (const p of players) {
      let payload: WordPayload;
      if (mode === "classic") {
        // classic: liar gets null, citizens get answer
        payload = {
          word: p.role === "liar" ? null : ws.answer,
          topic: ws.category,
          mode,
        };
      } else {
        // fool: liar gets decoy, citizens get answer (both see a word)
        payload = {
          word: p.role === "liar" ? ws.decoy : ws.answer,
          topic: ws.category,
          mode,
        };
      }

      roomMap.set(p.id, payload);

      // send individually to each player's socket
      if (p.socketId) {
        io.to(p.socketId).emit("game:word", payload);
      }
    }

    // persist mapping for rejoin
    this.privateWords.set(room.id, roomMap);

    // update room state and players
    this.roomManager.updateRoom(room.code, { state: "day", players });

    // broadcast state update (masked will be handled by index.ts caller)
    io.to(room.code).emit("room:state-update", this.roomManager.getRoom(room.code));

    // notify phase change
    io.to(room.code).emit("game:phase-change", { roomId, phase: "day" });
  }

  getPrivateWordState(roomId: string, playerId: string) {
    const m = this.privateWords.get(roomId);
    if (!m) return null;
    return m.get(playerId) || null;
  }

  confirmMission(_missionId: string, _confirmed: boolean) {
    // stub - mark params as used to satisfy linters
    void _missionId;
    void _confirmed;
    return;
  }

  submitVote(_roomId: string, _voterId: string, _targetId: string) {
    void _roomId;
    void _voterId;
    void _targetId;
    return { gameEnded: false, result: null } as const;
  }
}

export default GameEngine;
