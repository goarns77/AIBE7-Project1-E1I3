/**
 * supabase-client.js — Supabase JS SDK 기반 클라이언트 전담 모듈
 * URL/키는 직접 명시(lib/supabase.js의 const와 중복되지 않도록 변수 없이 사용).
 */

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(
  'https://porvghadkgpamnvbuyqu.supabase.co',
  'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK'
);
