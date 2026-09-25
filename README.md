# GameBox

여러 사용자가 같은 방에 접속해 실시간으로 게임 상태를 공유하는 파티게임 플랫폼입니다.

Next.js 클라이언트와 Node.js/Socket.io 서버를 분리하고, 방과 게임 상태는 서버가 기준이 되도록 구성했습니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Database | PostgreSQL / Supabase |
| Deployment | Vercel, Render |

## 구조

\`\`\`text
Players
  │
  ▼
Next.js Client
  │ Socket.io
  ▼
Express / Socket.io Server
  │
  ├── RoomManager
  ├── GameEngine
  └── Persistence
  │
  ▼
PostgreSQL
\`\`\`

방 참여 상태와 게임 진행 상태는 서버에서 관리합니다.

클라이언트가 각자 게임 결과를 판단하지 않고 서버에서 전달받은 상태를 기준으로 화면을 갱신하도록 했습니다.

## 게임 모드

### Active Mafia

게임 진행 중 플레이어에게 미션을 부여하고, 다른 사용자가 해당 미션 수행 여부를 확인할 수 있도록 구성했습니다.

### Custom Liar

난이도에 따라 라이어에게 제공되는 정보를 다르게 합니다.

일부 모드에서는 라이어라는 사실을 직접 알려주지 않고 실제 정답과 유사한 다른 단어를 제공해 게임 흐름을 다르게 만들었습니다.

## 서버 역할

- 방 생성 / 입장 / 퇴장
- 플레이어 상태 관리
- 게임 시작
- 역할 및 미션 할당
- 게임 phase 전환
- 투표 및 미션 확인
- 상태 변경 broadcast
- 게임 결과 및 로그 저장

대표 Socket.io event:

\`\`\`text
room:create
room:join
room:leave
game:start
game:phase-change
game:mission-assign
game:mission-confirm
game:vote
game:end
\`\`\`

## 실패 상황

실시간 서비스에서는 정상 연결 상태만 고려하면 안 된다고 판단했습니다.

다음 상황을 별도 문제로 다루고 있습니다.

- Socket 연결 해제
- 재연결 후 클라이언트 상태 불일치
- 늦게 도착한 event
- 중복 event
- 게임 중 사용자 이탈
- 서버와 클라이언트 상태 동기화

재접속 이후 상태 복구 로직은 계속 개선 중입니다.

## 프로젝트 구조

\`\`\`text
game-box/
├── src/                    # Next.js Client
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
├── server/
│   └── src/
│       ├── game/
│       │   ├── RoomManager.ts
│       │   └── GameEngine.ts
│       └── database/
└── database-schema.sql
\`\`\`

## 실행

Frontend와 Backend dependency를 각각 설치합니다.

\`\`\`bash
npm install

cd server
npm install
\`\`\`

Supabase 연결 정보와 Frontend/Backend origin 등은 환경 변수로 관리합니다.

## 이 프로젝트에서 다룬 내용

- Multiplayer authoritative server state
- Event-driven backend
- 실시간 방 상태 동기화
- 게임 phase / role 상태 모델링
- WebSocket 연결 해제와 재접속 처리
