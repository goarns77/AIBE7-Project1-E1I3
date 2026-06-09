const loginForm = document.querySelector('#loginForm');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const submitBtn = document.querySelector('#loginForm .btn-login');

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
      // 리다이렉트 또는 메인 페이지 이동
      window.location.href = 'ai-chat.html';
    }
  } catch {
    alert(MSG.networkError);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '로그인';
  }
}

loginForm.addEventListener('submit', handleLogin);
