"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import { connectSocket } from "@/lib/services/socket";
import GameService from "@/lib/services/game";
import type { JoinResponse } from "@/lib/services/game";
import { Room } from "@/types/game";

export const dynamic = "force-dynamic";

function LobbyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initializationRef = useRef(false);

  const nickname = searchParams.get("nickname") || "";
  const code = searchParams.get("code");
  const gameMode = searchParams.get("gameMode") as "active-mafia" | "custom-liar" | null;
  const maxPlayers = parseInt(searchParams.get("maxPlayers") || "6", 10);

  const [room, setRoom] = useState<Room | null>(null);
  const [selfPlayerId, setSelfPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameService, setGameService] = useState<GameService | null>(null);
  const [liarMode, setLiarMode] = useState<"fool" | "classic">("classic");

  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializeSocket = async () => {
      try {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        const socket = await connectSocket(socketUrl);
        const service = new GameService(socket);
        setGameService(service);

        service.onRoomStateUpdate((updatedRoom) => {
          setRoom(updatedRoom);
          if (updatedRoom.state !== "waiting") {
            router.push(`/game?nickname=${encodeURIComponent(nickname)}&code=${updatedRoom.code}`);
          }
        });

        if (code) {
          // joinRoom => { room, self }
          const resp = await service.joinRoom(code, nickname);
          setRoom(resp.room);
          setSelfPlayerId(resp.self?.playerId ?? null);
        } else if (gameMode) {
          // createRoom => { code, room, self }
          const resp = await service.createRoom(nickname, gameMode, maxPlayers);
          setRoom(resp.room);
          setSelfPlayerId(resp.self?.playerId ?? null);

          window.history.replaceState(
            {},
            "",
            `/lobby?nickname=${encodeURIComponent(nickname)}&code=${resp.code}`
          );
        } else {
          throw new Error("방 코드 또는 게임 모드가 없습니다.");
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    initializeSocket();

    return () => {
      // 필요하면 disconnect/cleanup 추가
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartGame = async () => {
    if (room && gameService) {
      try {
        if (room.gameMode === "custom-liar") await gameService.startGame(room.id, liarMode);
        else await gameService.startGame(room.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "게임 시작 실패");
      }
    }
  };

  const handleLeaveRoom = async () => {
    if (room && gameService) {
      try {
        await gameService.leaveRoom(room.id);
      } catch (err) {
        // leave 실패해도 UX상 홈으로는 보냄
      } finally {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-purple-300 mx-auto mb-4"></div>
          <p className="text-white text-lg">로비 준비 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <p className="text-red-600 font-semibold mb-4">❌ {error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  // host 판별은 selfPlayerId 기반
  const isHost = !!selfPlayerId && selfPlayerId === room.host;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 게임 로비</h1>
          <p className="text-purple-100 text-lg">
            방 코드: <span className="font-bold text-2xl">{room.code}</span>
          </p>
        </div>

        {/* 방 정보 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">게임 모드</p>
              <p className="text-xl font-bold text-gray-800">
                {room.gameMode === "active-mafia" ? "🕵️ 액티브 마피아" : "🎭 커스텀 라이어"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">상태</p>
              <p className="text-xl font-bold text-gray-800 capitalize">{room.state}</p>
            </div>
          </div>

          {/* 커스텀 라이어 모드 선택 */}
          {room.gameMode === "custom-liar" && room.state === "waiting" && isHost && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-700 text-sm font-semibold mb-3">게임 모드 선택</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLiarMode("fool")}
                  className={`py-3 px-4 rounded-lg font-semibold transition ${
                    liarMode === "fool"
                      ? "bg-yellow-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-2xl mb-1">🤪</div>
                  <div className="text-sm font-bold">바보 모드</div>
                  <div className="text-xs mt-1 opacity-90">라이어는 비슷한 단어를 봄</div>
                </button>
                <button
                  onClick={() => setLiarMode("classic")}
                  className={`py-3 px-4 rounded-lg font-semibold transition ${
                    liarMode === "classic"
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-2xl mb-1">🎭</div>
                  <div className="text-sm font-bold">클래식 모드</div>
                  <div className="text-xs mt-1 opacity-90">라이어는 단어를 모름</div>
                </button>
              </div>
            </div>
          )}

          {/* 플레이어 목록 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              플레이어 ({room.players.length}/{room.maxPlayers})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-4 text-center"
                >
                  <p className="font-semibold text-gray-800">{player.nickname}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {room.host === player.id ? "👑 호스트" : "👤 플레이어"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 3}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
            >
              ✓ 게임 시작 ({room.players.length}/3)
            </button>
          )}
          <button
            onClick={handleLeaveRoom}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition"
          >
            × 로비 나가기
          </button>
        </div>

        {!isHost && (
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-blue-900 text-sm">💡 호스트가 게임을 시작할 때까지 기다려주세요.</p>
          </div>
        )}

        {room.players.length < 3 && isHost && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-yellow-900 text-sm">⚠️ 게임을 시작하려면 최소 3명 이상 필요합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Lobby() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>}>
      <LobbyContent />
    </Suspense>
  );
}
