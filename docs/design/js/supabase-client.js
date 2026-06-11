/**
 * supabase-client.js — Supabase JS SDK 기반 클라이언트 전담 모듈
 * - SDK 스토리지 키에 sb-session을 미리 복사 → SDK가 REST API 호출 시 auth token 사용
 * - getUser()는 sb-session에서 직접 읽음 → Auth API 403 회피
 */

/* ── sb-session을 SDK 스토리지로 복사 (REST API auth header용) ── */
(function copyToSDKStorage() {
  try {
    const raw = localStorage.getItem('sb-session');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s?.access_token) return;
    // SDK가 expires_at을 요구하므로 계산
    if (!s.expires_at) {
      s.expires_at = Math.round(Date.now() / 1000) + (s.expires_in || 3600);
    }
    const hostname = 'porvghadkgpamnvbuyqu.supabase.co';
    localStorage.setItem('sb-' + hostname + '-auth-token', JSON.stringify(s));
  } catch {}
})();

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(
  'https://porvghadkgpamnvbuyqu.supabase.co',
  'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK'
);

/* ── getUser()를 sb-session 기반으로 재정의 (SDK Auth API 호출 회피) ── */
supabaseClient.auth.getUser = async function () {
  try {
    const raw = localStorage.getItem('sb-session');
    if (raw) {
      const s = JSON.parse(raw);
      // user가 있으면 바로 반환
      if (s?.user?.id) return { data: { user: s.user }, error: null };
      // user가 없지만 access_token이 있으면 fetch로 조회 후 저장
      if (s?.access_token) {
        const res = await fetch('https://porvghadkgpamnvbuyqu.supabase.co/auth/v1/user', {
          headers: {
            'apikey': 'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK',
            'Authorization': `Bearer ${s.access_token}`
          }
        });
        if (res.ok) {
          const user = await res.json();
          if (user?.id) {
            s.user = user;
            localStorage.setItem('sb-session', JSON.stringify(s));
            return { data: { user }, error: null };
          }
        }
      }
    }
  } catch {}
  return { data: { user: null }, error: null };
};
