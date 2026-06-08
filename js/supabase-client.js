/**
 * supabase-client.js — Supabase 클라이언트 초기화 전담 모듈
 * URL과 공개 키는 팀 통합 후 실제 값으로 교체할 것.
 * 이 파일만 수정하면 프로젝트 전체에 반영된다.
 */

/* ── Supabase 접속 정보 (팀 DB로 통합 전 임시 공백 처리) ── */
const SUPABASE_URL = "https://porvghadkgpamnvbuyqu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK";

/* ── 전역에서 사용할 Supabase 클라이언트 인스턴스 생성 ── */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
