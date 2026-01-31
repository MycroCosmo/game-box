"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

interface Player {
  nickname: string;
  role: string;
  points: number;
}

interface Mission {
  text: string;
  completed: boolean;
}

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showDetails, setShowDetails] = useState(false);

  // 결과 데이터 파싱 (JSON으로 인코딩된 쿼리 파라미터에서)
  const resultData = searchParams.get("result");
  const result = resultData ? JSON.parse(decodeURIComponent(resultData)) : null;

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">데이터 없음</h1>
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

  const getWinnerEmoji = () => {
    switch (result.winner) {
      case "citizen":
        return "👤";
      case "mafia":
        return "🔪";
      case "liar":
        return "🤥";
      default:
        return "🤝";
    }
  };

  const getWinnerText = () => {
    switch (result.winner) {
      case "citizen":
        return "시민 승리!";
      case "mafia":
        return "마피아 승리!";
      case "liar":
        return "라이어 승리!";
      default:
        return "무승부";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-5xl font-bold mb-2">🎉 게임 종료!</h1>
          <p className="text-purple-100">경기를 완주하셨습니다</p>
        </div>

        {/* 승자 카드 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 text-center">
          <div className="text-6xl mb-4">{getWinnerEmoji()}</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">{getWinnerText()}</h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-100 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">게임 모드</p>
              <p className="font-bold text-purple-600">
                {result.gameMode === "active-mafia" ? "🕵️ 액티브 마피아" : "🤥 커스텀 라이어"}
              </p>
            </div>
            <div className="bg-blue-100 rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">플레이어</p>
              <p className="font-bold text-blue-600">{result.playerCount || 0}명</p>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-lg transition mb-6 w-full"
          >
            {showDetails ? "상세 정보 숨기기 ▲" : "상세 정보 보기 ▼"}
          </button>
        </div>

        {/* 상세 정보 */}
        {showDetails && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 경기 통계</h3>

            {/* 플레이어 통계 */}
            {result.players && (
              <div className="space-y-3 mb-6">
                <p className="text-gray-600 text-sm font-semibold">플레이어 성적</p>
                {result.players.map((player: Player, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                    <div>
                      <p className="font-bold text-gray-800">{player.nickname}</p>
                      <p className="text-sm text-gray-600">{player.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{player.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 미션 기록 */}
            {result.missions && result.missions.length > 0 && (
              <div className="mb-6">
                <p className="text-gray-600 text-sm font-semibold mb-3">미션 기록</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.missions.map((mission: Mission, index: number) => (
                    <div key={index} className="text-sm text-gray-700 p-2 bg-yellow-50 rounded">
                      ✓ {mission.text} {mission.completed ? "✅" : "❌"}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-3 rounded-lg transition"
          >
            🏠 홈으로 돌아가기
          </button>
          <button
            onClick={() => router.push("/game-select")}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition"
          >
            🎮 다시 플레이
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-purple-300"></div></div>}>
      <ResultContent />
    </Suspense>
  );
}
