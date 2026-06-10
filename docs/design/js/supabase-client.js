/**
 * supabase-client.js — Supabase JS SDK 기반 클라이언트 전담 모듈
 * URL/키를 직접 명시하고 lib/supabase.js의 sb-session을 SDK로 동기화한다.
 */

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(
  'https://porvghadkgpamnvbuyqu.supabase.co',
  'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK'
);

/* ── sb-session을 SDK setSession으로 동기화 ── */
window._sessionReady = (async function syncSession() {
  try {
    const raw = localStorage.getItem('sb-session');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s?.access_token) return;
    await supabaseClient.auth.setSession({
      access_token: s.access_token,
      refresh_token: s.refresh_token || '',
    });
  } catch {}
})();

/* ── getUser()가 sessionReady 이후에 동작하도록 패치 ── */
const _origGetUser = supabaseClient.auth.getUser.bind(supabaseClient.auth);
supabaseClient.auth.getUser = async function (...args) {
  await window._sessionReady;
  return _origGetUser(...args);
};
