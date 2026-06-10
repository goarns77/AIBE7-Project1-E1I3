const loginForm = document.querySelector('#loginForm');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const submitBtn = document.querySelector('#loginForm .btn-login');

// 로그인 후 이동할 경로 결정 (기존 방 있으면 room.html, 없으면 room-create.html)
function redirectAfterLogin() {
  const rooms = getMyRooms();
  if (rooms.length) {
    window.location.href = 'room.html?roomId=' + rooms[0];
  } else {
    window.location.href = 'room-create.html';
  }
}

// OAuth 로그인 처리
function handleOAuth (provider) {
  _supabase.auth.signInWithOAuth({
    provider,
    redirectTo: window.location.origin + '/design/html/login.html'
  });
}

// 로그인 폼 제출 처리
async function handleLogin (e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) { alert(MSG.loginEmailRequired); return; }
  if (!password) { alert(MSG.loginPasswordRequired); return; }

  submitBtn.disabled = true;
  submitBtn.textContent = '로그인 중...';

  try {
    const { data, error } = await _supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.status === 400
        ? MSG.loginFail
        : MSG.loginError
      );
      return;
    }

    if (data.session) {
      alert(MSG.loginSuccess);
      redirectAfterLogin();
    }
  } catch {
    alert(MSG.networkError);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '로그인';
  }
}

loginForm.addEventListener('submit', handleLogin);

// OAuth 콜백 확인 (페이지 로드 시 URL hash에 access_token이 있으면 세션 저장 후 리다이렉트)
(function checkOAuthCallback () {
  const session = _supabase.auth._handleOAuthCallback();
  if (session) {
    redirectAfterLogin();
  }
})();
