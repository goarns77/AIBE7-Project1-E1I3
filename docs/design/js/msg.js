// 사용자 메시지 / 오류 문구
/**
 * msg.js — 사용자 표시 메시지 중앙 관리 파일
 * 오류 문구, 안내 문구, 성공/실패 메시지를 이곳에서 일괄 편집한다.
 * 수정 시 이 파일만 변경하면 전체 서비스에 반영된다.
 */

const MSG = {
  /* ── Supabase 인증 관련 메시지 ── */
  auth: {
    notLoggedIn: "로그인이 필요한 기능입니다.",
    loginSuccess: "로그인에 성공했습니다.",
    loginFail: "이메일 또는 비밀번호를 확인해 주세요.",
    logoutSuccess: "로그아웃 되었습니다.",
  },

  /* ── 일정(Schedule) CRUD 관련 메시지 ── */
  schedule: {
    loadFail: "일정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    addSuccess: "일정이 추가되었습니다.",
    addFail: "일정 추가에 실패했습니다.",
    editSuccess: "일정이 수정되었습니다.",
    editFail: "일정 수정에 실패했습니다.",
    deleteFail: "일정 삭제에 실패했습니다.",
    deleteConfirm: "이 일정을 삭제하시겠습니까?",
    noData: "등록된 일정이 없습니다.",
    inputRequired: "일자, 시간, 내용을 모두 입력해 주세요.",
  },

  /* ── 좋아요(Like) 관련 메시지 ── */
  like: {
    fail: "좋아요 처리에 실패했습니다.",
  },

  // 로그인
  loginEmailRequired: '이메일을 입력해주세요.',
  loginPasswordRequired: '비밀번호를 입력해주세요.',
  loginSuccess: '로그인 성공! 메인 페이지로 이동합니다.',
  loginFail: '이메일 또는 비밀번호가 올바르지 않습니다.',
  loginError: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',

  // 회원가입
  signupNameRequired: '이름을 입력해주세요.',
  signupEmailRequired: '이메일을 입력해주세요.',
  signupPasswordRequired: '비밀번호를 입력해주세요.',
  signupConfirmRequired: '비밀번호 확인을 입력해주세요.',
  signupPasswordMismatch: '비밀번호가 일치하지 않습니다.',
  signupPasswordLength: '비밀번호는 8자 이상이어야 합니다.',
  signupSuccess: '회원가입 되었습니다! 인증 메일을 확인해주세요.',
  signupEmailExists: '이미 사용 중인 이메일입니다.',
  signupError: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',

  // AI 채팅
  chatWelcome: '안녕하세요! 👋<br>모여행 AI 추천봇입니다.<br>어떤 여행을 계획 중이신가요?<br>인원과 여행지, 기간을 알려주시면<br>딱 맞는 일정을 추천해드릴게요!',
  chatEmptyMessage: '메시지를 입력해주세요.',
  chatError: '메시지 전송 중 오류가 발생했습니다.',
  chatNewChat: '새로운 대화를 시작합니다.',

  // 공통
  unexpectedError: '예기치 않은 오류가 발생했습니다.',
  networkError: '네트워크 연결을 확인해주세요.',

  /* ── 여행방/투표/일정 (room.js·room-create.js·ui.js 사용) ── */
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
