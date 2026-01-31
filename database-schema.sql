-- GameBox Supabase Database Schema
-- 마피아 & 라이어 통합 플랫폼 데이터베이스

-- 1. Rooms 테이블
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) NOT NULL UNIQUE,
  host_id UUID NOT NULL,
  game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('active-mafia', 'custom-liar')),
  state VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting', 'night', 'day', 'discussion', 'voting', 'ended')),
  current_phase VARCHAR(10) NOT NULL DEFAULT 'night' CHECK (current_phase IN ('day', 'night')),
  max_players INT NOT NULL CHECK (max_players >= 3 AND max_players <= 20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 2. Players 테이블
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socket_id VARCHAR(255) NOT NULL UNIQUE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'hidden' CHECK (role IN ('citizen', 'mafia', 'liar', 'hidden')),
  alive BOOLEAN DEFAULT true,
  points INT DEFAULT 0,
  confirmed_missions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 3. Missions 테이블
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_text TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('question', 'action')),
  target_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT false,
  confirmed_by UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 4. WordSets 테이블 (라이어 게임용)
CREATE TABLE IF NOT EXISTS word_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer VARCHAR(100) NOT NULL,
  decoy VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('low', 'normal', 'high')),
  hint TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 5. GameLogs 테이블
CREATE TABLE IF NOT EXISTS game_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('active-mafia', 'custom-liar')),
  result VARCHAR(20) NOT NULL CHECK (result IN ('citizen-win', 'mafia-win', 'liar-win', 'draw')),
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  players_summary JSONB NOT NULL,
  missions_summary JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 6. Votes 테이블
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_state ON rooms(state);
CREATE INDEX idx_rooms_deleted_at ON rooms(deleted_at);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_players_socket_id ON players(socket_id);
CREATE INDEX idx_players_deleted_at ON players(deleted_at);
CREATE INDEX idx_missions_room_id ON missions(room_id);
CREATE INDEX idx_missions_player_id ON missions(player_id);
CREATE INDEX idx_missions_deleted_at ON missions(deleted_at);
CREATE INDEX idx_word_sets_category ON word_sets(category);
CREATE INDEX idx_word_sets_difficulty ON word_sets(difficulty);
CREATE INDEX idx_word_sets_deleted_at ON word_sets(deleted_at);
CREATE INDEX idx_game_logs_room_id ON game_logs(room_id);
CREATE INDEX idx_game_logs_deleted_at ON game_logs(deleted_at);
CREATE INDEX idx_votes_room_id ON votes(room_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 초기 샘플 데이터 (라이어 게임용)
INSERT INTO word_sets (answer, decoy, category, difficulty, hint) VALUES
('색연필', '싸인펜', '미술용품', 'high', '다양한 색상을 표현할 수 있어요'),
('지우개', '붓', '문구류', 'normal', '실수를 수정할 때 사용해요'),
('나침반', '자', '측정도구', 'low', '방향을 알려줘요'),
('책갈피', '책마크', '문구류', 'normal', '책의 페이지를 표시해요'),
('스탠드', '손전등', '조명', 'low', '책상에서 공부할 때 켜요'),
('노트북', '스케치북', '필기구', 'normal', '수업 내용을 적어요'),
('펜', '연필', '필기구', 'high', '잉크로 쓰는 도구'),
('달력', '시계', '시간용품', 'low', '오늘의 날짜를 알 수 있어요'),
('안경', '렌즈', '시력교정용품', 'normal', '눈이 나쁠 때 써요'),
('우산', '레인코트', '우비', 'low', '비가 올 때 사용해요')
ON CONFLICT DO NOTHING;
