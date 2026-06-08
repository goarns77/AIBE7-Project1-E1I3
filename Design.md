---
name: Sky & Shore Aesthetic (Motrip)
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4850'
  outline: '#6d7881'
  outline-variant: '#bdc8d2'
  primary: '#00658d'
  on-primary: '#ffffff'
  primary-container: '#00baff'
  on-primary-container: '#004764'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#62fae3'
  on-secondary-container: '#007165'
  tertiary: '#5c5f61'
  error: '#ba1a1a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Paperlogy
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Paperlogy
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Paperlogy
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Paperlogy
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter-desktop: 15%
  content-width: 70%
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

# Motrip — Smart Travel Platform Design

> Stitch 프로젝트 "Motrip: Smart Travel Platform"(`projects/5724738179706928102`)을 기준으로 정리한 디자인 가이드입니다. 5개 화면(홈, 플래너, 패키지 여행, AI 추천 에이전트, 마이페이지)의 스크린샷과 디자인 시스템(`Sky & Shore Aesthetic`)을 바탕으로 작성했습니다.

## Brand & Style

브랜드 성격은 **모험적이면서도 세련된** 느낌으로, 여행이 주는 자유로움과 소셜 네트워크의 매끄러운 연결감을 동시에 전달합니다. **모던 미니멀리즘 + 글래스모픽 악센트** 스타일을 사용해 고급스럽고 에디토리얼한 인상을 줍니다. 넓은 여백 위에 고품질 여행 사진을 주인공으로 배치하고, 기능성 오버레이에는 은은한 반투명 효과를 적용해 가볍고 "airy"한 UI를 구현합니다.

## Colors

수평선에서 영감을 받은 팔레트입니다.
- **Primary (Sky Blue, `#00658d` / 컨테이너 `#00baff`):** 자유로움과 광활한 하늘을 상징하며, 주요 액션과 브랜드 시그니처에 사용합니다.
- **Secondary (Fresh Green/Teal, `#006b5f` / 컨테이너 `#62fae3`):** 자연과 모험을 상징하며, 성공 상태·발견 태그·친환경 표시에 사용합니다.
- **Background (Clean White/Sky, `#f8f9ff`):** 이미지 대비를 살리는 깨끗한 캔버스 역할을 합니다.
- **Outline/Neutral (Soft Gray):** 시각적 노이즈 없이 구조를 잡아주는 보조 색상입니다.
- **Text (`#0b1c30`):** 순수 검정보다 부드러운 슬레이트 블루-그레이로 가독성과 톤을 동시에 확보합니다.

## Typography

제목 계열은 **Paperlogy**, 본문·라벨 계열은 **Pretendard**를 사용해 한글 가독성과 현대적이고 친근한 인상을 동시에 확보합니다. (프로젝트 표준 폰트, AGENTS.md 기준)
- **Headline / Display (Paperlogy):** 굵은 weight와 좁은 자간으로 임팩트를 줍니다 (`display-hero` 48px/800, `headline-lg` 32px/700).
- **Body (Pretendard):** 1.6의 넉넉한 line-height로 후기·설명 등 장문 콘텐츠의 가독성을 확보합니다.
- **Label/Caption (Pretendard):** semi-bold + 약간의 letter-spacing으로 본문과 구분되는 보조 정보를 표현합니다.
- **모바일 스케일링:** `headline-lg`는 모바일에서 28px로 축소되어 균형을 유지합니다.
- **한글 처리:** `word-break: keep-all`을 적용해 단어 단위 줄바꿈을 유지합니다.

## Layout & Spacing

**Fixed-Focus Grid**를 사용하며, 데스크톱에서는 콘텐츠가 뷰포트의 **70%**를 차지하고 양쪽에 **15% 거터**를 두어 에디토리얼 매거진 같은 "컬럼" 느낌을 줍니다.

- **Desktop:** 70% 컨테이너 내 12-컬럼 그리드, 최대 너비 1280px.
- **Tablet:** 8-컬럼 그리드, 좌우 40px 마진.
- **Mobile:** 단일 컬럼, 좌우 20px 마진, 완전 유동형.

8px 베이스 유닛을 기준으로 spacing을 구성하며 (`stack-sm` 8px, `stack-md` 16px, `stack-lg` 32px), 섹션 간 간격은 64px 이상을 확보해 정돈된 느낌을 유지합니다.

## Elevation & Depth

**Ambient Shadow + Tonal Layering**으로 깊이를 표현합니다. 검정 그림자 대신 Primary Blue 톤의 부드럽고 확산된 그림자(`rgba(0, 186, 255, 0.08)`)를 사용해 카드가 흰 캔버스 위에 떠있는 듯한 인상을 줍니다.

- **Level 0 (Base):** 순백/하늘색 배경.
- **Level 1 (Cards):** 1px 보더(`#F1F5F9`) + 낮은 블러 그림자.
- **Level 2 (Active/Hover):** 그림자 확산 범위를 키워 인터랙션을 강조.
- **Level 3 (Navigation/AI Chat):** 20px 블러 + 80% 불투명 흰색 채움의 글래스모픽 효과로 배경 이미지를 비치게 유지.

## Shapes

전반적으로 **Rounded** 형태 언어를 사용해 친근하고 "터치하기 좋은" 느낌을 줍니다.
- **표준 UI(인풋, 버튼):** 0.5rem (8px).
- **카드/슬라이더/모달:** 1rem (16px) ~ 1.5rem (24px)으로 더 부드럽게 처리.
- **버튼:** 필(pill) 형태 또는 강한 라운드.

## Components & Screens

### 1. 홈 (`모여행 - 홈`)
히어로 배너("Discover the Hidden Gems of Scandinavia")가 화면 상단을 차지하고, 그 아래 검색 입력("Where should you go next?")과 추천 CTA가 배치됩니다. **Premium Curated Experiences** 섹션은 미디어 퍼스트 카드(이미지가 카드의 60~70%를 차지)로 여행 패키지를 노출하고, **Traveler's Stories** 섹션에서는 사용자 후기/커뮤니티 카드를 배치합니다.

### 2. 플래너 (`모여행 - 플래너`)
좌측에 지도 기반 **Route Discovery**(POI 탐색 + 검색 + 추천 리스트), 우측 하단에 **Group Itinerary** 보드를 배치한 협업형 일정 관리 화면입니다. Day별 칼럼(Day 1, Day 2, Unscheduled)에 일정 카드를 드래그/투표 형태로 구성하고, 우측 상단에 참여자 아바타와 "Share Board" 버튼을 노출합니다.

### 3. 패키지 여행 (`모여행 - 패키지 여행`)
**Curated Journeys** 타이틀 아래 필터 칩(전체/지역/예산/기간 등)을 두고, 2열 그리드의 미디어 퍼스트 카드(목적지명·가격·하이라이트 태그)로 패키지를 노출합니다. 하단에는 여행자 후기(별점 + 인용구) 섹션을 배치합니다.

### 4. AI 추천 에이전트 (`모여행 - AI 추천 에이전트`)
**모여행 에이전트** 헤더 카드("Active Now" 상태 칩 포함) 아래 채팅 인터페이스를 배치합니다. AI 메시지는 Primary Blue 톤, 사용자 메시지는 연한 채움으로 구분하고, 추천 결과에는 이미지 카드를 인라인으로 삽입합니다. 하단에는 메시지 입력창과 빠른 추천 칩(예: "교토 전통 체험", "한적한 바다 마을")을 배치합니다.

### 5. 마이페이지 (`모여행 - 마이페이지`)
상단에 프로필 헤더(아바타, 이름, 위치, 상태 칩 — "Dream Chaser", "Premium Explorer" 등)와 "Edit Profile" 버튼을 배치합니다. 좌측 사이드 내비게이션(Overview, My Trips, Saved Plans, Settings, Billing, Sign Out)과 우측 콘텐츠 영역으로 구성되며, **My Trips**(여행 카드), **Saved Plans**(예산·기간과 함께 "Resume" 버튼이 있는 리스트), 하단 통계 위젯(완료율, 누적 마일리지, 방문 장소 수)을 포함합니다.

### 공통 컴포넌트
- **버튼:** 필 또는 강한 라운드 형태. Primary는 Sky Blue 채움 + 흰 텍스트, hover 시 1.02배 스케일업.
- **카드:** 미디어 퍼스트 레이아웃(이미지 60~70% + 24px 패딩 텍스트 영역), 좋아요/저장 아이콘은 이미지 모서리에 글래스모픽 오버레이로 배치.
- **검색바:** 보더 대신 부드러운 그림자를 사용한 큼직한 컴포넌트.
- **내비게이션:** 아이콘 + 텍스트 라벨의 미니멀 구성, 모바일에서는 글래스모픽 하단 바.
- **AI 채팅 버블:** AI는 Fresh Green 톤, 사용자는 뉴트럴 그레이 톤이며 등장 시 약간의 바운스 효과("squishy")를 적용.
- **슬라이더:** 풀 와이드/컨테이너 와이드 + "peek" 효과로 다음 카드 일부를 노출해 가로 스와이프를 유도.
