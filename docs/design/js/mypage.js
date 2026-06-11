/**
 * mypage.js — 마이페이지 (프로필 + 내 여행 목록)
 * 의존: msg.js, ui.js, api.js, supabase-client.js
 */

/* ══════════════════════════════════════════
   초기화
   ══════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getCurrentUser();
  if (!user) {
    showToast("로그인이 필요합니다.");
    location.href = "./index.html";
    return;
  }
  renderProfile(user);
  renderMyRooms();
  bindProfileForm(user);
});

/* ══════════════════════════════════════════
   현재 사용자 조회
   ══════════════════════════════════════════ */

async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

/* ══════════════════════════════════════════
   프로필 렌더링
   ══════════════════════════════════════════ */

function renderProfile(user) {
  const nickname = user.user_metadata?.nickname || user.email?.split("@")[0] || "사용자";
  document.querySelector("#profile-name").textContent = nickname;
  document.querySelector("#profile-email").textContent = user.email;
  document.querySelector("#profile-avatar").textContent = nickname.charAt(0).toUpperCase();
}

/* ══════════════════════════════════════════
   내 여행 목록 렌더링
   ══════════════════════════════════════════ */

async function renderMyRooms() {
  const wrap = document.querySelector("#my-rooms");
  try {
    const rooms = await getRoomsFromServer();
    if (!rooms.length) {
      wrap.innerHTML = `<div class="col-12 text-center text-secondary py-5">
        <p class="mb-2">아직 참여한 여행방이 없어요.</p>
        <a class="btn btn-primary rounded-pill" href="./room-create.html">여행방 만들기</a>
      </div>`;
      return;
    }
    wrap.innerHTML = rooms.map(r => {
      const period = `${r.start_date || "?"} ~ ${r.end_date || "?"}`;
      return `<div class="col-md-6 col-lg-4">
        <a href="./room.html?roomId=${r.id}" class="text-decoration-none">
          <div class="card border-0 shadow-sm rounded-4 h-100" style="cursor:pointer;">
            <div class="card-body p-4">
              <h6 class="fw-bold text-dark mb-1">${escapeHtml(r.title)}</h6>
              <p class="text-secondary small mb-0">${escapeHtml(r.destination || "목적지 미정")}</p>
              <p class="text-secondary small mb-0">${escapeHtml(period)}</p>
            </div>
          </div>
        </a>
      </div>`;
    }).join("");
  } catch {
    wrap.innerHTML = `<div class="col-12 text-center text-secondary py-5">여행방 목록을 불러오지 못했습니다.</div>`;
  }
}

/* ══════════════════════════════════════════
   프로필 편집 폼 바인딩
   ══════════════════════════════════════════ */

function bindProfileForm(user) {
  const nickname = user.user_metadata?.nickname || user.email?.split("@")[0] || "";
  document.querySelector("#edit-nickname").value = nickname;
  document.querySelector("#edit-email").value = user.email || "";

  document.querySelector("#profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.querySelector("#profile-save-btn");
    btn.disabled = true;
    btn.textContent = "저장 중...";

    const newNickname = document.querySelector("#edit-nickname").value.trim();
    if (!newNickname) {
      showToast("닉네임을 입력해 주세요.");
      btn.disabled = false;
      btn.textContent = "저장";
      return;
    }

    try {
      const { error } = await supabaseClient.auth.updateUser({
        data: { nickname: newNickname },
      });
      if (error) throw error;
      document.querySelector("#profile-name").textContent = newNickname;
      document.querySelector("#profile-avatar").textContent = newNickname.charAt(0).toUpperCase();
      showToast("프로필이 저장되었습니다.");
      bootstrap.Modal.getInstance(document.querySelector("#editProfileModal")).hide();
    } catch (err) {
      showToast("저장에 실패했습니다: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "저장";
    }
  });
}
