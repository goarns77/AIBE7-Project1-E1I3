/**
 * supabase-client.js — Supabase JS SDK 기반 클라이언트 전담 모듈
 * URL/키는 직접 명시(lib/supabase.js의 const와 중복되지 않도록 변수 없이 사용).
 * lib/supabase.js의 sb-session 키를 SDK 세션으로 복원한다.
 */

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(
  'https://porvghadkgpamnvbuyqu.supabase.co',
  'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK'
);

/* ── lib/supabase.js의 sb-session 키를 SDK getUser()에서도 읽도록 패치 ── */
(function patchGetUser() {
  const _orig = supabaseClient.auth.getUser.bind(supabaseClient.auth);
  supabaseClient.auth.getUser = async function () {
    try {
      const result = await _orig();
      if (result.data?.user) return result;
    } catch {}
    // fallback: lib/supabase.js가 저장한 sb-session
    try {
      const raw = localStorage.getItem('sb-session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.user?.id) return { data: { user: s.user }, error: null };
        if (s?.access_token && s?.user?.id) return { data: { user: s.user }, error: null };
      }
    } catch {}
    return { data: { user: null }, error: null };
  };
})();
