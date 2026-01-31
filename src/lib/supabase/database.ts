import { supabase } from "./client";
import { GameLog, WordSet, Mission } from "@/types/game";

interface GameLogRecord {
  result: string;
  players_summary: Array<{
    playerId: string;
    role: string;
    points: number;
  }>;
}

/**
 * Supabase 데이터베이스 서비스
 */
export class DatabaseService {
  /**
   * 게임 로그 저장
   */
  static async saveGameLog(gameLog: Omit<GameLog, "id">) {
    try {
      const { data, error } = await supabase.from("game_logs").insert([gameLog]).select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error("게임 로그 저장 오류:", error);
      throw error;
    }
  }

  /**
   * 미션 저장
   */
  static async saveMission(mission: Mission) {
    try {
      const { data, error } = await supabase.from("missions").insert([mission]).select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error("미션 저장 오류:", error);
      throw error;
    }
  }

  /**
   * 난이도별 단어 세트 조회
   */
  static async getWordSetByDifficulty(difficulty: "low" | "normal" | "high"): Promise<WordSet | null> {
    try {
      const { data, error } = await supabase
        .from("word_sets")
        .select("*")
        .eq("difficulty", difficulty)
        .is("deleted_at", null)
        .order("RANDOM()")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116은 결과 없음 에러
        throw error;
      }
      return data || null;
    } catch (error) {
      console.error("단어 세트 조회 오류:", error);
      return null;
    }
  }

  /**
   * 카테고리별 단어 세트 조회
   */
  static async getWordSetByCategory(category: string): Promise<WordSet[]> {
    try {
      const { data, error } = await supabase
        .from("word_sets")
        .select("*")
        .eq("category", category)
        .is("deleted_at", null)
        .order("RANDOM()")
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("단어 세트 조회 오류:", error);
      return [];
    }
  }

  /**
   * 게임 통계 조회
   */
  static async getGameStats(playerId: string) {
    try {
      const { data, error } = await supabase.from("game_logs").select("*").contains("players_summary", { player_id: playerId });

      if (error) throw error;

      if (!data || data.length === 0) {
        return { total: 0, wins: 0, winRate: 0, points: 0 };
      }

      let wins = 0;
      let totalPoints = 0;

      data.forEach((log: GameLogRecord) => {
        const playerSummary = log.players_summary?.find((p) => p.playerId === playerId);
        if (playerSummary) {
          totalPoints += playerSummary.points || 0;
          // 승리 조건 확인 (해당 플레이어의 역할과 결과 매치)
          if (
            (playerSummary.role === "citizen" && log.result === "citizen-win") ||
            (playerSummary.role === "mafia" && log.result === "mafia-win") ||
            (playerSummary.role === "liar" && log.result === "liar-win")
          ) {
            wins++;
          }
        }
      });

      return {
        total: data.length,
        wins,
        winRate: ((wins / data.length) * 100).toFixed(1),
        points: totalPoints,
      };
    } catch (error) {
      console.error("게임 통계 조회 오류:", error);
      return { total: 0, wins: 0, winRate: 0, points: 0 };
    }
  }

  /**
   * 샘플 단어 추가 (초기화)
   */
  static async initializeSampleWords() {
    const sampleWords: Omit<WordSet, "id">[] = [
      { answer: "색연필", decoy: "싸인펜", category: "미술용품", difficulty: "high", hint: "그리기도 하고 칠하기도 하는 도구" },
      { answer: "컴퓨터", decoy: "키보드", category: "전자제품", difficulty: "normal", hint: "데이터를 처리하는 기계" },
      { answer: "책", decoy: "신문", category: "인쇄물", difficulty: "low", hint: "여러 장의 종이를 엮어 만든 것" },
      { answer: "의자", decoy: "벤치", category: "가구", difficulty: "normal", hint: "앉기 위한 가구" },
      { answer: "우산", decoy: "모자", category: "소품", difficulty: "low", hint: "비나 햇빛을 막는 도구" },
    ];

    try {
      const { data, error } = await supabase.from("word_sets").insert(sampleWords);

      if (error) throw error;
      console.log("✓ 샘플 단어 추가 완료");
      return data;
    } catch (error) {
      console.error("샘플 단어 추가 오류:", error);
      throw error;
    }
  }
}

export default DatabaseService;
