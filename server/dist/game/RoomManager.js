"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const uuid_1 = require("uuid");
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.socketToRoom = new Map();
    }
    createRoom(socketId, data) {
        const code = this.generateRoomCode();
        const playerId = (0, uuid_1.v4)();
        const room = {
            id: (0, uuid_1.v4)(),
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
    joinRoom(code, socketId, nickname) {
        const room = this.rooms.get(code);
        if (!room) {
            throw new Error("방을 찾을 수 없습니다.");
        }
        if (room.state !== "waiting") {
            throw new Error("진행 중인 게임입니다.");
        }
        // 이미 이 소켓 ID로 방에 참여했는지 확인
        if (room.players.some((p) => p.socketId === socketId)) {
            console.log(`[Room] Player ${socketId} already in room ${code}`);
            return room;
        }
        if (room.players.length >= room.maxPlayers) {
            throw new Error("방이 가득 찼습니다.");
        }
        const playerId = (0, uuid_1.v4)();
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
    leaveRoom(roomId, socketId) {
        let room = null;
        for (const [code, r] of this.rooms.entries()) {
            if (r.id === roomId) {
                room = r;
                break;
            }
        }
        if (!room) {
            return null;
        }
        room.players = room.players.filter((p) => p.socketId !== socketId);
        this.socketToRoom.delete(socketId);
        // 방이 비어있으면 삭제
        if (room.players.length === 0) {
            for (const [code, r] of this.rooms.entries()) {
                if (r.id === roomId) {
                    this.rooms.delete(code);
                    break;
                }
            }
            return null;
        }
        return room;
    }
    removePlayerBySocketId(socketId) {
        const code = this.socketToRoom.get(socketId);
        if (code) {
            this.leaveRoom(code, socketId);
        }
    }
    getRoom(code) {
        return this.rooms.get(code);
    }
    getRoomById(roomId) {
        for (const room of this.rooms.values()) {
            if (room.id === roomId) {
                return room;
            }
        }
        return undefined;
    }
    updateRoom(code, updates) {
        const room = this.rooms.get(code);
        if (!room) {
            throw new Error("방을 찾을 수 없습니다.");
        }
        Object.assign(room, updates);
        return room;
    }
    getRoomsCount() {
        return this.rooms.size;
    }
    generateRoomCode() {
        let code;
        do {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (this.rooms.has(code));
        return code;
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=RoomManager.js.map