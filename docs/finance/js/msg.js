/**
 * msg.js — finance 모듈 사용자 표시 메시지 중앙 관리 파일
 * 오류 문구·안내 문구·성공/실패 메시지를 이곳에서 일괄 편집한다.
 * 수정 시 이 파일만 변경하면 전체 모듈에 반영된다.
 */

const MSG = {
  /* ── Supabase 인증 관련 메시지 ── */
  auth: {
    notLoggedIn: '로그인이 필요한 기능입니다.',
    loginSuccess: '로그인에 성공했습니다.',
    loginFail: '이메일 또는 비밀번호를 확인해 주세요.',
    logoutSuccess: '로그아웃 되었습니다.',
  },

  /* ── 지출 내역(Expense) CRUD 관련 메시지 ── */
  expense: {
    loadFail: '지출 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    addSuccess: '지출 내역이 추가되었습니다.',
    addFail: '지출 내역 추가에 실패했습니다.',
    editSuccess: '지출 내역이 수정되었습니다.',
    editFail: '지출 내역 수정에 실패했습니다.',
    deleteFail: '지출 내역 삭제에 실패했습니다.',
    deleteConfirm: '이 지출 내역을 삭제하시겠습니까?',
    noData: '등록된 지출 내역이 없습니다.',
    inputRequired: '날짜, 카테고리, 금액, 내용을 모두 입력해 주세요.',
    amountInvalid: '금액은 0보다 큰 숫자를 입력해 주세요.',
  },

  /* ── 예산(Budget) 관련 메시지 ── */
  budget: {
    loadFail: '예산 정보를 불러오지 못했습니다.',
    saveSuccess: '예산이 저장되었습니다.',
    saveFail: '예산 저장에 실패했습니다.',
    inputRequired: '예산 금액을 입력해 주세요.',
    exceeded: '⚠️ 예산을 초과했습니다!',
  },

  /* ── 정산(Settlement) 관련 메시지 ── */
  settlement: {
    loadFail: '정산 정보를 불러오지 못했습니다.',
    noExpense: '정산할 지출 내역이 없습니다.',
    perfect: '✅ 모두 균등하게 지출했습니다!',
  },

  /* ── 공통 오류 ── */
  common: {
    unexpectedError: '예기치 않은 오류가 발생했습니다.',
    networkError: '네트워크 연결을 확인해 주세요.',
  },
};
