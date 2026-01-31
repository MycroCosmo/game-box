"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const uuid_1 = require("uuid");
const ACTIVE_MAFIA_MISSIONS = [
    { template: "B에게 어제 본 유튜브에 대해 물어보기", type: "question" },
    { template: "주변 사람에게 오늘 날씨에 대해 물어보기", type: "question" },
    { template: "누군가를 10초 동안 응시하기", type: "action" },
    { template: "5분 안에 누군가의 웃음소리 녹음하기", type: "action" },
    { template: "다른 사람의 신발 사진 찍기", type: "action" },
];
class GameEngine {
    constructor(io, roomManager) {
        this.io = io;
        this.roomManager = roomManager;
        this.missions = new Map();
        this.votes = new Map();
    }
    async startGame(roomId, io) {
        const room = this.roomManager.getRoomById(roomId);
        if (!room) {
            throw new Error("방을 찾을 수 없습니다.");
        }
        if (room.players.length < 3) {
            throw new Error("최소 3명 이상이 필요합니다.");
        }
        // 역할 배정
        this.assignRoles(room);
        // 게임 모드별 초기화
        if (room.gameMode === "active-mafia") {
            await this.initializeActiveMafia(room);
        }
        else if (room.gameMode === "custom-liar") {
            await this.initializeCustomLiar(room);
        }
        // 상태 업데이트 및 브로드캐스트
        room.state = "night";
        this.roomManager.updateRoom(room.code, { state: "night" });
        io.to(room.code).emit("room:state-update", room);
        io.to(room.code).emit("game:phase-change", { roomId, phase: "night" });
    }
    assignRoles(room) {
        const players = room.players;
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const mafiaCount = Math.ceil(players.length / 3);
        let mafiaAssigned = 0;
        shuffled.forEach((player) => {
            if (mafiaAssigned < mafiaCount) {
                player.role = "mafia";
                mafiaAssigned++;
            }
            else {
                player.role = "citizen";
            }
        });
    }
    async initializeActiveMafia(room) {
        const missions = [];
        room.players.forEach((player) => {
            const mission = ACTIVE_MAFIA_MISSIONS[Math.floor(Math.random() * ACTIVE_MAFIA_MISSIONS.length)];
            const targetPlayer = room.players[Math.floor(Math.random() * room.players.length)];
            missions.push({
                id: (0, uuid_1.v4)(),
                playerId: player.id,
                missionText: mission.template,
                type: mission.type,
                targetPlayerId: targetPlayer.id !== player.id ? targetPlayer.id : undefined,
                completed: false,
                createdAt: new Date(),
            });
        });
        this.missions.set(room.id, missions);
        // 각 플레이어에게 미션 할당
        missions.forEach((mission) => {
            const player = room.players.find((p) => p.id === mission.playerId);
            if (player) {
                this.io.to(player.socketId).emit("game:mission-assign", {
                    playerId: player.id,
                    mission,
                });
            }
        });
    }
    async initializeCustomLiar(room) {
        // 라이어 선택
        const liarIndex = Math.floor(Math.random() * room.players.length);
        room.players.forEach((player, index) => {
            if (index === liarIndex) {
                player.role = "liar";
            }
            else {
                player.role = "citizen";
            }
        });
        // 난이도에 따른 단어 선택 (임시: 클라이언트에서 관리)
        // WordSet에서 가져올 데이터: { answer, decoy, hint, difficulty }
        const wordData = {
            answer: "색연필",
            decoy: room.gameMode === "custom-liar" ? "싸인펜" : "색연필",
            hint: "그리기도 하고 칠하기도 하는 도구",
            difficulty: "high",
        };
        // 시민들에게는 정답, 라이어에게는 유사 정답 전송
        room.players.forEach((player) => {
            if (player.role === "liar") {
                this.io.to(player.socketId).emit("game:liar-word", {
                    word: wordData.decoy,
                    hint: "당신은 라이어입니다! 이 단어가 정답이라고 주장하세요.",
                    isLiar: true,
                });
            }
            else {
                this.io.to(player.socketId).emit("game:citizen-word", {
                    word: wordData.answer,
                    hint: wordData.hint,
                    isLiar: false,
                });
            }
        });
    }
    confirmMission(missionId, confirmed) {
        // 미션 확인 로직
        for (const missions of this.missions.values()) {
            const mission = missions.find((m) => m.id === missionId);
            if (mission) {
                mission.completed = confirmed;
                return;
            }
        }
    }
    submitVote(roomId, voterId, targetId) {
        if (!this.votes.has(roomId)) {
            this.votes.set(roomId, {});
        }
        const roomVotes = this.votes.get(roomId);
        roomVotes[voterId] = targetId;
        // 게임 종료 조건 확인
        const room = this.roomManager.getRoomById(roomId);
        if (room) {
            // 모두 투표했는지 확인
            if (Object.keys(roomVotes).length === room.players.length) {
                // 결과 계산
                const result = this.calculateGameResult(room, roomVotes);
                return { gameEnded: true, result };
            }
        }
        return { gameEnded: false };
    }
    calculateGameResult(room, votes) {
        // 투표 결과 집계
        const voteCount = {};
        Object.values(votes).forEach((targetId) => {
            voteCount[targetId] = (voteCount[targetId] || 0) + 1;
        });
        const eliminated = Object.entries(voteCount).sort((a, b) => b[1] - a[1])[0][0];
        const eliminatedPlayer = room.players.find((p) => p.id === eliminated);
        if (!eliminatedPlayer) {
            return { winner: "draw" };
        }
        // 승리 조건 확인
        if (room.gameMode === "active-mafia") {
            const mafiasAlive = room.players.filter((p) => p.role === "mafia" && p.alive).length;
            const citizensAlive = room.players.filter((p) => p.role === "citizen" && p.alive).length;
            if (eliminatedPlayer.role === "mafia") {
                if (mafiasAlive - 1 === 0) {
                    return { winner: "citizen" };
                }
            }
            else if (mafiasAlive >= citizensAlive) {
                return { winner: "mafia" };
            }
        }
        return { winner: "draw" };
    }
}
exports.GameEngine = GameEngine;
//# sourceMappingURL=GameEngine.js.map