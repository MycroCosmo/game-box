import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import { RoomManager, Room } from "./game/RoomManager";
import { GameEngine } from "./game/GameEngine";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 엔진 레벨의 handshake/connection 에러(예: CORS, transport handshake 실패)를 로깅
if (io.engine && typeof io.engine.on === "function") {
  io.engine.on("connection_error", (err: unknown) => {
    console.error("[Engine] connection_error:", err);
  });
}

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const roomManager = new RoomManager();
const gameEngine = new GameEngine(io, roomManager);

/**
 * ✅ 브로드캐스트용: 역할 숨김 처리
 */
function maskRoomForBroadcast(room: Room): Room {
  return {
    ...room,
    players: room.players.map((p) => ({
      ...p,
      role: "hidden",
    })),
  };
}

// ===== REST API Endpoints =====
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    activeRooms: roomManager.getRoomsCount(),
  });
});

// ===== Socket.io Events =====
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // 방 생성
  socket.on("room:create", (data, callback) => {
    try {
      console.log(`[Room:create] Received data:`, data); // 요청 데이터 로깅
      const { code, room } = roomManager.createRoom(socket.id, data);
      socket.join(code);
      console.log(`[Room] Created: ${code} by ${data.nickname}`);
      const masked = maskRoomForBroadcast(room);
      callback({ code, room: masked });
      io.to(code).emit("room:state-update", masked);
    } catch (error: any) {
      console.error(`[Room:create] Error: ${error.message}`); // 에러 상세 로깅
      callback({ error: error.message });
    }
  });

  // 방 입장
  socket.on("room:join", (data, callback) => {
    try {
      const room = roomManager.joinRoom(data.code, socket.id, data.nickname);
      socket.join(data.code);

      console.log(`[Room] ${data.nickname} joined: ${data.code}`);

      const masked = maskRoomForBroadcast(room);
      io.to(data.code).emit("room:state-update", masked);

      callback(masked);
    } catch (error: any) {
      callback({ error: error.message });
    }
  });

  // 방 재입장
  socket.on("room:rejoin", (data, callback) => {
    try {
      const room = roomManager.getRoom(data.code);
      if (!room) throw new Error("방을 찾을 수 없습니다.");

      const player = room.players.find((p) => p.nickname === data.nickname);
      if (!player) throw new Error("플레이어를 찾을 수 없습니다.");

      const oldSocketId = player.socketId;
      player.socketId = socket.id;

      socket.join(data.code);

      console.log(
        `[Room] ${data.nickname} rejoined: ${oldSocketId} → ${socket.id} (code: ${data.code})`
      );

      // 1) 방 상태는 masked로만
      const masked = maskRoomForBroadcast(room);
      callback(masked);

      // 2) 방 전체에 상태 갱신
      io.to(data.code).emit("room:state-update", masked);

      // 3) ✅ 재접속한 본인에게만 개인 정보 재전송 (word/topic)
      //    - GameEngine은 playerId 기준으로 저장/조회하므로 player.id 사용
      const payload = gameEngine.getPrivateWordState(room.id, player.id);
      if (payload) {
        socket.emit("game:word", payload);
      }
    } catch (error: any) {
      callback({ error: error.message });
    }
  });

  // 방 나가기
  socket.on("room:leave", (data, callback) => {
    try {
      const room = roomManager.getRoomById(data.roomId);
      if (!room) throw new Error("방을 찾을 수 없습니다.");

      const updatedRoom = roomManager.leaveRoom(room.id, socket.id);

      socket.leave(room.code);

      if (updatedRoom) {
        io.to(room.code).emit("room:state-update", maskRoomForBroadcast(updatedRoom));
      }

      console.log(`[Room] Player left: ${room.code} (${data.roomId})`);
      callback({ success: true });
    } catch (error: any) {
      callback({ error: error.message });
    }
  });

  // 게임 시작
  socket.on("game:start", async (data, callback) => {
    try {
      const room = roomManager.getRoomById(data.roomId);
      if (!room) throw new Error("방을 찾을 수 없습니다.");

      const hostPlayer = room.players.find((p) => p.id === room.host);
      if (!hostPlayer || hostPlayer.socketId !== socket.id) {
        throw new Error("호스트만 게임을 시작할 수 있습니다.");
      }

      if (room.state !== "waiting") {
        throw new Error("이미 게임이 시작되었습니다.");
      }

      const liarMode = data.mode || "classic";
      await gameEngine.startGame(data.roomId, io, liarMode);

      const updated = roomManager.getRoomById(data.roomId);
      if (updated) {
        io.to(updated.code).emit("room:state-update", maskRoomForBroadcast(updated));
      }

      callback({ success: true });
    } catch (error: any) {
      callback({ error: error.message });
    }
  });

  // 미션 완료 확인
  socket.on("game:mission-confirm", (data, callback) => {
    try {
      gameEngine.confirmMission(data.missionId, data.confirmed);
      callback({ success: true });
    } catch (error: any) {
      callback({ error: error.message });
    }
  });

  // 투표
  socket.on("game:vote", (data, callback) => {
    try {
      const result = gameEngine.submitVote(data.roomId, data.voterId, data.targetId);

      const room = roomManager.getRoomById(data.roomId);
      if (!room) throw new Error("방을 찾을 수 없습니다.");

      if (result.gameEnded) {
        io.to(room.code).emit("game:end", { roomId: data.roomId, result: result.result });
      }

      callback({ success: true });
    } catch (error: any) {
      callback({ error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    roomManager.removePlayerBySocketId(socket.id);
  });

  socket.on("error", (error) => {
    console.error(`[Socket Error] ${socket.id}:`, error);
  });
});

// ===== 서버 시작 =====
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});

export default app;
