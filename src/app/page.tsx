"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setLoading(true);
    router.push(`/game-select?nickname=${encodeURIComponent(nickname)}`);
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    if (!roomCode.trim()) {
      setError("방 코드를 입력해주세요.");
      return;
    }
    setLoading(true);
    router.push(`/lobby?code=${roomCode}&nickname=${encodeURIComponent(nickname)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🎮 GameBox</h1>
          <p className="text-purple-100 text-lg">마피아 & 라이어 게임 플랫폼</p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* 닉네임 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError("");
              }}
              placeholder="플레이어 이름 입력"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition text-gray-900 placeholder-gray-500"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">{nickname.length}/20</p>
          </div>

          {/* 방 코드 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              방 코드 (입장 시)
            </label>
            <input
              type="text"
              value={roomCode.toUpperCase()}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="예: ABC123"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition uppercase text-gray-900 placeholder-gray-500"
              maxLength={6}
            />
          </div>

          {/* 에러 메시지 */}
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          {/* 버튼 */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50"
            >
              🎯 방 생성하기
            </button>
            <button
              onClick={handleJoinRoom}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50"
            >
              🚪 방 입장하기
            </button>
          </div>

          {/* 로딩 인디케이터 */}
          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-300 border-t-purple-600"></div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-purple-100 text-sm">
          <p>대화와 추리로 승리를 차지하세요! 🔍</p>
        </div>
      </div>
    </div>
  );
}
