/**
 * supabase-client.js — Supabase JS SDK 기반 클라이언트 전담 모듈
 * - SDK 스토리지 키에 sb-session을 미리 복사 → SDK가 REST API 호출 시 auth token 사용
 * - getUser()는 sb-session에서 직접 읽음 → Auth API 403 회피
 */

/* ── sb-session을 SDK 스토리지로 복사 (REST API auth header용) ── */
(function copyToSDKStorage() {
  try {
    const raw = localStorage.getItem("sb-session");
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s?.access_token) return;
    // SDK가 expires_at을 요구하므로 계산
    if (!s.expires_at) {
      s.expires_at = Math.round(Date.now() / 1000) + (s.expires_in || 3600);
    }
    const hostname = "porvghadkgpamnvbuyqu.supabase.co";
    localStorage.setItem("sb-" + hostname + "-auth-token", JSON.stringify(s));
  } catch {}
})();

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(
  "https://porvghadkgpamnvbuyqu.supabase.co",
  "sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK",
);

/* ── 헬퍼: sb-session에서 세션 객체 읽기 (없거나 유효하지 않으면 null) ── */
function readSBSession() {
  try {
    const raw = localStorage.getItem("sb-session");
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.access_token) return null;
    return s;
  } catch {
    return null;
  }
}

/* ── getSession() 재정의 — sb-session 기반, SDK inMemorySession 우회 ── */
supabaseClient.auth.getSession = async function () {
  const s = readSBSession();
  if (!s) return { data: { session: null }, error: null };
  return { data: { session: s }, error: null };
};

/* ── getUser() 재정의 — sb-session 기반, SDK Auth API 호출 회피 ── */
supabaseClient.auth.getUser = async function () {
  const s = readSBSession();
  if (!s) return { data: { user: null }, error: null };
  if (s?.user?.id) return { data: { user: s.user }, error: null };
  // user가 없지만 access_token이 있으면 fetch로 조회 후 저장
  try {
    const res = await fetch(
      "https://porvghadkgpamnvbuyqu.supabase.co/auth/v1/user",
      {
        headers: {
          apikey: "sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK",
          Authorization: `Bearer ${s.access_token}`,
        },
      },
    );
    if (res.ok) {
      const user = await res.json();
      if (user?.id) {
        s.user = user;
        localStorage.setItem("sb-session", JSON.stringify(s));
        return { data: { user }, error: null };
      }
    }
  } catch {}
  return { data: { user: null }, error: null };
};
