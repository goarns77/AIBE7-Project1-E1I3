// 사용자 노출 문구와 용어를 한 곳에서 관리
const MSG = {
  // 공통 안내·오류 문구
  common: {
    required: '필수 항목을 입력해 주세요.',
    networkError: '요청 처리 중 문제가 발생했어요.',
    copySuccess: '초대 링크를 복사했어요!',
    copyFail: '복사에 실패했어요. 링크를 직접 선택해 주세요.',
  },
  // 여행방 관련 문구
  room: {
    createSuccess: '여행방이 만들어졌어요!',
    joinSuccess: '여행방에 입장했어요.',
    notFound: '여행방을 찾을 수 없어요.',
    nicknameRequired: '닉네임을 입력해 주세요.',
  },
  // 그룹 투표 관련 문구
  vote: {
    created: '새 투표가 등록됐어요.',
    submitted: '투표가 반영됐어요!',
    titleRequired: '투표 주제를 입력해 주세요.',
    optionRequired: '선택지를 2개 이상 입력해 주세요.',
    alreadyVoted: '이미 참여한 투표예요.',
  },
  // 지도·장소 검색 관련 문구
  map: {
    searchEmpty: '검색어를 입력해 주세요.',
    noResult: '검색 결과가 없어요.',
    sdkError: '지도를 불러오지 못했어요. 도메인 등록을 확인해 주세요.',
  },
  // 일정 보드 관련 문구
  itinerary: {
    added: '일정에 추가했어요.',
    removed: '일정에서 제거했어요.',
    empty: '아직 없음',
  },
};
