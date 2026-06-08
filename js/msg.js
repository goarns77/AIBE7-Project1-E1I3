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
};
