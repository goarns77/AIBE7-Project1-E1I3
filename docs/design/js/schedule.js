/**
 * schedule.js — 여행 일정 CRUD 및 좋아요 기능 전담 모듈
 * Supabase 'schedules' 테이블과 'schedule_likes' 테이블을 사용한다.
 *
 * [테이블 스키마 가이드]
 * schedules 테이블:
 *   - id          : uuid (PK, default gen_random_uuid())
 *   - trip_date   : date          — 일정 일자
 *   - trip_time   : time          — 일정 시간
 *   - content     : text          — 일정 내용
 *   - user_id     : uuid (FK → auth.users.id)
 *   - created_at  : timestamptz   — 생성일시
 *
 * schedule_likes 테이블:
 *   - id          : uuid (PK)
 *   - schedule_id : uuid (FK → schedules.id)
 *   - user_id     : uuid (FK → auth.users.id)
 *   - UNIQUE(schedule_id, user_id) — 중복 좋아요 방지
 */

/* ══════════════════════════════════════════
   DOM 요소 조회 (schedule.html 기준)
══════════════════════════════════════════ */

/** 일정 목록을 렌더링할 컨테이너 */
const scheduleList = document.querySelector("#schedule-list");

/** 일정 추가 폼 */
const addForm = document.querySelector("#add-schedule-form");

/** 현재 방 ID (URL에서 추출) */
let roomId = new URLSearchParams(location.search).get("roomId");


/** 일정 수정 폼 */
const editForm = document.querySelector("#edit-schedule-form");

/** 수정 폼 래퍼(모달 역할) — 수정 버튼 클릭 시 표시 */
const editFormWrapper = document.querySelector("#edit-form-wrapper");

/** 수정 취소 버튼 */
const editCancelBtn = document.querySelector("#edit-cancel-btn");

/** 현재 로그인 유저 정보를 표시하는 영역 */
const userStatusEl = document.querySelector("#user-status");

/** 로그아웃 버튼 */
const logoutBtn = document.querySelector("#logout-btn");

/** 마지막으로 불러온 일정 목록 (지도 마커 동기화용) */
let lastSchedules = [];

/**
 * 좌표가 있는 일정을 지도에 마커로 표시한다.
 * map.js가 로드된 room 통합 화면에서만 동작(standalone에선 안전하게 건너뜀).
 * @param {Array} list - 일정 배열
 */
function renderScheduleMarkers(list) {
  // map.js 미로드거나 지도 미준비면 건너뜀(typeof는 미선언에도 안전)
  if (typeof showMarkers !== "function" || typeof mapState === "undefined" || !mapState.ready) return;
  // 좌표가 있는 일정만 마커 데이터로 변환
  const located = (list || [])
    .filter((s) => s.place_x && s.place_y)
    .map((s) => ({ x: s.place_x, y: s.place_y, place_name: s.place_name }));
  showMarkers(located);
}

/* ══════════════════════════════════════════
   인증 상태 감지 및 UI 초기화
══════════════════════════════════════════ */

/**
 * 인증 상태 변경 시 자동 호출
 * 로그인 여부에 따라 UI 상태와 일정 목록을 갱신한다.
 */
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  // SDK가 SIGNED_OUT을 잘못 발생시켜도 sb-session이 유효하면 무시
  if (event === 'SIGNED_OUT') {
    try {
      const raw = localStorage.getItem('sb-session');
      if (raw && JSON.parse(raw)?.user?.id) return;
    } catch {}
  }
  // 세션이 있으면 유저 이메일 표시, 없으면 비로그인 안내
  if (session) {
    userStatusEl.textContent = `${session.user.email} 로 로그인됨`;
    logoutBtn.classList.remove("d-none");
  } else {
    userStatusEl.textContent = "로그인되지 않은 상태입니다.";
    logoutBtn.classList.add("d-none");
  }
  // 인증 상태가 바뀔 때마다 일정 목록 새로고침
  await renderSchedules();
});

/* ══════════════════════════════════════════
   로그아웃 핸들러
══════════════════════════════════════════ */

logoutBtn.addEventListener("click", logoutHandler);

/** 로그아웃 처리 후 알림 표시 */
async function logoutHandler() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) return showToast(error.message, "danger");
  showToast(MSG.auth.logoutSuccess, "success");
}

/* ══════════════════════════════════════════
   일정 목록 렌더링 (Read)
══════════════════════════════════════════ */

async function renderSchedules() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const r_id = roomId || "global";
  const { data: schedules, error } = await supabaseClient
    .from("schedules")
    .select("*")
    .eq("room_id", r_id)
    .order("trip_date", { ascending: true })
    .order("trip_time", { ascending: true });

  lastSchedules = schedules || [];
  renderScheduleMarkers(lastSchedules);

  scheduleList.innerHTML = "";
  if (error || !lastSchedules.length) {
    scheduleList.innerHTML = `<p class="text-center text-muted py-4">${MSG.schedule.noData}</p>`;
    return;
  }

  for (const schedule of lastSchedules) {
    const card = await buildScheduleCard(schedule, user);
    scheduleList.appendChild(card);
  }
}

/**
 * 일정 하나에 해당하는 카드 DOM 요소를 생성해 반환한다.
 * @param {Object} schedule - Supabase에서 받아온 일정 데이터 객체
 * @param {Object|null} user - 현재 로그인 유저 (없으면 null)
 * @returns {HTMLElement} 생성된 카드 요소
 */
async function buildScheduleCard(schedule, user) {
  // 이 일정에 대한 좋아요 총 수 조회
  const { count: likeCount } = await supabaseClient
    .from("schedule_likes")
    .select("id", { count: "exact", head: true })
    .eq("schedule_id", schedule.id);

  // 현재 유저가 이미 좋아요 눌렀는지 확인 (비로그인이면 항상 false)
  let isLiked = false;
  if (user) {
    const { data: likeRow } = await supabaseClient
      .from("schedule_likes")
      .select("id")
      .eq("schedule_id", schedule.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isLiked = !!likeRow;
  }

  // 카드 컨테이너 생성
  const card = document.createElement("div");
  card.className = "card mb-3 shadow-sm schedule-card";
  card.dataset.id = schedule.id;

  // 날짜·시간 포맷 (YYYY-MM-DD / HH:MM)
  const dateStr = schedule.trip_date ?? "-";
  const timeStr = schedule.trip_time ? schedule.trip_time.slice(0, 5) : "-";

  card.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <!-- 일정 일자·시간 뱃지 -->
          <span class="badge bg-primary me-1 schedule-date">${dateStr}</span>
          <span class="badge bg-secondary schedule-time">${timeStr}</span>
        </div>
        <!-- 좋아요 버튼: 로그인 시 토글 가능 -->
        <button
          class="btn btn-sm like-btn ${isLiked ? "btn-danger" : "btn-outline-danger"}"
          data-id="${schedule.id}"
          data-liked="${isLiked}"
          ${!user ? "disabled title=\"로그인 후 이용 가능\"" : ""}
          aria-label="좋아요 버튼"
        >
          ♥ <span class="like-count">${likeCount ?? 0}</span>
        </button>
      </div>
      <!-- 위치(지도에서 추가한 장소) -->
      ${schedule.place_name ? `<p class="card-text small mt-2 mb-0 schedule-place text-primary">📍 ${escapeHtml(schedule.place_name)}</p>` : ""}
      <!-- 일정 내용 -->
      <p class="card-text mt-2 mb-1 schedule-content">${escapeHtml(schedule.content)}</p>
      <!-- 본인 일정에만 수정·삭제 버튼 표시 -->
      ${user && user.id === schedule.user_id ? `
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${schedule.id}">수정</button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${schedule.id}">삭제</button>
        </div>
      ` : ""}
    </div>
  `;

  // 좋아요 버튼 이벤트 연결
  const likeBtn = card.querySelector(".like-btn");
  if (likeBtn && !likeBtn.disabled) {
    likeBtn.addEventListener("click", () => likeHandler(schedule.id, isLiked, likeBtn));
  }

  // 수정 버튼 이벤트 연결 (본인 일정만 존재)
  const editBtn = card.querySelector(".edit-btn");
  if (editBtn) editBtn.addEventListener("click", () => openEditForm(schedule));

  // 삭제 버튼 이벤트 연결 (본인 일정만 존재)
  const deleteBtn = card.querySelector(".delete-btn");
  if (deleteBtn) deleteBtn.addEventListener("click", () => deleteHandler(schedule.id));

  return card;
}

/* ══════════════════════════════════════════
   일정 추가 핸들러 (Create)
══════════════════════════════════════════ */

addForm.addEventListener("submit", addHandler);

/**
 * 일정 추가 폼 제출 시 Supabase에 새 일정을 삽입한다.
 * 로그인 여부를 진입·저장 두 단계에서 모두 확인한다.
 * @param {SubmitEvent} event
 */
async function addHandler(event) {
  event.preventDefault();

  // 로그인 상태 확인
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return showToast(MSG.auth.notLoggedIn, "warning");

  // 폼 데이터 추출 (구조 분해 할당 활용)
  const formData = new FormData(event.target);
  const trip_date = formData.get("trip_date");
  const trip_time = formData.get("trip_time");
  const content   = formData.get("content");
  // 위치(지도에서 추가한 장소) — 선택 항목
  const place_name = formData.get("place_name")?.trim() || null;
  const place_x    = formData.get("place_x") || null;
  const place_y    = formData.get("place_y") || null;

  // 필수 입력값 검증
  if (!trip_date || !trip_time || !content.trim()) {
    return showToast(MSG.schedule.inputRequired, "warning");
  }

  const r_id = roomId || "global";
  // Supabase에 일정 삽입(위치 및 방 ID 포함)
  const { data, error } = await supabaseClient
    .from("schedules")
    .insert({ room_id: r_id, trip_date, trip_time, content: content.trim(), user_id: user.id, place_name, place_x, place_y })
    .select()
    .single();

  if (error) return showToast(MSG.schedule.addFail, "danger");

  showToast(MSG.schedule.addSuccess, "success");
  event.target.reset(); // 폼 초기화
  await renderSchedules(); // 목록 갱신
}

/* ══════════════════════════════════════════
   일정 수정 핸들러 (Update)
══════════════════════════════════════════ */

/**
 * 수정 버튼 클릭 시 수정 폼에 기존 값을 채우고 표시한다.
 * @param {Object} schedule - 수정 대상 일정 데이터
 */
function openEditForm(schedule) {
  // 수정 폼 필드에 기존 값 주입
  editForm.querySelector("[name='edit-id']").value     = schedule.id;
  editForm.querySelector("[name='edit-date']").value   = schedule.trip_date;
  editForm.querySelector("[name='edit-time']").value   = schedule.trip_time?.slice(0, 5) ?? "";
  editForm.querySelector("[name='edit-content']").value = schedule.content;

  // 수정 폼 래퍼 표시
  editFormWrapper.classList.remove("d-none");
  editFormWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** 수정 취소 버튼 — 폼을 숨기고 초기화 */
editCancelBtn.addEventListener("click", closeEditForm);

/** 수정 폼을 닫고 필드를 초기화하는 헬퍼 */
function closeEditForm() {
  editFormWrapper.classList.add("d-none");
  editForm.reset();
}

editForm.addEventListener("submit", editHandler);

/**
 * 수정 폼 제출 시 Supabase에서 해당 일정을 업데이트한다.
 * @param {SubmitEvent} event
 */
async function editHandler(event) {
  event.preventDefault();

  // 로그인 상태 재확인 (저장 단계에서도 검증)
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return showToast(MSG.auth.notLoggedIn, "warning");

  // 수정 폼 데이터 추출
  const formData   = new FormData(event.target);
  const id         = formData.get("edit-id");
  const trip_date  = formData.get("edit-date");
  const trip_time  = formData.get("edit-time");
  const content    = formData.get("edit-content");

  // 필수 입력값 검증
  if (!trip_date || !trip_time || !content.trim()) {
    return showToast(MSG.schedule.inputRequired, "warning");
  }

  const r_id = roomId || "global";
  // Supabase 업데이트 (본인 일정만 수정되도록 user_id 조건 추가 — RLS와 이중 방어)
  const { error } = await supabaseClient
    .from("schedules")
    .update({ trip_date, trip_time, content: content.trim() })
    .eq("id", id)
    .eq("room_id", r_id)
    .eq("user_id", user.id);

  if (error) return showToast(MSG.schedule.editFail, "danger");

  showToast(MSG.schedule.editSuccess, "success");
  closeEditForm();
  await renderSchedules(); // 목록 갱신
}

/* ══════════════════════════════════════════
   일정 삭제 핸들러 (Delete)
══════════════════════════════════════════ */

/**
 * 삭제 확인 후 Supabase에서 해당 일정을 삭제한다.
 * RLS 정책과 함께 프론트에서도 user_id 조건을 추가해 이중 방어한다.
 * @param {string} scheduleId - 삭제할 일정의 UUID
 */
async function deleteHandler(scheduleId) {
  // 삭제 전 사용자 확인 팝업
  if (!confirm(MSG.schedule.deleteConfirm)) return;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return showToast(MSG.auth.notLoggedIn, "warning");

  const r_id = roomId || "global";
  // 본인 일정만 삭제 가능하도록 user_id 조건 포함
  const { error } = await supabaseClient
    .from("schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("room_id", r_id)
    .eq("user_id", user.id);

  if (error) return showToast(MSG.schedule.deleteFail, "danger");

  showToast(MSG.schedule.deleteSuccess, "success");
  await renderSchedules();
}

/* ══════════════════════════════════════════
   좋아요 토글 핸들러 (Like / Unlike)
══════════════════════════════════════════ */

/**
 * 좋아요 버튼 클릭 시 insert 또는 delete로 상태를 토글한다.
 * UNIQUE(schedule_id, user_id) 제약으로 중복 좋아요가 방지된다.
 * @param {string} scheduleId - 대상 일정 UUID
 * @param {boolean} isLiked   - 현재 좋아요 여부
 * @param {HTMLElement} btn   - 클릭된 버튼 요소 (즉각 UI 반영용)
 */
async function likeHandler(scheduleId, isLiked, btn) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return showToast(MSG.auth.notLoggedIn, "warning");

  if (isLiked) {
    // 이미 좋아요 상태 → 취소 (행 삭제)
    const { error } = await supabaseClient
      .from("schedule_likes")
      .delete()
      .eq("schedule_id", scheduleId)
      .eq("user_id", user.id);
    if (error) return showToast(MSG.like.fail, "danger");
  } else {
    // 좋아요 아님 → 추가 (행 삽입)
    const { error } = await supabaseClient
      .from("schedule_likes")
      .insert({ schedule_id: scheduleId, user_id: user.id });
    if (error) return showToast(MSG.like.fail, "danger");
  }

  // 목록 전체 재렌더링으로 좋아요 수 동기화
  await renderSchedules();
}

/* ══════════════════════════════════════════
   유틸리티 함수
══════════════════════════════════════════ */

/**
 * Bootstrap 토스트 메시지를 동적으로 생성해 우하단에 표시한다.
 * @param {string} message   - 표시할 메시지 문자열
 * @param {string} type      - Bootstrap 색상 (success|danger|warning|info)
 */
function showToast(message, type = "info") {
  // 토스트 컨테이너가 없으면 생성
  let container = document.querySelector("#toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = 1100;
    document.body.appendChild(container);
  }

  // 토스트 요소 생성
  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  container.appendChild(toastEl);

  // Bootstrap Toast 초기화 및 표시 (3초 후 자동 소멸)
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();

  // 숨겨진 뒤 DOM에서 제거
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

/**
 * XSS 방지를 위해 HTML 특수문자를 이스케이프한다.
 * @param {string} str - 이스케이프할 원본 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
