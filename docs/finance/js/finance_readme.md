# finance 모듈 — 개발 가이드

## 파일 구조

```
docs/
├── html/index.html               ← 진입 페이지
└── finance/
    ├── css/
    │   └── finance.css           ← 모듈 전용 스타일 (DESIGN.md 기반)
    └── js/
        ├── msg.js                ← 사용자 메시지 상수
        ├── supabase-client.js    ← Supabase 클라이언트 (타 모듈과 동일 URL/Key)
        └── finance.js            ← 메인 로직 (지출 CRUD, 예산, 정산, 차트)
```

---

## Supabase 테이블 생성 SQL

팀 Supabase 프로젝트 > SQL Editor에서 아래를 실행한다.

```sql
-- 지출 내역 테이블
CREATE TABLE IF NOT EXISTS public.expenses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  expense_date date        NOT NULL,
  category     text        NOT NULL,   -- 'accommodation' | 'food' | 'transport' | 'activity' | 'shopping' | 'etc'
  amount       numeric     NOT NULL CHECK (amount > 0),
  description  text        NOT NULL,
  payer        text,                   -- 결제자 이름 (정산에 사용)
  created_at   timestamptz DEFAULT now()
);

-- 예산 테이블 (최신 레코드를 현재 예산으로 사용)
CREATE TABLE IF NOT EXISTS public.budgets (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  amount     numeric     NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets  ENABLE ROW LEVEL SECURITY;

-- 정책 예시: 로그인 사용자는 전체 읽기 가능, 본인 데이터만 CUD
CREATE POLICY "expenses_select_all"  ON public.expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert_own"  ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update_own"  ON public.expenses FOR UPDATE USING   (auth.uid() = user_id);
CREATE POLICY "expenses_delete_own"  ON public.expenses FOR DELETE USING   (auth.uid() = user_id);

CREATE POLICY "budgets_select_all"   ON public.budgets  FOR SELECT USING (true);
CREATE POLICY "budgets_insert_own"   ON public.budgets  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 주요 기능 요약

| 기능           | 설명 |
|----------------|------|
| **지출 추가**  | 날짜·카테고리·금액·내용·결제자 입력 후 Supabase `expenses`에 insert |
| **지출 수정**  | 수정 버튼 → 수정 폼 자동 채움 → `update` |
| **지출 삭제**  | 작성자 본인만 가능, RLS + 프론트 조건 이중 확인 |
| **파이 차트**  | Chart.js 도넛 차트 — 카테고리별 금액 & 비율, 범례 자동 생성 |
| **예산 현황**  | 진행률 바 + 퍼센트 + 잔액/초과 표시 |
| **팀 정산**    | Greedy 알고리즘으로 최소 송금 횟수 계산 |
| **통계 요약**  | 총액·건수·건당 평균·최대 지출 4개 지표 표시 |

---

## 타 모듈 호환성

- **Supabase URL/Key**: `finance/js/supabase-client.js`는 `design/js/supabase-client.js`와 동일한 값 사용
- **네비게이션**: 상단 navbar에서 `../design/html/schedule.html`, `../design/html/imageupload.html`, `room.html`, `ai-chat.html` 링크 포함
- **디자인 시스템**: DESIGN.md 컬러 토큰·Plus Jakarta Sans·Bootstrap 5.3 사용
- **코딩 규칙**: AGENTS.md 준수 (ES6+, querySelector, 선언문 핸들러, 한글 주석 50자 이내)
