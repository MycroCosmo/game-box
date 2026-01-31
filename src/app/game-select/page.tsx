"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function GameSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "";
  const [maxPlayers, setMaxPlayers] = useState(6);

  const handleSelectGame = (gameMode: "active-mafia" | "custom-liar") => {
    router.push(
      `/lobby?nickname=${encodeURIComponent(nickname)}&gameMode=${gameMode}&maxPlayers=${maxPlayers}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">게임 선택</h1>
          <p className="text-purple-100">
            환영합니다, <span className="font-bold">{nickname}</span>!
          </p>
        </div>

        {/* 게임 카드 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* 액티브 마피아 */}
          <div
            onClick={() => handleSelectGame("active-mafia")}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition"
          >
            <div className="text-5xl mb-4">🕵️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">액티브 마피아</h2>
            <p className="text-gray-600 mb-4">
              매일 밤 구체적인 미션을 수행하고, 시민과 마피아가 벌이는 심리전!
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ 실시간 미션 시스템</li>
              <li>✓ 파편화된 단서 제공</li>
              <li>✓ 투표로 마피아 제거</li>
            </ul>
          </div>

          {/* 커스텀 라이어 */}
          <div
            onClick={() => handleSelectGame("custom-liar")}
            className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transform hover:scale-105 transition"
          >
            <div className="text-5xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">커스텀 라이어</h2>
            <p className="text-gray-600 mb-4">
              정답을 맞혀야 하는 라이어를 찾아내세요! 난이도별 다양한 게임 경험.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ 3가지 난이도 (Low/Normal/High)</li>
              <li>✓ 바보 모드로 더 재미있게</li>
              <li>✓ 정답 및 힌트 시스템</li>
            </ul>
          </div>
        </div>

        {/* 플레이어 수 선택 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            최대 플레이어 수 선택
          </label>
          <p className="text-2xl font-bold text-purple-600 mb-4">선택됨: {maxPlayers}명</p>
          <div className="grid grid-cols-6 gap-2">
            {[3, 4, 5, 6, 7, 8].map((num) => (
              <button
                key={num}
                onClick={() => setMaxPlayers(num)}
                className={`py-2 rounded-lg font-bold transition ${
                  maxPlayers === num
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {num}명
              </button>
            ))}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-blue-900">
          <p className="font-semibold">💡 팁:</p>
          <p className="text-sm mt-1">
            게임을 선택하면 방이 생성됩니다. 다른 플레이어들을 초대하세요!
          </p>
        </div>

        {/* 뒤로가기 */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-purple-100 transition"
          >
            ← 뒤로가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GameSelect() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameSelectContent />
    </Suspense>
  );
}
