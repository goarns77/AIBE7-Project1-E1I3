const signupForm = document.querySelector('#signupForm');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const confirmInput = document.querySelector('#passwordConfirm');
const matchMsg = document.querySelector('#passwordMatchMsg');
const submitBtn = document.querySelector('#signupForm .btn-signup');

// 비밀번호 일치 실시간 확인
function checkPasswordMatch () {
  const pw = passwordInput.value;
  const confirm = confirmInput.value;

  if (!confirm) {
    matchMsg.textContent = '';
    matchMsg.className = 'password-match';
    return;
  }

  if (pw === confirm) {
    matchMsg.textContent = '비밀번호가 일치합니다';
    matchMsg.className = 'password-match valid';
  } else {
    matchMsg.textContent = '비밀번호가 일치하지 않습니다';
    matchMsg.className = 'password-match invalid';
  }
}

passwordInput.addEventListener('input', checkPasswordMatch);
confirmInput.addEventListener('input', checkPasswordMatch);

// 회원가입 폼 제출 처리
async function handleSignup (e) {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!name) { alert(MSG.signupNameRequired); return; }
  if (!email) { alert(MSG.signupEmailRequired); return; }
  if (!password) { alert(MSG.signupPasswordRequired); return; }
  if (!confirm) { alert(MSG.signupConfirmRequired); return; }
  if (password !== confirm) { alert(MSG.signupPasswordMismatch); return; }
  if (password.length < 8) { alert(MSG.signupPasswordLength); return; }

  submitBtn.disabled = true;
  submitBtn.textContent = '가입 중...';

  try {
    const { data, error } = await _supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) {
      alert(error.status === 422
        ? MSG.signupEmailExists
        : MSG.signupError
      );
      return;
    }

    if (data.user) {
      alert(MSG.signupSuccess);
      window.location.href = 'login.html';
    }
  } catch {
    alert(MSG.networkError);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '가입하기';
  }
}

signupForm.addEventListener('submit', handleSignup);
