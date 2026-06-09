// 카카오 지도 재사용 모듈 — SDK 로드, 지도 생성, 장소 검색, 마커 관리
// 페이지 스크립트(room.js 등)가 직접 호출해 구동한다

// 지도·마커·준비상태를 보관하는 모듈 스코프 상태
const mapState = { map: null, markers: [], ready: false };

// 지정 컨테이너에 카카오 지도를 로드하고 준비되면 콜백 실행
function loadKakaoMap(containerSel, onReady) {
  // 스크립트 태그 생성 후 appkey 주입(https 고정)
  const script = document.createElement('script');
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${CONFIG.KAKAO_MAP_KEY}&libraries=services&autoload=false`;

  // SDK 로드 후 지도 생성
  script.onload = () => kakao.maps.load(() => {
    // 지도를 그릴 DOM 조회
    const container = document.querySelector(containerSel);
    // 초기 중심좌표(서울시청)와 확대 레벨로 지도 생성
    mapState.map = new kakao.maps.Map(container, { center: new kakao.maps.LatLng(37.5665, 126.978), level: 7 });
    mapState.ready = true;
    // 준비 완료 콜백 실행
    if (onReady) onReady(mapState.map);
  });

  // 로드 실패 시 원인 안내(도메인 미등록·키 오류 등)
  script.onerror = () => {
    console.error('카카오 지도 SDK 로드 실패 — 현재 origin 등록 확인:', location.origin);
    if (typeof showToast === 'function') showToast(MSG.map.sdkError);
  };

  document.head.appendChild(script);
}

// 키워드로 장소를 검색해 결과 배열을 콜백으로 전달
function searchPlaces(keyword, onResult) {
  // 지도 미준비 시 무시
  if (!mapState.ready) return;

  // 장소 검색 서비스로 키워드 검색 실행
  const ps = new kakao.maps.services.Places();
  ps.keywordSearch(keyword, (data, status) => {
    // 정상 응답이면 결과, 아니면 빈 배열 전달
    onResult(status === kakao.maps.services.Status.OK ? data : []);
  });
}

// 기존 마커를 모두 제거
function clearMarkers() {
  // 각 마커를 지도에서 내리고 배열 비우기
  mapState.markers.forEach((m) => m.setMap(null));
  mapState.markers = [];
}

// 장소 배열을 마커로 표시하고 전체가 보이도록 영역 조정
function showMarkers(places) {
  clearMarkers();

  // 표시할 장소가 없으면 종료
  if (!places.length) return;

  // 모든 마커를 담을 영역 객체 생성
  const bounds = new kakao.maps.LatLngBounds();

  // 각 장소에 마커 생성 및 영역 확장
  places.forEach((p) => {
    const pos = new kakao.maps.LatLng(p.y, p.x);
    mapState.markers.push(new kakao.maps.Marker({ position: pos, map: mapState.map }));
    bounds.extend(pos);
  });

  // 결과가 모두 보이도록 지도 영역 조정
  mapState.map.setBounds(bounds);
}

// 지정 좌표로 지도 중심 이동
function panTo(x, y) {
  // 지도 미준비 시 무시
  if (!mapState.ready) return;
  mapState.map.panTo(new kakao.maps.LatLng(y, x));
}
