/**
 * supabase-client.js — Supabase JS SDK 기반 클라이언트 전담 모듈
 * URL/키는 직접 명시. lib/supabase.js의 sb-session 키를 SDK 스토리지로 복사한다.
 */

/* ── lib/supabase.js 세션을 SDK 스토리지 키로 복사 ── */
(function copySession() {
  try {
    const raw = localStorage.getItem('sb-session');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s?.access_token) return;
    // SDK가 expires_at을 요구하므로 계산해서 채워줌
    if (!s.expires_at) {
      s.expires_at = Math.round(Date.now() / 1000) + (s.expires_in || 3600);
    }
    // SDK 스토리지 키: sb-<gotrue-hostname>-auth-token
    const hostname = new URL('https://porvghadkgpamnvbuyqu.supabase.co/auth/v1').hostname;
    const sdkKey = 'sb-' + hostname + '-auth-token';
    localStorage.setItem(sdkKey, JSON.stringify(s));
  } catch {}
})();

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(
  'https://porvghadkgpamnvbuyqu.supabase.co',
  'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK'
);
