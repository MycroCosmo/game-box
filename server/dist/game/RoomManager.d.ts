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
export declare class RoomManager {
    private rooms;
    private socketToRoom;
    createRoom(socketId: string, data: {
        nickname: string;
        gameMode: "active-mafia" | "custom-liar";
        maxPlayers: number;
    }): {
        code: string;
        room: Room;
    };
    joinRoom(code: string, socketId: string, nickname: string): Room;
    leaveRoom(roomId: string, socketId: string): Room | null;
    removePlayerBySocketId(socketId: string): void;
    getRoom(code: string): Room | undefined;
    getRoomById(roomId: string): Room | undefined;
    updateRoom(code: string, updates: Partial<Room>): Room;
    getRoomsCount(): number;
    private generateRoomCode;
}
//# sourceMappingURL=RoomManager.d.ts.map