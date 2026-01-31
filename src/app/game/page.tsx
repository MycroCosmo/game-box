"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import { connectSocket } from "@/lib/services/socket";
import GameService from "@/lib/services/game";
import { Room, Mission, PlayerRole } from "@/types/game";

type Phase = "night" | "day" | "discussion" | "voting";
type LiarMode = "fool" | "classic";

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "";
  const code = searchParams.get("code") || "";

  const initializedRef = useRef(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [gameService, setGameService] = useState<GameService | null>(null);
  const [phase, setPhase] = useState<Phase>("night");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // custom-liar 개인 정보
  const [word, setWord] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  /**
   * isLiar 처리 규칙
   * - fool: 라이어도 모르게 => null
   * - classic: word가 null이면 라이어
   */
  const [isLiar, setIsLiar] = useState<boolean | null>(null);
  const [liarMode, setLiarMode] = useState<LiarMode | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let service: GameService | null = null;

    const initGame = async () => {
      try {
        if (!nickname || !code) {
          setError("닉네임 또는 방 코드가 없습니다.");
          setLoading(false);
          return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
        const socket = await connectSocket(socketUrl);

        service = new GameService(socket);
        setGameService(service);

        service.onRoomStateUpdate((updatedRoom) => setRoom(updatedRoom));
        service.onMissionAssign((data) => setMission(data.mission));
        service.onPhaseChange((data) => setPhase(data.phase as Phase));

        // ✅ 통합 이벤트: game:word (topic 포함)
        service.onWord((data) => {
          setWord(data.word ?? null);
          setTopic(data.topic ?? null);
          setLiarMode((data.mode as LiarMode) ?? null);

          if (data.mode === "classic") setIsLiar(data.word === null);
          else setIsLiar(null);
        });

        service.onError((err) => setError(err.message));

        // ✅ 방 재접속
        socket.emit("room:rejoin", { code, nickname }, (response: any) => {
          if (response?.error) setError(response.error);
          else setRoom(response);
          setLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "연결 오류");
        setLoading(false);
      }
    };

    initGame();

    return () => {
      if (service) {
        service.offRoomStateUpdate();
        service.offMissionAssign();
        service.offPhaseChange();
        service.offWord();
        service.offError();
      }
    };
  }, [nickname, code]);

  const handleMissionComplete = async () => {
    if (mission && gameService) {
      try {
        await gameService.submitMissionConfirmation(mission.id, true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "미션 완료 오류");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-purple-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isEnded = room?.state === "ended";
  const isCustomLiar = room?.gameMode === "custom-liar";
  const isMe = (p: { nickname: string }) => p.nickname === nickname;

  const getRoleEmoji = (player: any) => {
    if (!isEnded && !isMe(player)) return "❓";

    if (isCustomLiar && isMe(player)) {
      if (liarMode === "classic") {
        if (isLiar === true) return "🤥";
        if (isLiar === false) return "👤";
        return "❓";
      }
      if (liarMode === "fool") return "👤";
      return "❓";
    }

    const role: PlayerRole = player.role;
    if (role === "mafia") return "🔪";
    if (role === "liar") return "🤥";
    if (role === "citizen") return "👤";
    return "❓";
  };

  const myRoleText = () => {
    if (room?.gameMode === "active-mafia") {
      const mine = room?.players.find((p) => p.nickname === nickname);
      if (mine?.role === "mafia") return "🔪 마피아";
      return "👤 시민";
    }

    if (liarMode === "classic") {
      if (isLiar === true) return "🤥 라이어";
      if (isLiar === false) return "👤 시민";
      return "❓ 미확인";
    }

    if (liarMode === "fool") return "❓ (비공개)";
    return "❓ 미확인";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🎮 게임 진행 중</h1>
          <p className="text-purple-100">
            {room?.gameMode === "active-mafia"
              ? `페이즈: ${phase === "night" ? "🌙 밤" : "☀️ 낮"}`
              : "💭 라이어를 찾아내세요!"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🏠 방 상태</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">방 코드</p>
              <p className="text-2xl font-bold text-purple-600">{room?.code || "-"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">플레이어</p>
              <p className="text-2xl font-bold text-purple-600">
                {room?.players.length || 0}/{room?.maxPlayers || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">게임 모드</p>
              <p className="text-lg font-bold text-gray-800">
                {room?.gameMode === "active-mafia" ? "🕵️ 액티브 마피아" : "🤥 커스텀 라이어"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">나의 역할</p>
              <p className="text-lg font-bold text-gray-800">{myRoleText()}</p>
            </div>
          </div>
        </div>

        {mission && phase === "night" && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 나의 미션</h2>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">{mission.missionText}</p>
            <button
              onClick={handleMissionComplete}
              className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-3 rounded-lg transition"
            >
              ✓ 미션 완료
            </button>
          </div>
        )}

        {/* ========= custom-liar: fool ========= */}
        {room?.gameMode === "custom-liar" && liarMode === "fool" && word && (
          <div className="bg-blue-100 border-l-4 border-blue-500 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">📝 제시어</h2>

            {topic && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-gray-600 text-sm mb-2">주제:</p>
                <p className="text-xl font-bold text-center text-gray-800">{topic}</p>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-600 text-sm mb-2">단어:</p>
              <p className="text-3xl font-bold text-center text-gray-800">{word}</p>
            </div>
          </div>
        )}

        {/* ========= custom-liar: classic (liar) ========= */}
        {room?.gameMode === "custom-liar" && liarMode === "classic" && isLiar === true && (
          <div className="bg-red-100 border-l-4 border-red-500 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">🤥 당신은 라이어입니다!</h2>
            <p className="text-gray-700 text-lg">정답이 무엇인지 알아내고, 다른 사람들을 속이세요.</p>

            {/* ✅ 라이어도 주제는 보이게 */}
            {topic && (
              <div className="mt-4 bg-white rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2">주제:</p>
                <p className="text-lg text-gray-700">{topic}</p>
              </div>
            )}
          </div>
        )}

        {/* ========= custom-liar: classic (citizen) ========= */}
        {room?.gameMode === "custom-liar" && liarMode === "classic" && isLiar === false && word && (
          <div className="bg-blue-100 border-l-4 border-blue-500 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">👤 제시어</h2>

            {topic && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-gray-600 text-sm mb-2">주제:</p>
                <p className="text-xl font-bold text-center text-gray-800">{topic}</p>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 mb-4">
              <p className="text-gray-600 text-sm mb-2">단어:</p>
              <p className="text-3xl font-bold text-center text-gray-800">{word}</p>
            </div>
          </div>
        )}

        {/* 플레이어 목록 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👥 플레이어</h2>
          <div className="space-y-3">
            {room?.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.alive ? "bg-gray-100" : "bg-red-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getRoleEmoji(player)}</span>
                  <div>
                    <p className="font-bold text-gray-800">{player.nickname}</p>
                    <p className="text-sm text-gray-600">
                      {player.alive ? "생존" : "제거됨"} • {player.points} 포인트
                    </p>
                  </div>
                </div>

                {player.nickname === nickname && (
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">
                    나
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 디버깅용 */}
          {room?.gameMode === "custom-liar" &&
            room?.state !== "waiting" &&
            liarMode === "fool" &&
            !word && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                단어를 아직 받지 못했습니다. (서버 game:word 전송/재전송 확인)
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-purple-300" />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
