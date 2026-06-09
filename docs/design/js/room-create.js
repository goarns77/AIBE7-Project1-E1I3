// 여행방 생성 폼과 초대 링크 복사 로직

// 페이지 로드 후 핸들러를 연결
document.addEventListener('DOMContentLoaded', init);

// 초기화 — 폼·복사 버튼 이벤트 바인딩
function init() {
  // 여행방 생성 폼 제출 핸들러 연결
  document.querySelector('#create-form').addEventListener('submit', handleCreate);
  // 초대 링크 복사 버튼 핸들러 연결
  document.querySelector('#copy-invite').addEventListener('click', handleCopy);
}

// 여행방 생성 submit 핸들러
async function handleCreate(event) {
  // 기본 제출 동작(새로고침) 차단
  event.preventDefault();

  // 폼 입력값을 구조 분해로 추출
  const { tripTitle, destination, startDate, endDate, host } = Object.fromEntries(new FormData(event.currentTarget));

  // 필수값(여행명) 검증
  if (!tripTitle) {
    showToast(MSG.common.required);
    return;
  }

  try {
    // API 레이어로 여행방 생성 요청
    const { room, me } = await createRoom({ title: tripTitle, destination, startDate, endDate, host });
    // 생성자 본인을 멤버로 기억
    localStorage.setItem(`motrip:me:${room.id}`, me.id);
    // 결과 영역 렌더링
    renderResult(room);
    showToast(MSG.room.createSuccess);
  } catch (err) {
    showToast(MSG.common.networkError);
  }
}

// 생성 결과와 초대 링크를 표시
function renderResult(room) {
  const { id, title, inviteCode } = room;

  // 같은 폴더의 room.html 기준 초대 링크 구성
  const link = `${location.origin}${location.pathname.replace('room-create.html', 'room.html')}?roomId=${id}&code=${inviteCode}`;

  // 생성 폼을 숨기고 결과 영역을 노출
  document.querySelector('#create-section').classList.add('d-none');
  document.querySelector('#result-section').classList.remove('d-none');

  // 결과 텍스트와 링크 채우기
  document.querySelector('#created-title').textContent = title;
  document.querySelector('#invite-link').value = link;
  document.querySelector('#enter-room').href = link;
}

// 초대 링크 복사 버튼 핸들러
function handleCopy() {
  // 입력 칸의 링크를 클립보드로 복사
  const link = document.querySelector('#invite-link').value;
  copyToClipboard(link, MSG.common.copySuccess, MSG.common.copyFail);
}
