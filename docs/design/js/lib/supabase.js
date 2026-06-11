// Supabase 직접 fetch 기반 클라이언트 (CDN SDK 미사용, file:// 호환)
const SUPABASE_URL = 'https://porvghadkgpamnvbuyqu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK';

const _supabase = {
  // ────── Auth ──────
  auth: {
    /** 이메일/비밀번호 로그인 */
    async signInWithPassword ({ email, password }) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { status: res.status, ...data } };
      localStorage.setItem('sb-session', JSON.stringify(data));
      // SDK 스토리지 키에도 동시 저장
      try {
        localStorage.setItem('sb-porvghadkgpamnvbuyqu.supabase.co-auth-token', JSON.stringify(data));
      } catch {}
      return { data: { session: data, user: data.user }, error: null };
    },

    /** 이메일/비밀번호 회원가입 */
    async signUp ({ email, password, options }) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password, data: options?.data })
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { status: res.status, ...data } };
      return { data: { user: data }, error: null };
    },

    /** 저장된 세션에서 현재 유저 조회 */
    async getSession () {
      const session = JSON.parse(localStorage.getItem('sb-session'));
      if (!session?.access_token) return { data: { session: null } };

      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const user = await res.json();
        if (!res.ok || !user?.id) {
          localStorage.removeItem('sb-session');
          return { data: { session: null } };
        }
        return { data: { session: { user, access_token: session.access_token } } };
      } catch {
        localStorage.removeItem('sb-session');
        return { data: { session: null } };
      }
    },

    /** OAuth 로그인 (Google, Kakao 등) */
    signInWithOAuth ({ provider, redirectTo }) {
      const redirect = redirectTo || window.location.origin + '/design/html/login.html';
      const url = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirect)}`;
      window.location.href = url;
    },

    /** OAuth 콜백 - URL hash에서 세션 추출 */
    _handleOAuthCallback () {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) return null;
      const params = new URLSearchParams(hash.replace('#', ''));
      const session = {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        expires_in: params.get('expires_in'),
        token_type: params.get('token_type'),
      };
      if (session.access_token) {
        // 토큰만 저장하고 user는 추후 getSession()에서 fetch
        session.user = { id: null };
        localStorage.setItem('sb-session', JSON.stringify(session));
        try {
          localStorage.setItem('sb-porvghadkgpamnvbuyqu.supabase.co-auth-token', JSON.stringify(session));
        } catch {}
        window.location.hash = '';
        return session;
      }
      return null;
    },

    /** 로그아웃 */
    async signOut () {
      const session = JSON.parse(localStorage.getItem('sb-session'));
      if (session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      }
      localStorage.removeItem('sb-session');
    }
  },

  // ────── Database ──────
  from (table) {
    return {
      select (columns = '*') {
        let queryString = `select=${columns}`;
        const filters = [];
        let orderBy = null;
        let orderAsc = true;

        return {
          eq (col, val) {
            filters.push(`${col}=eq.${encodeURIComponent(val)}`);
            return this;
          },
          order (col, { ascending } = {}) {
            orderBy = col;
            orderAsc = ascending !== false;
            return this;
          },
          async then (resolve, reject) {
            try {
              const session = JSON.parse(localStorage.getItem('sb-session'));
              const params = [queryString, ...filters].join('&');
              let url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
              if (orderBy) url += `&order=${orderBy}.${orderAsc ? 'asc' : 'desc'}`;

              const res = await fetch(url, {
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${session?.access_token || ''}`,
                  'Accept': 'application/json'
                }
              });
              const data = await res.json();
              resolve({ data, error: res.ok ? null : data });
            } catch (err) {
              reject(err);
            }
          },
          [Symbol.toStringTag]: 'Promise'
        };
      },

      async insert (values) {
        const session = JSON.parse(localStorage.getItem('sb-session'));
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token || ''}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(Array.isArray(values) ? values : [values])
        });
        const data = res.ok ? null : await res.json();
        return { data: null, error: data };
      },

      delete () {
        const session = JSON.parse(localStorage.getItem('sb-session'));

        return {
          async eq (col, val) {
            const res = await fetch(
              `${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${session?.access_token || ''}`,
                  'Prefer': 'return=minimal'
                }
              }
            );
            const data = res.ok ? null : await res.json();
            return { data: null, error: data };
          }
        };
      }
    };
  }
};
