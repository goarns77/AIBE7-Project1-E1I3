/**
 * supabase-client.js — Supabase JS SDK 기반 클라이언트 전담 모듈
 * lib/supabase.js의 sb-session 키를 SDK 스토리지로 미리 복사하여
 * createClient() 실행 시 SDK가 자동으로 세션을 인식하게 한다.
 */

/* ── sb-session을 SDK 스토리지(sb-<hostname>-auth-token)로 복사 ── */
(function copyToSDKStorage() {
  try {
    const raw = localStorage.getItem('sb-session');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s?.access_token) return;
    // SDK 스토리지 키는 gotrue-js 내부에서 sb-<hostname>-auth-token 형식
    const hostname = 'porvghadkgpamnvbuyqu.supabase.co';
    localStorage.setItem('sb-' + hostname + '-auth-token', JSON.stringify(s));
  } catch {}
})();

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(
  'https://porvghadkgpamnvbuyqu.supabase.co',
  'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK'
);

/* ── getUser()가 SDK 조회 실패 시 sb-session을 fallback ── */
(function patchGetUser() {
  const _orig = supabaseClient.auth.getUser.bind(supabaseClient.auth);
  supabaseClient.auth.getUser = async function (...args) {
    try {
      const result = await _orig(...args);
      if (result.data?.user) return result;
    } catch {}
    try {
      const raw = localStorage.getItem('sb-session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.user?.id) return { data: { user: s.user }, error: null };
      }
    } catch {}
    return { data: { user: null }, error: null };
  };
})();
