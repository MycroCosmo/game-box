# GameBox

Next.js와 Socket.io로 만든 실시간 파티게임 프로토타입입니다. 방 생성·참여와 라이어 역할·제시어 전달을 서버에서 처리합니다.

## 현재 구현 범위

| 항목 | 현재 상태 |
| --- | --- |
| 방 생성·입장·퇴장 | Socket.io 이벤트와 `RoomManager`에서 처리 |
| 게임 시작·다시 시작 | 호스트 확인 후 실행 |
| 라이어 제시어 | `classic` / `fool` 방식으로 샘플 단어 전달 |
| 재입장 | 닉네임으로 플레이어를 찾아 소켓과 제시어 상태 갱신 |
| 미션 확인 | `confirmMission()`은 stub이며 실제 처리 미구현 |
| 투표·승리 판정 | `submitVote()`는 고정 결과를 반환하는 stub |
| 서버 재시작 복구 | 방·제시어 상태가 메모리에 있어 보장하지 않음 |

화면이나 이벤트 이름이 존재하는 것과 게임 규칙 구현이 완료된 것은 구분합니다. 완성된 마피아·라이어 게임이나 운영 검증이 끝난 서비스로 소개하지 않습니다.

## 기술과 구조

Next.js·React·TypeScript 클라이언트와 Express·Socket.io 서버를 사용합니다.

```text
브라우저 / Next.js
  └─ Socket.io
       └─ Express 서버
            ├─ RoomManager: 방·플레이어 상태
            └─ GameEngine: 역할·제시어 상태
                 └─ 프로세스 메모리(Map)
```

Supabase 관련 의존성이 있어도 현재 `RoomManager`와 `GameEngine`은 방·제시어를 DB에 저장하지 않습니다. `server/src/database` 폴더나 DB 기반 상태 복구가 구현되어 있다는 설명은 사용하지 않습니다.

## 로컬 실행

Node.js와 npm을 준비하고 **저장소 루트**에서 시작합니다.

```bash
npm install
npm --prefix server install
```

루트 `.env.local`:

```dotenv
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

`server/.env`:

```dotenv
PORT=4000
FRONTEND_URL=http://localhost:3000
```

두 환경 파일은 본인의 로컬에서 작성하고 실제 비밀정보를 커밋하지 마세요. 현재 서버의 방·제시어 처리는 외부 DB 없이 메모리에서 동작합니다.

저장소 루트에서 프론트엔드와 백엔드를 함께 실행합니다.

```bash
npm run dev
```

| 확인 대상 | 기본 주소 |
| --- | --- |
| 웹 화면 | `http://localhost:3000` |
| 서버 상태 | `http://localhost:4000/health` |

서버만 따로 실행하려면 `npm run dev:backend`, 화면만 실행하려면 `npm run dev:frontend`를 사용합니다. 다른 기기에서 접속할 때는 소켓 주소와 허용 Origin을 해당 환경에 맞게 변경해야 합니다.

### 빌드 후 개별 실행

```bash
npm run build
```

빌드 성공 후 서로 다른 터미널에서 루트 기준으로 실행합니다.

```bash
npm run start:frontend
```

```bash
npm run start:backend
```

## 코드 위치

- [소켓 이벤트와 서버 시작](server/src/index.ts)
- [방·플레이어 관리](server/src/game/RoomManager.ts)
- [게임 엔진과 미구현 stub](server/src/game/GameEngine.ts)
- [클라이언트 소켓 연결](src/lib/services/socket.ts)
- [로비에서 사용하는 소켓 주소](src/app/lobby/page.tsx)

## 남아 있는 검증 항목

현재 재입장은 닉네임을 사용하므로 토큰 기반 본인 확인과 동일하지 않습니다. 연결 해제 후 복구, 플레이어별 정보 비공개 전달, 투표 요청자의 권한, 중복·지연 이벤트, 프로세스 재시작은 별도 구현·회귀 테스트가 필요합니다.

실행 명령과 코드 구조를 정리한 문서이며, 전체 게임 시나리오와 배포 환경을 검증 완료했다는 의미는 아닙니다.
