# GameBox 프로젝트 개발 가이드

## 프로젝트 개요

**GameBox**는 폰을 중개자로 활용하여 대화와 대면 상호작용을 극대화하는 마피아 & 라이어 통합 플랫폼입니다.

## 핵심 개발 원칙

1. **폰 사용 시간 최소화**: 직관적인 UI로 빠른 의사결정
2. **데이터 기반 추리**: 게임 로그와 미션 이력으로 객관적 근거 제공
3. **자연스러운 논쟁 유도**: '바보 모드'로 게임 긴장감 극대화

## 개발 환경 설정

### 필수 설정

1. **환경변수 (.env.local)**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   ```

2. **Supabase 데이터베이스**
   - `database-schema.sql` 실행하여 테이블 생성
   - 샘플 WordSet 데이터 포함

3. **의존성 설치**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

## 프로젝트 구조 가이드

### Frontend (/src)
- **app/**: 페이지 라우트
  - `page.tsx`: 홈 페이지
  - `game-select/page.tsx`: 게임 선택
  - `lobby/page.tsx`: 게임 로비
- **components/**: 재사용 가능한 컴포넌트
- **lib/services/**: 비즈니스 로직
  - `socket.ts`: Socket.io 클라이언트 관리
  - `game.ts`: 게임 서비스 클래스
- **types/**: TypeScript 타입 정의

### Backend (/server/src)
- **index.ts**: Express + Socket.io 서버
- **game/**: 게임 로직
  - `RoomManager.ts`: 방 관리
  - `GameEngine.ts`: 게임 진행 엔진
- **database/**: DB 서비스 (추가 개발 필요)

## 개발 워크플로우

### 로컬 개발
```bash
npm run dev
# 프론트엔드: http://localhost:3000
# 백엔드: http://localhost:4000
```

### 개별 실행
```bash
npm run dev:frontend  # 프론트엔드만
npm run dev:backend   # 백엔드만
```

## 핵심 기능 구현 체크리스트

### 게임 시스템
- [ ] 액티브 마피아 - 미션 시스템
- [ ] 액티브 마피아 - 역할 배정 및 투표
- [ ] 커스텀 라이어 - 난이도별 게임 로직
- [ ] 커스텀 라이어 - 바보 모드 구현

### UI/UX
- [ ] 게임 중 실시간 상태 동기화
- [ ] 모바일 최적화 (Tailwind CSS)
- [ ] 결과 리포트 페이지
- [ ] 복기 기능

### 데이터베이스
- [ ] Supabase 연동 완료
- [ ] 게임 로그 저장
- [ ] 플레이어 통계 조회

### 배포
- [ ] Vercel에 프론트엔드 배포
- [ ] Render.com에 백엔드 배포
- [ ] 환경변수 설정 완료

## TypeScript 타입 정의

### 주요 타입 (src/types/game.ts)
- `GameMode`: 'active-mafia' | 'custom-liar'
- `GameState`: 게임 상태
- `PlayerRole`: 플레이어 역할
- `Room`: 방 정보
- `Player`: 플레이어 정보
- `Mission`: 미션 정보
- `WordSet`: 라이어 게임 단어

## Socket.io 이벤트 규칙

### 명명 규칙
- 형식: `domain:action`
- 예: `room:create`, `game:vote`

### 주요 이벤트
- **room:*** 방 관련 (생성, 입장, 나가기)
- **game:*** 게임 진행 (시작, 미션, 투표)
- **error** 에러 처리

## 배포 및 비용 절감

### 프론트엔드 (Vercel)
- GitHub 연동으로 자동 배포
- 무료 티어 사용 가능

### 백엔드 (Render.com)
- 무료 티어 사용
- `npm start` 명령으로 실행

### 데이터베이스 (Supabase)
- 무료 티어로 SQL 연습 가능
- PostgreSQL 기반

## 개발 팁

### 실시간 에러 디버깅
```typescript
// Socket.io 에러 핸들링
socket.on("error", (error) => {
  console.error("Socket error:", error);
});
```

### TypeScript 엄격 모드
- `strict: true`로 설정되어 있음
- `any` 타입 사용 최소화

### 커밋 메시지 규칙
- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 코드 개선
- `docs:` 문서 수정
- `test:` 테스트 추가

## 추가 개발 항목

1. **인증 시스템** (미구현)
   - 로그인/회원가입 추가
   - 플레이어 프로필

2. **통계 및 리더보드** (미구현)
   - 승률, 포인트 통계
   - 전체 순위

3. **채팅 기능** (미구현)
   - Socket.io로 실시간 채팅
   - 게임 중 채팅 제한

4. **모바일 앱** (추후 개발)
   - React Native로 네이티브 앱
   - 또는 PWA로 설치 가능한 웹앱

## 문제 해결

### Socket.io 연결 안 됨
1. 백엔드 서버 실행 확인
2. `NEXT_PUBLIC_SOCKET_URL` 환경변수 확인
3. 브라우저 콘솔 에러 확인

### Supabase 연결 실패
1. 환경변수 URL과 Key 확인
2. Supabase 프로젝트 API 활성화 확인
3. Row Level Security 정책 확인

### Tailwind CSS 스타일 미적용
1. `npm run dev` 재시작
2. `tailwind.config.ts`에서 경로 확인
3. 클래스명 오타 확인

## 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Socket.io 한국 가이드](https://socket.io/docs/)
- [Supabase 튜토리얼](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

---

**마지막 업데이트**: 2026-01-31
