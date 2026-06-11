// 여행방 메인 — 참여 확인, 정보 렌더링, 그룹 투표

// 화면 상태를 보관하는 모듈 스코프 객체
const state = { room: null, meId: null };

// 현재 방문자의 멤버 ID 저장 키를 구성
function meKey(roomId) {
  return `motrip:me:${roomId}`;
}

// 페이지 로드 시 초기화 실행
document.addEventListener("DOMContentLoaded", init);

// 여행방 화면 초기화
async function init() {
  // URL 쿼리에서 여행방 ID와 초대 코드 추출
  const { roomId, code } = Object.fromEntries(new URLSearchParams(location.search));

  // ID가 없으면 사용자의 첫 여행방으로 이동 (localStorage → 서버)
  if (!roomId) {
    const first = findFirstRoom();
    if (first) {
      location.href = `?roomId=${first}`;
      return;
    }
    try {
      const rooms = await getUserRooms();
      if (rooms.length) {
        location.href = `?roomId=${rooms[0].id}`;
        return;
      }
    } catch {}
    // 방이 없으면 생성 페이지로
    location.href = "./room-create.html";
    return;
  }

  // 정적 핸들러를 1회 연결
  bindStaticListeners();

  try {
    // 여행방 정보를 조회해 상태에 보관
    state.room = await getRoom(roomId);
    state.meId = localStorage.getItem(meKey(roomId));

    // 미참여 방문자는 초대 코드 검증 후 참여 폼 노출
    if (!state.meId) {
      if (code && code !== state.room.inviteCode) {
        showError("초대 링크가 올바르지 않습니다.");
        return;
      }
      showJoin();
      return;
    }

    // 멤버인 방을 내 여행 목록에 기록
    rememberRoom(roomId);
    // 참여자는 전체 화면을 렌더링
    renderAll();
  } catch (err) {
    console.error("room init error:", err);
    // 방을 찾을 수 없으면 첫 여행방으로 이동
    showError();
    try {
      const rooms = await getUserRooms();
      if (rooms.length) {
        location.href = `?roomId=${rooms[0].id}`;
      }
    } catch {}
  }
}

// localStorage에서 첫 여행방 ID 조회
function findFirstRoom() {
  const ids = getMyRooms();
  return ids.length ? ids[0] : null;
}

// 정적 폼·버튼 핸들러를 연결
function bindStaticListeners() {
  // 참여 폼 제출 핸들러 연결
  document.querySelector("#join-form").addEventListener("submit", handleJoin);
  // 투표 생성 폼 제출 핸들러 연결
  document
    .querySelector("#vote-form")
    .addEventListener("submit", handleCreateVote);
  // 선택지 추가 버튼 핸들러 연결
  document
    .querySelector("#add-option")
    .addEventListener("click", addOptionInput);
  // 초대 링크 복사 버튼 핸들러 연결
  document
    .querySelector("#copy-invite")
    .addEventListener("click", handleCopyInvite);
  // 여행방 삭제 버튼 핸들러 연결
  document
    .querySelector("#delete-room")
    .addEventListener("click", handleDeleteRoom);
  // 장소 검색 폼 제출 핸들러 연결
  document.querySelector("#poi-form").addEventListener("submit", handleSearch);
}

// 참여 폼 영역만 노출
function showJoin() {
  // 참여 영역만 보이도록 토글
  document.querySelector("#join-section").classList.remove("d-none");
  document.querySelector("#room-main").classList.add("d-none");
  // 방 제목을 참여 화면에 안내
  document.querySelector("#join-room-title").textContent = state.room.title;
}

// 참여 submit 핸들러
async function handleJoin(event) {
  event.preventDefault();

  // 닉네임 입력값 추출
  const { nickname } = Object.fromEntries(new FormData(event.currentTarget));

  // 닉네임 검증
  if (!nickname) {
    showToast(MSG.room.nicknameRequired);
    return;
  }

  try {
    // 참여 API 호출 후 본인 멤버 ID 저장
    const me = await joinRoom(state.room.id, { nickname });
    localStorage.setItem(meKey(state.room.id), me.id);
    state.meId = me.id;
    // 참여한 방을 내 여행 목록에 기록
    rememberRoom(state.room.id);
    // 최신 방 정보를 다시 조회
    state.room = await getRoom(state.room.id);
    showToast(MSG.room.joinSuccess);
    renderAll();
  } catch (err) {
    showToast(MSG.common.networkError);
  }
}

// 참여 완료 후 전체 화면 렌더링
function renderAll() {
  // 메인 영역만 보이도록 토글
  document.querySelector("#join-section").classList.add("d-none");
  document.querySelector("#room-main").classList.remove("d-none");
  // 내 여행 대시보드 렌더링
  renderDashboard();
  renderHeader();
  // 일정 보드 렌더링
  renderBoard();
  renderVotes();
  // 지도를 1회 초기화
  initMapOnce();
}

// 내 여행 대시보드(여러 여행 카드) 렌더링
async function renderDashboard() {
  const wrap = document.querySelector("#dashboard");

  // 내 여행 목록 ID를 조회 (localStorage 우선, 없으면 서버 조회 후 캐싱)
  let ids = getMyRooms();
  if (!ids.length) {
    const userRooms = await getRoomsFromServer();
    ids = userRooms.map(r => r.id);
  }

  // 목록이 없으면 안내 후 종료
  if (!ids.length) {
    wrap.innerHTML =
      '<p class="text-secondary small mb-0">아직 등록된 여행이 없어요.</p>';
    return;
  }

  try {
    // 여러 방의 요약 정보를 한 번에 조회
    const rooms = await getRoomsBrief(ids);
    // 각 방을 카드로 변환(현재 방 강조, 클릭 이동, 주최자만 삭제 버튼)
    wrap.innerHTML = rooms
      .map((r) => {
        const active = r.id === state.room.id;
        const badge = active
          ? ' <span class="badge text-bg-primary">현재</span>'
          : "";
        const period = `${r.start_date || "?"} ~ ${r.end_date || "?"}`;
        // 이 방에서 내 멤버가 주최자인지 확인
        const myMemId = localStorage.getItem(meKey(r.id));
        const isHost = (r.members || []).some(
          (m) => m.id === myMemId && m.is_host,
        );
        const delBtn = isHost
          ? `<button class="btn btn-sm btn-link text-danger p-0 dash-delete" data-room="${r.id}" title="여행방 삭제">
              <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
            </button>`
          : "";
        return `
          <div class="dash-card p-3 rounded-3 border bg-white ${active ? "border-primary" : ""}" data-room="${r.id}" style="min-width:190px; cursor:pointer;">
            <div class="d-flex justify-content-between align-items-start">
              <div class="fw-semibold text-truncate" style="max-width:150px;">${escapeHtml(r.title)}${badge}</div>
              ${delBtn}
            </div>
            <div class="text-secondary small">${escapeHtml(r.destination || "목적지 미정")}</div>
            <div class="text-secondary small">${escapeHtml(period)}</div>
          </div>`;
      })
      .join("");

    // 카드 클릭 → 이동, 삭제 버튼 → 삭제
    wrap
      .querySelectorAll(".dash-card")
      .forEach((c) => c.addEventListener("click", handleDashNavigate));
    wrap
      .querySelectorAll(".dash-delete")
      .forEach((b) => b.addEventListener("click", handleDashDelete));
  } catch (err) {
    // 조회 실패 시 안내
    wrap.innerHTML =
      '<p class="text-secondary small mb-0">여행 목록을 불러오지 못했어요.</p>';
  }
}

// 대시보드 카드 클릭 — 해당 여행방으로 이동
function handleDashNavigate(event) {
  // 카드의 방 ID로 이동
  const { room } = event.currentTarget.dataset;
  location.href = `?roomId=${room}`;
}

// 대시보드 카드의 삭제 버튼 핸들러
async function handleDashDelete(event) {
  // 카드 이동 이벤트 차단
  event.stopPropagation();

  // 되돌릴 수 없는 작업이므로 확인
  if (!confirm(MSG.room.deleteConfirm)) return;

  const { room } = event.currentTarget.dataset;

  try {
    // 여행방 삭제 후 로컬 흔적 제거
    await deleteRoom(room);
    forgetRoom(room);
    localStorage.removeItem(meKey(room));

    // 현재 보던 방을 지웠으면 이동, 아니면 대시보드만 갱신
    if (room === state.room.id) {
      const rest = getMyRooms();
      location.href = rest.length ? `?roomId=${rest[0]}` : "./room-create.html";
    } else {
      renderDashboard();
    }
  } catch (err) {
    showToast(MSG.common.networkError);
  }
}

// 여행방 헤더(제목/일정/멤버/초대) 렌더링
function renderHeader() {
  const { title, destination, startDate, endDate, members, id, inviteCode } =
    state.room;

  // 텍스트 정보 채우기
  document.querySelector("#room-title").textContent = title;
  document.querySelector("#room-meta").textContent =
    `${destination || "목적지 미정"} · ${startDate || "?"} ~ ${endDate || "?"}`;

  // 멤버 아바타와 인원 수 렌더링
  document.querySelector("#member-list").innerHTML = members
    .map((m) => avatarHtml(m.nickname))
    .join("");
  document.querySelector("#member-count").textContent = members.length;

  // 초대 링크 구성 후 입력 칸에 표시
  document.querySelector("#invite-link").value = buildInviteLink(
    id,
    inviteCode,
  );

  // 주최자(host)에게만 여행방 삭제 버튼 노출
  const isHost = members.some((m) => m.id === state.meId && m.isHost);
  document.querySelector("#delete-room").classList.toggle("d-none", !isHost);
}

// 초대 링크 문자열 생성
function buildInviteLink(roomId, code) {
  return `${location.origin}${location.pathname}?roomId=${roomId}&code=${code}`;
}

// 초대 링크 복사 버튼 핸들러
function handleCopyInvite() {
  // 입력 칸의 링크를 클립보드로 복사
  const link = document.querySelector("#invite-link").value;
  copyToClipboard(link, MSG.common.copySuccess, MSG.common.copyFail);
}

// 여행방 삭제 버튼 핸들러
async function handleDeleteRoom() {
  // 되돌릴 수 없는 작업이므로 확인
  if (!confirm(MSG.room.deleteConfirm)) return;

  const roomId = state.room.id;

  try {
    // 여행방 삭제(연관 데이터 cascade) 후 로컬 흔적 제거
    await deleteRoom(roomId);
    forgetRoom(roomId);
    localStorage.removeItem(meKey(roomId));

    // 남은 여행이 있으면 그 방으로, 없으면 생성 페이지로 이동
    const rest = getMyRooms();
    location.href = rest.length ? `?roomId=${rest[0]}` : "./room-create.html";
  } catch (err) {
    showToast(MSG.common.networkError);
  }
}

// 투표 생성 submit 핸들러
async function handleCreateVote(event) {
  event.preventDefault();

  const form = event.currentTarget;

  // 투표 주제 추출
  const title = form.querySelector('[name="voteTitle"]').value.trim();

  // 선택지 입력값을 배열로 수집(빈 칸 제외)
  const options = [...form.querySelectorAll('[name="option"]')]
    .map((el) => el.value.trim())
    .filter(Boolean);

  // 주제 검증
  if (!title) {
    showToast(MSG.vote.titleRequired);
    return;
  }

  // 선택지 2개 이상 검증
  if (options.length < 2) {
    showToast(MSG.vote.optionRequired);
    return;
  }

  try {
    // 투표 생성 API 호출 후 화면 갱신
    await createVote(state.room.id, { title, options, createdBy: state.meId });
    state.room = await getRoom(state.room.id);
    form.reset();
    resetOptionInputs();
    showToast(MSG.vote.created);
    renderVotes();
  } catch (err) {
    showToast(MSG.common.networkError);
  }
}

// 선택지 입력 칸을 동적으로 추가
function addOptionInput() {
  const wrap = document.querySelector("#option-inputs");
  // 입력 칸 마크업을 생성해 추가
  const div = document.createElement("div");
  div.className = "mb-2";
  div.innerHTML = `<input class="form-control" name="option" placeholder="선택지 입력">`;
  wrap.appendChild(div);
}

// 선택지 입력을 기본 2칸으로 초기화
function resetOptionInputs() {
  document.querySelector("#option-inputs").innerHTML = `
    <div class="mb-2"><input class="form-control" name="option" placeholder="선택지 입력"></div>
    <div class="mb-2"><input class="form-control" name="option" placeholder="선택지 입력"></div>`;
}

// 투표 목록과 결과 막대 그래프 렌더링
function renderVotes() {
  const list = document.querySelector("#vote-list");
  const { votes } = state.room;

  // 투표가 없으면 안내 문구 표시
  if (!votes.length) {
    list.innerHTML = `<p class="text-secondary">아직 등록된 투표가 없어요.</p>`;
    return;
  }

  // 각 투표를 카드 마크업으로 변환
  list.innerHTML = votes.map(renderVoteCard).join("");

  // 선택지 버튼에 투표 핸들러 연결(data-option 보유)
  list.querySelectorAll("[data-option]").forEach((btn) => {
    btn.addEventListener("click", handleCastVote);
  });

  // 투표 삭제 버튼 핸들러 연결
  list.querySelectorAll(".vote-delete").forEach((btn) => {
    btn.addEventListener("click", handleDeleteVote);
  });
}

// 단일 투표 카드 마크업 생성
function renderVoteCard(vote) {
  const { id, title, options, createdBy } = vote;

  // 전체 득표 수 합산
  const total = options.reduce((sum, o) => sum + o.voterIds.length, 0);

  // 본인이 이미 투표했는지 확인
  const voted = options.some((o) => o.voterIds.includes(state.meId));

  // 작성자 본인에게만 삭제 버튼 노출
  const delBtn =
    createdBy === state.meId
      ? `<button class="btn btn-sm btn-link text-secondary p-0 vote-delete" data-vote="${id}" title="투표 삭제">
        <span class="material-symbols-outlined" style="font-size:1.1rem;">delete</span>
      </button>`
      : "";

  // 선택지별 막대 그래프 행 생성
  const rows = options
    .map((o) => renderOptionRow(id, o, total, voted))
    .join("");

  return `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <h3 class="h5 mb-0">${escapeHtml(title)}</h3>
          ${delBtn}
        </div>
        ${rows}
        <p class="text-secondary small mb-0 mt-2">총 ${total}표</p>
      </div>
    </div>`;
}

// 선택지 한 줄(버튼 + 막대) 마크업 생성
function renderOptionRow(voteId, option, total, voted) {
  const { id, label, voterIds } = option;
  const count = voterIds.length;

  // 득표 비율 계산(0 나눗셈 방지)
  const pct = total ? Math.round((count / total) * 100) : 0;

  // 투표 전에는 선택 버튼, 후에는 막대만 표시
  const action = voted
    ? ""
    : `<button class="btn btn-sm btn-outline-primary btn-pill px-3 me-2" data-vote="${voteId}" data-option="${id}">선택</button>`;

  return `
    <div class="vote-row mb-3">
      <div class="d-flex align-items-center mb-1">
        ${action}
        <span class="fw-semibold">${escapeHtml(label)}</span>
        <span class="vote-chip ms-auto">
          <span class="material-symbols-outlined" style="font-size:1rem;">thumb_up</span>${count} · ${pct}%
        </span>
      </div>
      <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar" style="width:${pct}%"></div>
      </div>
    </div>`;
}

// 선택지 투표 버튼 핸들러
async function handleCastVote(event) {
  // 버튼 데이터 속성에서 식별자 추출
  const { vote: voteId, option: optionId } = event.currentTarget.dataset;

  try {
    // 투표 제출 API 호출 후 화면 갱신
    await castVote(state.room.id, voteId, { optionId, memberId: state.meId });
    state.room = await getRoom(state.room.id);
    showToast(MSG.vote.submitted);
    renderVotes();
  } catch (err) {
    // 중복 투표는 별도 안내, 그 외 공통 오류
    if (err.message === "ALREADY_VOTED") {
      showToast(MSG.vote.alreadyVoted);
    } else {
      showToast(MSG.common.networkError);
    }
  }
}

// 투표 삭제 버튼 핸들러
async function handleDeleteVote(event) {
  // 삭제할 투표 ID 추출
  const { vote: voteId } = event.currentTarget.dataset;

  // 사용자에게 삭제 확인
  if (!confirm(MSG.vote.deleteConfirm)) return;

  try {
    // 투표 삭제 API 호출 후 화면 갱신
    await deleteVote(state.room.id, voteId);
    state.room = await getRoom(state.room.id);
    showToast(MSG.vote.deleted);
    renderVotes();
  } catch (err) {
    showToast(MSG.common.networkError);
  }
}

// === 지도 · 장소 검색 · 일정 보드 ===

// 지도 1회 초기화 여부 플래그
let mapInitialized = false;

// 지도를 1회만 로드하고 준비되면 마커 갱신
function initMapOnce() {
  // 이미 초기화됐으면 중복 실행 방지
  if (mapInitialized) return;
  mapInitialized = true;
  // 지도 로드 후 일정 마커 표시
  loadKakaoMap("#map", () => refreshMarkers());
}

// 여행 날짜로 Day 컬럼 목록을 생성(+미정)
function getDays(room) {
  const { startDate, endDate } = room;
  const days = [];

  // 출발~도착 날짜가 모두 있으면 일자별 컬럼 생성
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let i = 0;
    // 하루씩 증가시키며 최대 14일까지 생성
    for (
      let d = new Date(start);
      d <= end && i < 14;
      d.setDate(d.getDate() + 1)
    ) {
      days.push({
        key: `d${i}`,
        label: `Day ${i + 1}`,
        date: `${d.getMonth() + 1}/${d.getDate()}`,
      });
      i += 1;
    }
  }

  // 날짜가 없으면 기본 2일 컬럼 제공
  if (!days.length) {
    days.push({ key: "d0", label: "Day 1", date: "" });
    days.push({ key: "d1", label: "Day 2", date: "" });
  }

  // 미정 컬럼 추가
  days.push({ key: "unscheduled", label: "미정", date: "" });
  return days;
}

// Day 선택 드롭다운 옵션 마크업 생성
function dayOptionsHtml() {
  // 각 Day를 option으로 변환
  return getDays(state.room)
    .map(
      (d) =>
        `<option value="${d.key}">${escapeHtml(d.label)}${d.date ? ` (${escapeHtml(d.date)})` : ""}</option>`,
    )
    .join("");
}

// 장소 검색 submit 핸들러
function handleSearch(event) {
  event.preventDefault();

  // 검색어 추출
  const keyword = document.querySelector("#poi-input").value.trim();

  // 빈 검색어는 안내 후 종료
  if (!keyword) {
    showToast(MSG.map.searchEmpty);
    return;
  }

  // 장소 검색 실행 후 결과 렌더링
  searchPlaces(keyword, renderPoiResults);
}

// 검색 결과를 추가 버튼·Day 선택과 함께 렌더링
function renderPoiResults(places) {
  // 결과가 없으면 안내 후 종료
  if (!places.length) {
    showToast(MSG.map.noResult);
    return;
  }

  const list = document.querySelector("#poi-list");
  const dayOpts = dayOptionsHtml();

  // 각 장소를 카드(이름·주소·Day선택·추가)로 변환(XSS 방지 이스케이프)
  list.innerHTML = places
    .map(
      (p) => `
      <div class="p-3 bg-white rounded-3 shadow-sm mb-2 poi-card"
           data-x="${escapeHtml(p.x)}" data-y="${escapeHtml(p.y)}"
           data-name="${escapeHtml(p.place_name)}"
           data-address="${escapeHtml(p.road_address_name || p.address_name)}">
        <div class="fw-semibold poi-locate" role="button">${escapeHtml(p.place_name)}</div>
        <div class="text-secondary small mb-2">${escapeHtml(p.road_address_name || p.address_name)}</div>
        <div class="d-flex gap-2">
          <select class="form-select form-select-sm poi-day">${dayOpts}</select>
          <button class="btn btn-sm btn-primary btn-pill px-3 poi-add" type="button">일정에 추가</button>
        </div>
      </div>`,
    )
    .join("");

  // 추가·위치보기 핸들러 연결
  list
    .querySelectorAll(".poi-add")
    .forEach((b) => b.addEventListener("click", handleAddPlace));
  list
    .querySelectorAll(".poi-locate")
    .forEach((b) => b.addEventListener("click", handleLocatePoi));
}

// 검색 결과 장소를 일정 추가 폼에 채우기
async function handleAddPlace(event) {
  const card = event.currentTarget.closest(".poi-card");
  const { name, address, x, y } = card.dataset;
  const day = card.querySelector(".poi-day").value;

  const placeEl = document.querySelector("#sch-add-place");
  if (!placeEl) return;
  placeEl.value = address ? `${name} (${address})` : name;
  document.querySelector("#sch-add-x").value = x;
  document.querySelector("#sch-add-y").value = y;
  document.querySelector("#sch-add-date").value = day && day !== "unscheduled" ? day : "";
  document.querySelector("#add-schedule-form").scrollIntoView({ behavior: "smooth", block: "center" });
  showToast(MSG.map.addedToForm);
}

// 검색 결과 클릭 시 지도 중심 이동
function handleLocatePoi(event) {
  // 카드 좌표로 지도 이동
  const { x, y } = event.currentTarget.closest(".poi-card").dataset;
  panTo(x, y);
}

// Day별 일정 보드 렌더링
function renderBoard() {
  const board = document.querySelector("#itinerary-board");
  if (!board) return;
  const days = getDays(state.room);
  const items = state.room.itinerary || [];

  // 각 Day를 컬럼으로 변환
  board.innerHTML = days
    .map((d) => {
      // 해당 Day의 항목만 추려 카드로 변환
      const dayItems = items.filter((it) => it.day === d.key);
      const cards =
        dayItems.map(renderItineraryCard).join("") ||
        `<p class="text-secondary small mb-0">${MSG.itinerary.empty}</p>`;
      // 미정 컬럼은 색상 구분
      const extra = d.key === "unscheduled" ? " unscheduled" : "";
      return `
        <div class="col-md">
          <div class="board-col${extra} rounded-4xl p-3 h-100">
            <div class="fw-bold text-primary mb-3">
              ${escapeHtml(d.label)} <span class="text-secondary small fw-normal">${escapeHtml(d.date)}</span>
            </div>
            ${cards}
          </div>
        </div>`;
    })
    .join("");

  // 삭제·위치보기 핸들러 연결
  board
    .querySelectorAll(".item-remove")
    .forEach((b) => b.addEventListener("click", handleRemovePlace));
  board
    .querySelectorAll(".item-locate")
    .forEach((b) => b.addEventListener("click", handleLocateItem));
}

// 일정 항목 카드 마크업 생성
function renderItineraryCard(item) {
  const { id, placeName, address, x, y } = item;
  return `
    <div class="bg-white p-3 rounded-3 shadow-sm mb-2 item-card" data-x="${escapeHtml(x)}" data-y="${escapeHtml(y)}">
      <div class="d-flex justify-content-between align-items-start">
        <div class="fw-semibold">${escapeHtml(placeName)}</div>
        <button class="btn btn-sm btn-link text-secondary p-0 item-remove" data-id="${escapeHtml(id)}" title="삭제">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">close</span>
        </button>
      </div>
      <div class="text-secondary small mb-2">${escapeHtml(address)}</div>
      <button class="btn btn-sm btn-outline-primary btn-pill px-3 item-locate" type="button">
        <span class="material-symbols-outlined" style="font-size:1rem;">location_on</span> 지도에서 보기
      </button>
    </div>`;
}

// 일정 항목 삭제
async function handleRemovePlace(event) {
  // 삭제 대상 ID 추출
  const { id } = event.currentTarget.dataset;

  try {
    // 일정 제거 API 호출 후 화면·마커 갱신
    await removeItineraryItem(state.room.id, id);
    state.room = await getRoom(state.room.id);
    showToast(MSG.itinerary.removed);
    renderBoard();
    refreshMarkers();
  } catch (err) {
    showToast(MSG.common.networkError);
  }
}

// 일정 항목 클릭 시 지도 중심 이동
function handleLocateItem(event) {
  // 항목 좌표로 지도 이동
  const { x, y } = event.currentTarget.closest(".item-card").dataset;
  panTo(x, y);
}

// 일정에 담긴 장소를 지도 마커로 갱신
function refreshMarkers() {
  // 지도가 준비된 경우에만 마커 표시
  if (!mapState.ready) return;
  showMarkers(state.room.itinerary || []);
}

// 여행방을 찾지 못했을 때 오류 화면 표시
function showError() {
  document.querySelector("#join-section").classList.add("d-none");
  document.querySelector("#room-main").classList.add("d-none");
  document.querySelector("#error-section").classList.remove("d-none");
}
