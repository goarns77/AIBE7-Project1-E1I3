# ✈️ 모여행 (Motrip) — 공동 여행 계획 플랫폼

> 친구들과 함께 여행을 계획하고, 일정·투표·정산·AI 추천까지 한 공간에서 해결하는 **협업형 여행 플래너**

여러 명이 함께 여행을 준비할 때 생기는 **일정 조율, 장소 선정, 의견 수렴, 예산 관리** 문제를 하나의 공간에서 해결합니다. 단톡방에 흩어진 투표·정산·일정을 모여행 하나로 모았습니다.

---

## ✨ 주요 기능

| 기능                      | 설명                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| 🔐 **로그인 / 회원가입**  | Supabase Auth(이메일) 기반 인증                                              |
| 📋 **여행방 생성 / 초대** | 여행명·목적지·일정 입력 → **초대 링크**로 친구 모으기                        |
| 🗺️ **지도 + 장소 검색**   | 카카오 지도에서 장소 검색 → 일정에 추가 → 지도에 마커 표시                   |
| 🗓️ **일정 관리**          | 일자·시간·위치·내용으로 일정 추가/수정/삭제 + ♥ 좋아요 투표                  |
| 🗳️ **그룹 투표**          | 선택지 투표 → **막대 그래프**로 결과 집계 (1인 1표, 중복 방지)               |
| 💰 **지출 / 정산**        | 지출 기록 + 예산 현황 + **최소 송금 횟수 정산**(Greedy) + 카테고리 도넛 차트 |
| 🤖 **AI 여행 추천**       | Groq(LLM) 기반 맞춤 여행 일정 자동 생성                                      |
| 📸 **포토 앨범**          | 여행 사진 공유 (imageupload)                                                 |
| 🧭 **내 여행 대시보드**   | 내가 만들거나 참여한 여행방 목록                                             |

---

## 🛠 기술 스택

**프론트엔드**

- HTML5 / CSS3 / **Vanilla JavaScript (ES6+)**
- **Bootstrap 5** (대부분 페이지) · TailwindCSS (마이페이지)
- 폰트: Pretendard(본문) · Paperlogy(제목) — _Sky & Shore_ 디자인 토큰
- 외부 라이브러리: **카카오 지도 SDK**, **Chart.js**(차트), **marked**(마크다운 렌더)

**백엔드 / 서비스**

- **Supabase** — 인증(Auth) + 데이터베이스(PostgreSQL/PostgREST) + RLS
- **Node.js + Express** (`server.js`) — AI 채팅 중계 서버 + 정적 파일 서빙
- **LangChain + Groq** — AI 여행 추천 (`/api/chat`)

---

## 📁 폴더 구조

```
AIBE7-Project1-E1I3/
├── server.js                 # Express 서버 (정적 서빙 + /api/chat)
├── package.json
├── docs/                     # 웹 루트 (GitHub Pages /docs)
│   ├── finance.html          # 지출/정산 (단독 페이지)
│   ├── schedule.html         # 일정 (단독 페이지)
│   ├── imageupload.html      # 포토 앨범
│   ├── finance/              # 정산 모듈 (css/js)
│   ├── schedule/             # 일정 모듈 (css/js)
│   └── design/
│       ├── html/             # index, login, signup, room, room-create,
│       │                     #  room(플래너), ai-chat, mypage, schedule ...
│       ├── css/              # room.css(테마), index.css, ...
│       ├── images/           # 로고·배너
│       └── js/
│           ├── config.js     # ⚠️ 키 보관 (gitignore)
│           ├── api.js        # 여행방/투표/일정 데이터 계층 (Supabase REST)
│           ├── room.js       # 여행방 페이지 로직
│           ├── room-create.js
│           ├── ui.js         # 공통 헬퍼(토스트·복사·XSS·내 여행 목록)
│           ├── msg.js        # 사용자 메시지 중앙 관리
│           ├── map.js        # 카카오 지도
│           ├── schedule.js   # 일정 CRUD + 좋아요 + 지도 마커
│           ├── finance.js*   # 지출/정산/차트  (*docs/finance/js)
│           ├── ai-chat.js    # AI 채팅
│           ├── login.js / signup.js / mypage.js
│           ├── supabase-client.js / lib/supabase.js  # Supabase 클라이언트
```

---

## 🚀 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 (`.env`) — AI 채팅용

프로젝트 루트에 `.env` 생성:

```
GROQ_API_KEY=발급받은_Groq_API_키
PORT=3000
```

### 3. 클라이언트 키 설정 (`docs/design/js/config.js`)

```js
const CONFIG = {
  KAKAO_MAP_KEY: "카카오_JavaScript_키",
  SUPABASE_URL: "https://<프로젝트>.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_...",
};
```

### 4. 서버 실행

```bash
node server.js
# → http://localhost:3000
```

> ⚠️ **AI 채팅은 `node server.js`로 띄워야 동작**합니다. VS Code Live Server(정적)는 `/api/chat`를 처리하지 못합니다.
> 카카오 지도는 콘솔에 접속 도메인(`http://localhost:3000`, 배포 시 `https://<id>.github.io`)을 등록해야 표시됩니다.

---

## 🗄 데이터베이스 (Supabase)

| 테이블                               | 용도                    |
| ------------------------------------ | ----------------------- |
| `rooms` / `members`                  | 여행방 / 멤버           |
| `votes` / `vote_options` / `ballots` | 그룹 투표 / 선택지 / 표 |
| `itinerary_items`                    | (구) 일정 항목          |
| `schedules` / `schedule_likes`       | 일정 / 좋아요           |
| `expenses` / `budgets`               | 지출 / 예산             |
| `profiles`                           | 사용자 프로필           |

- **RLS**: 조회는 공개, 쓰기는 로그인 사용자(`auth.uid()`) 기준으로 제한
- 여행방·투표는 관계형 + FK `on delete cascade`로 연관 데이터 일괄 삭제, `unique` 제약으로 중복 투표 방지

---

## 🖥 주요 화면

| 경로                                     | 화면                                          |
| ---------------------------------------- | --------------------------------------------- |
| `/` (`design/html/index.html`)           | 랜딩 페이지                                   |
| `/design/html/login.html`, `signup.html` | 로그인 / 회원가입                             |
| `/design/html/room-create.html`          | 여행방 생성 + 초대                            |
| `/design/html/room.html?roomId=...`      | 여행방(플래너) — 지도·일정·투표·정산 통합 |
| `/design/html/ai-chat.html`              | AI 여행 추천                                  |
| `/design/html/mypage.html`               | 마이페이지                                    |
| `/imageupload.html`                      | 포토 앨범                                     |

---

## 🔒 보안

- 클라이언트 키(카카오 JS·Supabase publishable)는 **공개용**이며 도메인 제한이지만, 일단 `config.js`를 `.gitignore` 처리함
- **`GROQ_API_KEY`(서버 전용)** 은 `.env`로 관리
- 사용자 입력은 `escapeHtml()`로 이스케이프해 **XSS 방지**

---

## 👥 만든 사람

AIBE7 Project1 **E1I3** 팀

© 2026 모여행(Motrip) · 함께 떠나는 여행 계획
