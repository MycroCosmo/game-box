# 🎮 GameBox - 마피아 & 라이어 통합 플랫폼

> 폰을 '중개자'로 활용하여 대화와 대면 상호작용을 극대화하는 모바일 웹 게임 플랫폼

## 🚀 프로젝트 개요

**GameBox**는 다음과 같은 핵심 철학을 바탕으로 개발되었습니다:

- **폰을 보는 시간 최소화**: 직관적인 UI로 빠른 의사결정 지원
- **데이터 기반의 추리**: 게임 로그와 미션 이력으로 객관적 근거 제공
- **자연스러운 논쟁 유도**: '바보 모드'를 통해 게임의 긴장감 극대화

## 🎯 핵심 게임 모드

### 1️⃣ 액티브 마피아 (Active Mafia)

**미션 시스템**
- 밤마다 모든 플레이어에게 구체적인 질문 또는 행동 미션 부여
- 예: "B에게 어제 본 유튜브에 대해 물어보기"

**검증 로직**
- 미션 수행 후 버튼 클릭 시 상대방에게 확인 팝업 전송
- 성공 시 포인트 지급

**정보 제공**
- 시민들에게 파편화된 단서 제공
- 예: "A는 어제 움직임이 감지되었습니다"

### 2️⃣ 커스텀 라이어 (Custom Liar)

**난이도 시스템**
- **Low**: 라이어 인지 가능, 힌트 없음
- **Normal**: 라이어 인지 가능, 카테고리/속성 힌트 제공
- **High (바보 모드)**: 라이어에게 자신이 라이어임을 알리지 않고 '유사 정답' 제공
  - 정답: '색연필', 라이어에게 제시: '싸인펜'

**승리 조건**
- 시민: 라이어 검거
- 라이어: 정답 맞히기

## 💻 기술 스택

| 계층 | 기술 |
|------|------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | Supabase (PostgreSQL) |
| **Styling** | Tailwind CSS |
| **Real-time** | Socket.io WebSocket |
| **Deployment** | Vercel (Frontend), Render.com (Backend) |

## 📁 프로젝트 구조

```
gamebox/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 홈 페이지
│   │   ├── game-select/page.tsx  # 게임 선택
│   │   ├── lobby/page.tsx        # 게임 로비
│   │   └── api/                  # API 라우트
│   ├── components/
│   │   ├── game/                 # 게임 관련 컴포넌트
│   │   └── ui/                   # UI 컴포넌트
│   ├── lib/
│   │   ├── services/
│   │   │   ├── socket.ts         # Socket.io 클라이언트
│   │   │   └── game.ts           # 게임 서비스
│   │   ├── supabase/
│   │   │   └── client.ts         # Supabase 클라이언트
│   │   └── utils/
│   └── types/
│       └── game.ts               # 게임 타입 정의
├── server/
│   ├── src/
│   │   ├── index.ts              # 메인 서버 파일
│   │   ├── game/
│   │   │   ├── RoomManager.ts    # 방 관리
│   │   │   └── GameEngine.ts     # 게임 엔진
│   │   ├── database/             # DB 서비스
│   │   └── lib/
│   ├── package.json
│   └── tsconfig.json
├── database-schema.sql           # 데이터베이스 스키마
├── .env.local                    # 환경변수 설정
└── package.json
```

## 🛠️ 설치 및 실행

### 1단계: 의존성 설치

```bash
npm install
cd server && npm install && cd ..
```

### 2단계: 환경변수 설정

`.env.local` 파일에서 다음을 수정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Socket.io 서버 (개발환경)
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### 3단계: Supabase 데이터베이스 설정

1. [Supabase](https://supabase.com)에 가입
2. 새 프로젝트 생성
3. SQL 에디터에서 `database-schema.sql` 실행
4. 프로젝트 URL과 Anon Key를 `.env.local`에 입력

### 4단계: 개발 서버 실행

```bash
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

## 📊 데이터베이스 스키마

### Rooms (방)
- `id`: UUID
- `code`: 방 코드 (6자)
- `host_id`: 호스트 ID
- `game_mode`: 'active-mafia' | 'custom-liar'
- `state`: 게임 상태
- `players`: 플레이어 배열

### Players (플레이어)
- `id`: UUID
- `room_id`: 방 ID
- `socket_id`: Socket ID
- `nickname`: 닉네임
- `role`: 'citizen' | 'mafia' | 'liar'
- `alive`: 생존 여부
- `points`: 포인트

### Missions (미션)
- `id`: UUID
- `room_id`: 방 ID
- `player_id`: 플레이어 ID
- `mission_text`: 미션 텍스트
- `type`: 'question' | 'action'
- `completed`: 완료 여부

### WordSets (단어 세트)
- `id`: UUID
- `answer`: 정답
- `decoy`: 라이어용 유사 정답
- `category`: 카테고리
- `difficulty`: 'low' | 'normal' | 'high'
- `hint`: 힌트

### GameLogs (게임 로그)
- `id`: UUID
- `room_id`: 방 ID
- `result`: 게임 결과
- `started_at`: 시작 시간
- `ended_at`: 종료 시간
- `players_summary`: 플레이어 정보 (JSON)

## 🎮 게임 플로우

```
1. 홈페이지 (/)
   ↓
2. 게임 선택 (/game-select)
   ↓
3. 로비 (/lobby)
   ↓
4. 게임 진행 (/game)
   ↓
5. 결과 보기 (/result)
```

## 🌐 배포 가이드

### Frontend 배포 (Vercel)

```bash
npm run build
# Vercel에 연결된 GitHub 저장소에서 자동 배포
```

### Backend 배포 (Render.com)

1. GitHub에 `server` 디렉토리를 푸시
2. Render.com에서 New Web Service 생성
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. 환경변수 설정:
   - `FRONTEND_URL`: https://your-vercel-app.vercel.app
   - `SUPABASE_URL`: Supabase 프로젝트 URL
   - `SUPABASE_SERVICE_KEY`: Supabase Service Key

## 📱 UI/UX 특징

- **반응형 디자인**: 모바일 우선 설계
- **아이콘 중심 UI**: 직관적이고 빠른 인식
- **실시간 동기화**: Socket.io를 통한 즉각적인 상태 업데이트
- **복기 기능**: 게임 종료 후 모든 미션과 정답 공개

## 🔧 개발 팁

### Hot Reload
- 백엔드: `ts-node-dev`로 자동 리로드
- 프론트엔드: Next.js 기본 Hot Module Replacement

### 디버깅
```bash
# 백엔드만 실행
npm run dev:backend

# 프론트엔드만 실행
npm run dev:frontend
```

## 📝 API 문서

### Socket.io 이벤트

#### 방 관련
- `room:create` - 새 방 생성
- `room:join` - 기존 방 입장
- `room:leave` - 방 나가기
- `room:state-update` - 방 상태 업데이트 (수신)

#### 게임 진행
- `game:start` - 게임 시작
- `game:phase-change` - 게임 페이즈 변경 (수신)
- `game:mission-assign` - 미션 할당 (수신)
- `game:mission-confirm` - 미션 완료 확인
- `game:vote` - 투표
- `game:end` - 게임 종료 (수신)

## 🐛 알려진 이슈

- Socket.io 재연결 시 사용자 상태 동기화 개선 필요
- 네트워크 끊김 시 복구 로직 강화 필요

## 📚 추가 학습 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Socket.io 문서](https://socket.io/docs/)
- [Supabase 문서](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 라이선스

MIT License

## 👥 기여

이 프로젝트에 기여하고 싶으신가요? Pull Request를 보내주세요!

---

**Happy Gaming! 🎮✨**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
