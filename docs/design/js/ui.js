// 화면 공통 UI 헬퍼 모음

// HTML 특수문자를 이스케이프해 XSS 방지
function escapeHtml(value) {
  // 문자열로 변환 후 위험 문자 치환
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// 화면 하단 토스트로 짧은 메시지를 표시
function showToast(message) {
  // 토스트 엘리먼트를 조회
  const el = document.querySelector('#toast');

  // 토스트가 없으면 alert로 대체
  if (!el) {
    alert(message);
    return;
  }

  // 메시지를 채우고 부트스트랩 토스트를 노출
  el.querySelector('.toast-body').textContent = message;
  bootstrap.Toast.getOrCreateInstance(el).show();
}

// 텍스트를 클립보드에 복사하고 결과를 안내
async function copyToClipboard(text, okMsg, failMsg) {
  try {
    // Clipboard API로 복사 시도
    await navigator.clipboard.writeText(text);
    showToast(okMsg);
    return true;
  } catch (err) {
    // 비보안 컨텍스트 등 실패 시 안내
    showToast(failMsg);
    return false;
  }
}

// 닉네임 이니셜 아바타 마크업 생성
function avatarHtml(nickname) {
  // 첫 글자를 추출해 원형 아바타로 표현(XSS 방지 이스케이프)
  const initial = (nickname || '?').trim().charAt(0);
  return `<span class="avatar" title="${escapeHtml(nickname)}">${escapeHtml(initial)}</span>`;
}

// 내가 만들거나 참여한 여행방 ID 목록 반환(로그인 전 로컬 기준)
function getMyRooms() {
  // 저장된 목록을 역직렬화
  const raw = localStorage.getItem('motrip:myRooms');
  return raw ? JSON.parse(raw) : [];
}

// 여행방 ID를 내 목록 맨 앞에 추가(중복 방지)
function rememberRoom(roomId) {
  const ids = getMyRooms();
  // 이미 있으면 그대로, 없으면 추가
  if (!ids.includes(roomId)) {
    ids.unshift(roomId);
    localStorage.setItem('motrip:myRooms', JSON.stringify(ids));
  }
}

// 여행방 ID를 내 목록에서 제거
function forgetRoom(roomId) {
  // 해당 ID를 제외하고 다시 저장
  const ids = getMyRooms().filter((id) => id !== roomId);
  localStorage.setItem('motrip:myRooms', JSON.stringify(ids));
}
