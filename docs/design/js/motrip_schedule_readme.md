# Motrip — 여행 일정 관리 모듈 (schedule CRUD) 가이드

> 작성일: 2026-06-08  
> 담당: AIBE7 Project1 E1I3 팀  
> 관련 파일: `schedule.html` / `css/schedule.css` / `js/schedule.js` / `js/supabase-client.js` / `js/msg.js`

---

## 1. 파일 구조

```
AIBE7-Project1-E1I3/
├── schedule.html              ← 일정 관리 UI 페이지
├── css/
│   └── schedule.css           ← 폰트(Paperlogy·Pretendard) + 최소 커스텀 스타일
└── js/
    ├── msg.js                 ← 사용자 표시 메시지 중앙 관리
    ├── supabase-client.js     ← Supabase 클라이언트 초기화 (URL·Key 교체 지점)
    ├── schedule.js            ← 일정 CRUD + 좋아요 로직 전체
    └── motrip_schedule_readme.md  ← 이 문서
```

---

## 2. Supabase 연결 설정

`js/supabase-client.js` 파일의 아래 두 상수를 **팀 Supabase 프로젝트 값으로 교체**한다.  
Supabase 대시보드 → `Project Settings` → `API` 탭에서 확인 가능.

```js
// js/supabase-client.js
const SUPABASE_URL      = "<!--YOUR_SUPABASE_URL_HERE-->";      // 예: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = "<!--YOUR_SUPABASE_ANON_KEY_HERE-->"; // 예: eyJhbGci...
```

> ⚠️ anon key는 공개 키이므로 커밋해도 무방하나,  
> `service_role` key는 절대 클라이언트 코드에 포함하지 않는다.

---

## 3. Supabase 테이블 생성 SQL

Supabase 대시보드 → `SQL Editor`에서 아래 쿼리를 **순서대로** 실행한다.

### 3-1. schedules 테이블 (일정 본체)

```sql
CREATE TABLE schedules (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_date  date        NOT NULL,   -- 일정 일자
  trip_time  time        NOT NULL,   -- 일정 시간
  content    text        NOT NULL,   -- 일정 내용
  created_at timestamptz DEFAULT now()
);
```

### 3-2. schedule_likes 테이블 (좋아요 투표)

```sql
CREATE TABLE schedule_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES schedules(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(schedule_id, user_id)  -- 유저 1명당 일정 1개 좋아요 중복 방지
);
```

### 3-3. RLS(Row Level Security) 정책 설정

RLS를 활성화하여 **본인 데이터만 수정·삭제** 가능하도록 제한한다.

```sql
-- schedules RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 전체 읽기 허용 (팀원 모두가 일정 목록 조회 가능)
CREATE POLICY "schedules_select_all"
  ON schedules FOR SELECT
  USING (true);

-- 로그인 유저만 일정 추가 가능
CREATE POLICY "schedules_insert_auth"
  ON schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 일정만 수정 가능
CREATE POLICY "schedules_update_own"
  ON schedules FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인 일정만 삭제 가능
CREATE POLICY "schedules_delete_own"
  ON schedules FOR DELETE
  USING (auth.uid() = user_id);


-- schedule_likes RLS
ALTER TABLE schedule_likes ENABLE ROW LEVEL SECURITY;

-- 전체 읽기 허용 (좋아요 수 집계 목적)
CREATE POLICY "likes_select_all"
  ON schedule_likes FOR SELECT
  USING (true);

-- 로그인 유저만 좋아요 추가 가능
CREATE POLICY "likes_insert_auth"
  ON schedule_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 좋아요만 취소(삭제) 가능
CREATE POLICY "likes_delete_own"
  ON schedule_likes FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 4. 기능 목록

| 기능 | 설명 |
|---|---|
| **일정 추가 (Create)** | 일자·시간·내용 입력 후 저장. 로그인 필수 |
| **일정 목록 (Read)** | 날짜·시간 오름차순 정렬. 비로그인도 열람 가능 |
| **일정 수정 (Update)** | 수정 버튼 클릭 → 수정 폼 표시 → 확인 저장. 본인 일정만 가능 |
| **일정 삭제 (Delete)** | 삭제 버튼 + 확인 팝업. 본인 일정만 가능 |
| **좋아요 (Like/Unlike)** | 토글 방식. 팀원 투표 기능 대체. 로그인 필수, 1인 1표 |

---

## 5. 일정 항목 구성

| 항목 | DB 컬럼 | HTML 입력 타입 |
|---|---|---|
| 일자 | `trip_date` (date) | `<input type="date">` |
| 시간 | `trip_time` (time) | `<input type="time">` |
| 내용 | `content` (text) | `<textarea>` |

---

## 6. 사용 메시지 수정

오류·안내·성공 메시지는 모두 `js/msg.js`의 `MSG` 상수 객체에 집중되어 있다.  
문구 변경이 필요하면 이 파일만 편집한다.

```js
// js/msg.js 예시
MSG.schedule.addSuccess  // "일정이 추가되었습니다."
MSG.schedule.deleteFail  // "일정 삭제에 실패했습니다."
MSG.auth.notLoggedIn     // "로그인이 필요한 기능입니다."
```

---

## 7. 보안 설계 원칙

- **이중 방어**: 프론트엔드에서 `user_id` 조건을 포함한 쿼리 + Supabase RLS 정책을 동시 적용  
- **XSS 방지**: 일정 내용 렌더링 시 `escapeHtml()` 함수로 특수문자 이스케이프  
- **중복 좋아요 방지**: DB 레벨 `UNIQUE(schedule_id, user_id)` 제약 적용  
- **anon key만 사용**: 클라이언트 코드에는 공개 키(anon)만 포함

---

## 8. 향후 연동 예정 사항

- [ ] 팀 Supabase URL·Key 교체 (`js/supabase-client.js`)
- [ ] `login.html` 페이지와 인증 흐름 연결
- [ ] 여행 그룹(trip) 단위로 일정 필터링 기능 추가 예정
- [ ] `profiles` 테이블 연동 시 작성자 닉네임 표시
