import { Server as SocketIOServer } from "socket.io";
import { RoomManager } from "./RoomManager";
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
export declare class GameEngine {
    private io;
    private roomManager;
    private missions;
    private votes;
    constructor(io: SocketIOServer, roomManager: RoomManager);
    startGame(roomId: string, io: SocketIOServer): Promise<void>;
    private assignRoles;
    private initializeActiveMafia;
    private initializeCustomLiar;
    confirmMission(missionId: string, confirmed: boolean): void;
    submitVote(roomId: string, voterId: string, targetId: string): {
        gameEnded: boolean;
        result?: {
            winner: "citizen" | "mafia" | "liar" | "draw";
        };
    };
    private calculateGameResult;
}
//# sourceMappingURL=GameEngine.d.ts.map