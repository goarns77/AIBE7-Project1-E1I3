/* ==========================================================================
   [Motrip 마이페이지] 최종 통합 버전 (외부 supabase-client.js 연동)
   ========================================================================== */

// (주의) supabase 초기화 코드는 외부 파일(supabase-client.js)에 있으므로 생략합니다.

// ==========================================
// 1. 공통 헬퍼: 현재 로그인 유저 가져오기
// ==========================================
async function getCurrentUser() {
  // window.supabase가 있는지 먼저 확인 (외부 파일에서 선언한 경우 보통 window에 붙음)
  const client = window.supabase;

  if (!client || !client.auth) {
    console.error("Supabase 클라이언트가 아직 로드되지 않았습니다!");
    return null;
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) console.warn("현재 로그인된 사용자가 없습니다.");
  return user;
}

// ==========================================
// 2. 전역 상태 변수 (지도, 플래너 등)
// ==========================================
let kakaoMap = null;
let mapMarkers = [];
let savedTrips = [];
let selectedPlace = { name: "선택된 장소", lat: 37.5665, lng: 126.978 };
let isProcessing = false;

// ==========================================
// 3. [저장된 계획 관리] (Supabase 연동)
// ==========================================
const savedPlanManager = {
  plans: [],
  openModal(id = null) {
    const modal = document.getElementById("new-plan-modal");
    if (id) {
      const plan = this.plans.find((p) => p.id === id);
      if (plan) {
        document.getElementById("modal-trip-title").value = plan.title;
        document.getElementById("modal-trip-budget").value = plan.budget;
        document.getElementById("modal-trip-duration").value = plan.duration;
        modal.dataset.editId = id;
      }
    } else {
      document.getElementById("modal-trip-title").value = "";
      document.getElementById("modal-trip-budget").value = "";
      document.getElementById("modal-trip-duration").value = "";
      delete modal.dataset.editId;
    }
    modal.classList.remove("hidden");
  },
  async add() {
    const user = await getCurrentUser();
    if (!user) return alert("로그인이 필요합니다.");
    const modal = document.getElementById("new-plan-modal");
    const title = document.getElementById("modal-trip-title").value.trim();
    const budget = document.getElementById("modal-trip-budget").value.trim();
    const duration = document
      .getElementById("modal-trip-duration")
      .value.trim();
    const editId = modal.dataset.editId;

    if (!title) return alert("제목을 입력해주세요.");

    const planData = { title, budget, duration, user_id: user.id };

    if (editId)
      await supabase.from("saved_plans").update(planData).eq("id", editId);
    else await supabase.from("saved_plans").insert([planData]);

    await this.loadAndRender();
    this.closeModal();
  },
  async loadAndRender() {
    const user = await getCurrentUser();
    if (!user) return;
    const { data } = await supabase
      .from("saved_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    this.plans = data || [];
    this.renderUI();
  },
  renderUI() {
    const container = document.getElementById("saved-plans-container");
    if (!container) return;
    container.innerHTML =
      this.plans.length === 0
        ? `<p class="text-sm text-center text-gray-400 py-4">저장된 계획이 없습니다.</p>`
        : this.plans
            .map(
              (p) => `
        <div class="p-4 bg-white border border-gray-100 rounded-xl flex justify-between items-center shadow-sm">
          <div><h4 class="font-bold text-gray-800">${p.title}</h4><p class="text-sm text-gray-500">예산: ${p.budget}원 | ${p.duration}일</p></div>
          <div class="flex gap-2">
            <button onclick="savedPlanManager.openModal(${p.id})" class="text-blue-500 text-sm font-bold">수정</button>
            <button onclick="savedPlanManager.delete(${p.id})" class="text-red-500 text-sm font-bold">삭제</button>
          </div>
        </div>`,
            )
            .join("");
  },
  async delete(id) {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("saved_plans").delete().eq("id", id);
    await this.loadAndRender();
  },
  closeModal() {
    document.getElementById("new-plan-modal").classList.add("hidden");
  },
};

// ==========================================
// 4. [체크리스트 관리] (Supabase 연동)
// ==========================================
const checklistManager = {
  items: [],
  async loadAndRender() {
    const user = await getCurrentUser();
    if (!user) return;
    const { data } = await supabase
      .from("checklist")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: true });
    this.items = data || [];
    this.renderUI();
  },
  async add() {
    const input = document.getElementById("checklist-input");
    if (!input || !input.value.trim()) return;
    const user = await getCurrentUser();
    if (!user) return alert("로그인이 필요합니다.");
    await supabase
      .from("checklist")
      .insert([
        { text: input.value.trim(), completed: false, user_id: user.id },
      ]);
    input.value = "";
    await this.loadAndRender();
  },
  async toggle(id) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    await supabase
      .from("checklist")
      .update({ completed: !item.completed })
      .eq("id", id);
    await this.loadAndRender();
  },
  async delete(id) {
    await supabase.from("checklist").delete().eq("id", id);
    await this.loadAndRender();
  },
  renderUI() {
    const ul = document.getElementById("checklist-ul");
    const countSpan = document.getElementById("checklist-count");
    if (!ul) return;

    let completedCount = 0;
    ul.innerHTML =
      this.items.length === 0
        ? `<li class="text-gray-400 text-xs text-center py-6">등록된 준비물이 없습니다.</li>`
        : this.items
            .map((item) => {
              if (item.completed) completedCount++;
              return `
        <li class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 text-sm">
          <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
            <input type="checkbox" ${item.completed ? "checked" : ""} onchange="checklistManager.toggle(${item.id})" class="w-4 h-4 text-purple-600 rounded">
            <span class="truncate ${item.completed ? "line-through text-gray-400" : "text-gray-700"}">${item.text}</span>
          </label>
          <button onclick="checklistManager.delete(${item.id})" class="text-gray-400 hover:text-red-500 p-1">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </li>`;
            })
            .join("");

    if (countSpan) countSpan.textContent = `${completedCount}개 완료`;
  },
};

// ==========================================
// 5. [카카오 지도 API 연동]
// ==========================================
function initMotripMap() {
  try {
    const mapContainer = document.getElementById("kakao-map");
    if (!mapContainer) return;

    const mapOption = {
      center: new kakao.maps.LatLng(37.5665, 126.978),
      level: 3,
    };
    kakaoMap = new kakao.maps.Map(mapContainer, mapOption);

    kakao.maps.event.addListener(kakaoMap, "click", (mouseEvent) => {
      removeOldMarkers();
      const clickedPosition = mouseEvent.latLng;
      createMarker(clickedPosition);
      selectedPlace = {
        name: "지도에서 선택한 위치",
        lat: Number(clickedPosition.getLat()),
        lng: Number(clickedPosition.getLng()),
      };
    });

    const placesService = new kakao.maps.services.Places();
    const searchBtn = document.getElementById("search-button");
    const searchInput = document.getElementById("search-keyword");

    if (searchBtn && searchInput) {
      searchBtn.addEventListener("click", () => {
        const keyword = searchInput.value.trim();
        if (!keyword) return alert("검색어를 입력해 주세요!");
        placesService.keywordSearch(keyword, (data, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const bounds = new kakao.maps.LatLngBounds();
            removeOldMarkers();
            for (let i = 0; i < data.length; i++) {
              displayPlaceMarker(data[i]);
              bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
            }
            kakaoMap.setBounds(bounds);
          } else {
            alert("검색 결과가 없습니다.");
          }
        });
      });
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchBtn.click();
      });
    }
  } catch (e) {
    console.error("카카오 지도 초기화 오류:", e);
  }
}

function displayPlaceMarker(place) {
  if (!kakaoMap) return;
  const markerPosition = new kakao.maps.LatLng(place.y, place.x);
  const marker = createMarker(markerPosition);
  kakao.maps.event.addListener(marker, "click", () => {
    const cardTitleInput = document.getElementById("card-title");
    if (cardTitleInput) {
      cardTitleInput.value = place.place_name;
      cardTitleInput.focus();
    }
    selectedPlace = {
      name: place.place_name,
      lat: Number(place.y),
      lng: Number(place.x),
    };
  });
}

function createMarker(position) {
  if (!kakaoMap) return null;
  const marker = new kakao.maps.Marker({ map: kakaoMap, position: position });
  mapMarkers.push(marker);
  return marker;
}

function removeOldMarkers() {
  mapMarkers.forEach((marker) => {
    if (marker) marker.setMap(null);
  });
  mapMarkers = [];
}

// ==========================================
// 6. [내 여행 플래너 관리] - RLS 해제 및 좌표 매핑 최종본
// ==========================================

function renderReservationStream(trips) {
  const streamContainer = document.getElementById("reservation-stream");
  if (!streamContainer) return;

  if (!trips || trips.length === 0) {
    streamContainer.innerHTML = `<p class="motrip-empty text-gray-400 text-sm text-center py-4">등록된 여행 일정이 없습니다.</p>`;
    return;
  }

  streamContainer.innerHTML = trips
    .map(
      (trip) => `
    <div class="motrip-item" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;" 
         data-id="${trip.id}" data-lat="${trip.latitude || ""}" data-lng="${trip.longitude || ""}">
        <div class="motrip-item-info" style="flex: 1; min-width: 0;">
            <div class="motrip-item-title" style="font-weight: bold; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${trip.title || "제목 없음"}</div>
            <div class="motrip-item-desc" style="color: #666; margin: 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${trip.description || "메모 없음"}</div>
            <div class="motrip-item-date" style="font-size: 13px; color: #999;">📅 ${trip.start_date || ""} ~ ${trip.end_date || ""}</div>
        </div>
        <div class="motrip-item-action" style="margin-left: 15px; flex-shrink: 0;">
            <button class="btn-delete" type="button" style="background: #ff4d4f; color: white; border: none; font-size: 12px; cursor: pointer; padding: 5px 10px; border-radius: 4px;">삭제</button>
        </div>
    </div>`,
    )
    .join("");
}

// 이벤트 리스너 통합 관리
document
  .getElementById("reservation-stream")
  ?.addEventListener("click", async function (event) {
    const deleteBtn = event.target.closest(".btn-delete");

    // 1. [삭제 버튼] 클릭 시
    if (deleteBtn) {
      event.stopPropagation();

      const item = deleteBtn.closest(".motrip-item");
      const tripId = item.dataset.id;
      if (!tripId) return;

      if (confirm("이 일정을 삭제하시겠습니까?")) {
        try {
          const user = await getCurrentUser(); // 현재 로그인한 유저 정보 확인

          let query = window.supabase
            .from("checklist")
            .delete()
            .eq("id", tripId);

          // RLS 보안 정책이 걸려있을 경우를 대비해 user_id 조건도 함께 걸어줍니다.
          if (user) {
            query = query.eq("user_id", user.id);
          }

          const { error } = await query;
          if (error) throw error;

          alert("일정이 삭제되었습니다.");
          await loadChecklistAsTrips(); // 목록 갱신
        } catch (err) {
          console.error("삭제 실패:", err);
          alert("삭제 실패: " + err.message);
        }
      }
      return;
    }

    // 2. [일반 항목] 클릭 시 지도 이동
    const item = event.target.closest(".motrip-item");
    if (!item) return;

    const lat = parseFloat(item.dataset.lat);
    const lng = parseFloat(item.dataset.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      if (kakaoMap) {
        kakaoMap.panTo(new kakao.maps.LatLng(lat, lng));
      } else {
        console.error("지도 객체(kakaoMap)를 찾을 수 없습니다.");
      }
    } else {
      alert(
        "이 항목은 좌표 컬럼이 추가되기 전에 생성되어 위치 정보가 없습니다. 새로 일정을 등록한 후 테스트해주세요!",
      );
    }
  });

// 데이터베이스 로드 함수
async function loadChecklistAsTrips() {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    // 내가 쓴 글만 필터링해서 가져오도록 보완
    const { data, error } = await window.supabase
      .from("checklist")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    renderReservationStream(data);

    if (data && data.length > 0) {
      const latestTrip = data[data.length - 1];
      updateDDayWidget({
        title: latestTrip.title,
        startDate: latestTrip.start_date,
        endDate: latestTrip.end_date,
      });
    } else {
      updateDDayWidget(null);
    }
  } catch (err) {
    console.error("로드 에러:", err);
  }
}

// 플래너 저장 버튼 초기화 함수
async function initPlannerManager() {
  const saveBtn = document.getElementById("save-button");
  if (!saveBtn) return;

  await loadChecklistAsTrips();

  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const title = document.getElementById("card-title")?.value.trim();
    const desc = document.getElementById("card-desc")?.value.trim();
    const startDate = document.getElementById("tour-start-date")?.value;
    const endDate = document.getElementById("tour-end-date")?.value;

    if (!title || !startDate || !endDate)
      return alert("필수 항목을 모두 입력해주세요!");

    try {
      const user = await getCurrentUser();
      if (!user) return alert("로그인이 필요합니다.");

      // 인서트할 때 새로 만든 latitude, longitude 컬럼에 값을 매핑합니다.
      const { error } = await window.supabase.from("checklist").insert([
        {
          title: title,
          description: desc,
          start_date: startDate,
          end_date: endDate,
          completed: false,
          user_id: user.id, // 유저 ID 명시
          place_name: selectedPlace?.name || "장소 없음",
          latitude: selectedPlace?.lat || null, // 위도 저장
          longitude: selectedPlace?.lng || null, // 경도 저장
        },
      ]);

      if (error) throw error;

      alert("🧳 여행 일정이 체크리스트에 저장되었습니다!");

      if (document.getElementById("card-title"))
        document.getElementById("card-title").value = "";
      if (document.getElementById("card-desc"))
        document.getElementById("card-desc").value = "";

      await loadChecklistAsTrips();
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장 실패: " + err.message);
    }
  });
}

function updateDDayWidget(trip) {
  const ddayElement = document.getElementById("widget-dday");
  const titleElement = document.getElementById("widget-title");
  const datesElement = document.getElementById("widget-dates");

  if (!trip) {
    if (ddayElement) ddayElement.innerText = "D-?";
    if (titleElement) titleElement.innerText = "등록된 여행이 없습니다";
    if (datesElement)
      datesElement.innerText = "일정을 등록하거나 선택해 주세요.";
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(trip.startDate);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

  let ddayText =
    diffDays === 0
      ? "D-Day"
      : diffDays > 0
        ? `D-${diffDays}`
        : `D+${Math.abs(diffDays)}`;

  if (ddayElement) ddayElement.innerText = ddayText;
  if (titleElement) titleElement.innerText = trip.title;
  if (datesElement)
    datesElement.innerText = `${trip.startDate} ~ ${trip.endDate}`;
}

// ==========================================
// 7. [날씨 API 연동]
// ==========================================
async function fetchMotripWeather(lat, lng, locationName) {
  const { nx, ny } = dfs_xy_conv(lat, lng);
  const serviceKey =
    "9cd175bfefbbd0f825908ee6acfbc4e23e99d1d3819f3e4c6381d0117f026909";
  const baseDate = new Date().toISOString().substring(0, 10).replace(/-/g, "");
  const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${serviceKey}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=0500&nx=${nx}&ny=${ny}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const items = data.response?.body?.items?.item;

    if (items) {
      const tempItems = items.filter((i) => i.category === "TMP");
      const uniqueDates = [...new Set(tempItems.map((i) => i.fcstDate))].sort();

      for (let i = 0; i < 4; i++) {
        const targetDate = uniqueDates[i];
        if (!targetDate) break;

        const dailyItems = items.filter((item) => item.fcstDate === targetDate);
        const temp = dailyItems.find(
          (item) => item.category === "TMP",
        )?.fcstValue;
        const sky = dailyItems.find(
          (item) => item.category === "SKY",
        )?.fcstValue;
        const pty = dailyItems.find(
          (item) => item.category === "PTY",
        )?.fcstValue;

        const tempEl = document.getElementById(`weather-temp-${i + 1}`);
        if (tempEl) tempEl.innerText = temp + "°C";

        const iconEl = document.getElementById(`weather-icon-${i + 1}`);
        if (iconEl) iconEl.innerText = getWeatherIcon(pty, sky);
      }

      function getWeatherIcon(pty, sky) {
        if (pty === "1") return "rainy";
        if (pty === "2" || pty === "3") return "weather_snowy";
        if (sky === "1") return "wb_sunny";
        if (sky === "3") return "partly_cloudy_day";
        return "cloud";
      }

      const locEl = document.getElementById("weather-location-name");
      if (locEl)
        locEl.innerText = locationName
          ? locationName.substring(0, 10)
          : "알 수 없는 지역";
    }
  } catch (e) {
    console.error("날씨 불러오기 에러:", e);
  }
}

function dfs_xy_conv(lat, lng) {
  const RE = 6371.00877,
    GRID = 5.0,
    SLAT1 = 30.0,
    SLAT2 = 60.0,
    OLON = 126.0,
    OLAT = 38.0,
    XO = 43,
    YO = 136;
  const DE = Math.PI / 180.0,
    re = RE / GRID,
    slat1 = SLAT1 * DE,
    slat2 = SLAT2 * DE,
    olon = OLON * DE,
    olat = OLAT * DE;
  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DE * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DE - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

// ==========================================
// 8. [프로필 업데이트 관리] (Supabase)
// ==========================================
async function saveProfileUpdates() {
  const newName = document.getElementById("modal-profile-name").value;
  const newLocation = document.getElementById("modal-profile-location").value;
  const newBio = document.getElementById("modal-profile-bio").value;
  const newAvatar = document.getElementById("modal-profile-preview").src;

  const user = await getCurrentUser();
  if (!user) return alert("로그인이 필요합니다.");

  const { error } = await supabase.from("mypage_user").upsert({
    id: user.id,
    username: newName,
    location: newLocation,
    bio: newBio,
    avatar_url: newAvatar,
  });

  if (error) {
    console.error("저장 실패:", error);
    alert("저장에 실패했습니다.");
  } else {
    document.getElementById("profile-display-name").innerText = newName;
    document.getElementById("profile-display-location").innerText = newLocation;
    document.getElementById("profile-display-bio").innerText = newBio;
    document.getElementById("profile-display-avatar").src = newAvatar;
    alert("프로필이 저장되었습니다!");
    window.closeEditProfileModal();
  }
}

function previewProfileFile(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("modal-profile-preview").src = e.target.result;
      document.getElementById("modal-file-name").innerText =
        input.files[0].name;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function previewProfileUrl(url) {
  if (url) document.getElementById("modal-profile-preview").src = url;
}

//간단 정산
const expenseManager = {
  async add() {
    const title = document.getElementById("exp-title")?.value;
    const total = parseInt(document.getElementById("exp-total")?.value);
    const members = parseInt(document.getElementById("exp-members")?.value);

    if (!title || isNaN(total) || isNaN(members))
      return alert("입력값을 확인하세요!");

    // 'dutch' 테이블로 변경
    const { error } = await window.supabase.from("dutch").insert([
      {
        title: title,
        total_amount: total,
        member_count: members,
      },
    ]);

    if (error) {
      console.error("저장 에러:", error);
      alert("저장 실패: " + error.message);
    } else {
      alert("등록 성공!");
      this.render();
    }
  },

  async render() {
    // 'dutch' 테이블 조회
    const { data } = await window.supabase.from("dutch").select("*");
    const container = document.getElementById("expense-list");

    container.innerHTML = (data || [])
      .map((d) => {
        const perPerson = Math.floor(d.total_amount / d.member_count);
        return `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm mb-2">
          <span><strong>${d.title}</strong> (${d.member_count}명)</span>
          <span class="text-blue-600 font-bold">1인당 ${perPerson.toLocaleString()}원</span>
        </div>
      `;
      })
      .join("");
  },
};

// ==========================================
// 9. 전역 함수 (HTML에서 직접 호출)
// ==========================================
window.switchWidgetTab = function (tabName) {
  document.getElementById("widget-weather-tab").style.display =
    tabName === "weather" ? "block" : "none";
  document.getElementById("widget-checklist-tab").style.display =
    tabName === "checklist" ? "block" : "none";
  if (tabName === "checklist" && typeof checklistManager !== "undefined")
    checklistManager.loadAndRender();
};
window.closeNewPlanModal = function () {
  savedPlanManager.closeModal();
};
window.openEditProfileModal = function () {
  document.getElementById("edit-profile-modal").classList.remove("hidden");
  document.getElementById("modal-profile-name").value = document.getElementById(
    "profile-display-name",
  ).innerText;
  document.getElementById("modal-profile-location").value =
    document.getElementById("profile-display-location").innerText;
  document.getElementById("modal-profile-bio").value = document.getElementById(
    "profile-display-bio",
  ).innerText;
  document.getElementById("modal-profile-preview").src =
    document.getElementById("profile-display-avatar").src;
};
window.closeEditProfileModal = function () {
  document.getElementById("edit-profile-modal").classList.add("hidden");
};
window.previewProfileFile = previewProfileFile;
window.previewProfileUrl = previewProfileUrl;
window.saveProfileUpdates = saveProfileUpdates;
window.selectTrip = function (id) {
  const trip = savedTrips.find((t) => t.id === id);
  if (!trip) return;
  if (trip.lat && trip.lng && kakaoMap) {
    const moveLatLon = new kakao.maps.LatLng(trip.lat, trip.lng);
    kakaoMap.panTo(moveLatLon);
    removeOldMarkers();
    createMarker(moveLatLon);
    fetchMotripWeather(trip.lat, trip.lng, trip.placeName || "선택한 여행지");
    updateDDayWidget(trip);
  }
};
window.deleteTrip = function (id) {
  if (!confirm("이 여행 일정을 삭제하시겠습니까?")) return;
  savedTrips = savedTrips.filter((trip) => trip.id !== id);
  renderReservationStream();
  if (savedTrips.length > 0) window.selectTrip(savedTrips[0].id);
  else {
    updateDDayWidget(null);
    removeOldMarkers();
  }
};

// ==========================================
// 10. 페이지 로드 초기화
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Supabase 데이터 로드
  if (typeof savedPlanManager !== "undefined") savedPlanManager.loadAndRender();
  if (typeof checklistManager !== "undefined") checklistManager.loadAndRender();

  // 2. 카카오 지도 로드
  if (typeof kakao !== "undefined" && kakao.maps) {
    if (typeof kakao.maps.load === "function")
      kakao.maps.load(() => initMotripMap());
    else initMotripMap();
  }

  // 3. 플래너 및 날씨 초기화 (기본값 서울)
  initPlannerManager();
  fetchMotripWeather(37.5665, 126.978, "서울/경기");

  // 4. 이벤트 리스너 바인딩
  const checklistInput = document.getElementById("checklist-input");
  if (checklistInput)
    checklistInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checklistManager.add();
    });

  // 프로필 수정 버튼 클릭 시 모달 열기
  const editProfileBtn = document.getElementById("btn-edit-profile");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      window.openEditProfileModal();
    });
  }

  // 새 계획 추가 버튼 클릭 시 모달 열기
  const addPlanBtn = document.getElementById("open-plan-modal");
  if (addPlanBtn) {
    addPlanBtn.addEventListener("click", () => {
      savedPlanManager.openModal();
    });
  }

  expenseManager.render();
  loadChecklistAsTrips();
});
