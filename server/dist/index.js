"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const RoomManager_1 = require("./game/RoomManager");
const GameEngine_1 = require("./game/GameEngine");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 4000;
const roomManager = new RoomManager_1.RoomManager();
const gameEngine = new GameEngine_1.GameEngine(io, roomManager);
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
            const { code, room } = roomManager.createRoom(socket.id, data);
            socket.join(code);
            console.log(`[Room] Created: ${code} by ${data.nickname}`);
            callback({ code, room });
        }
        catch (error) {
            callback({ error: error.message });
        }
    });
    // 방 입장
    socket.on("room:join", (data, callback) => {
        try {
            const room = roomManager.joinRoom(data.code, socket.id, data.nickname);
            socket.join(data.code);
            console.log(`[Room] ${data.nickname} joined: ${data.code}`);
            // 모든 플레이어에게 업데이트 알림
            io.to(data.code).emit("room:state-update", room);
            callback(room);
        }
        catch (error) {
            callback({ error: error.message });
        }
    });
    // 방 나가기
    socket.on("room:leave", (data, callback) => {
        try {
            const room = roomManager.leaveRoom(data.roomId, socket.id);
            socket.leave(data.roomId);
            if (room) {
                io.to(data.roomId).emit("room:state-update", room);
            }
            console.log(`[Room] Player left: ${data.roomId}`);
            callback({ success: true });
        }
        catch (error) {
            callback({ error: error.message });
        }
    });
    // 게임 시작
    socket.on("game:start", async (data, callback) => {
        try {
            await gameEngine.startGame(data.roomId, io);
            callback({ success: true });
        }
        catch (error) {
            callback({ error: error.message });
        }
    });
    // 미션 완료 확인
    socket.on("game:mission-confirm", (data, callback) => {
        try {
            gameEngine.confirmMission(data.missionId, data.confirmed);
            callback({ success: true });
        }
        catch (error) {
            callback({ error: error.message });
        }
    });
    // 투표
    socket.on("game:vote", (data, callback) => {
        try {
            const result = gameEngine.submitVote(data.roomId, data.voterId, data.targetId);
            if (result.gameEnded) {
                io.to(data.roomId).emit("game:end", { roomId: data.roomId, result: result.result });
            }
            callback({ success: true });
        }
        catch (error) {
            callback({ error: error.message });
        }
    });
    // 연결 해제
    socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        // 플레이어가 속한 방에서 제거
        roomManager.removePlayerBySocketId(socket.id);
    });
    // 에러 핸들링
    socket.on("error", (error) => {
        console.error(`[Socket Error] ${socket.id}:`, error);
    });
});
// ===== 서버 시작 =====
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map