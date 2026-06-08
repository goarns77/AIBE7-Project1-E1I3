const signupForm = document.querySelector('#signupForm');
const passwordInput = document.querySelector('#password');
const confirmInput = document.querySelector('#passwordConfirm');
const matchMsg = document.querySelector('#passwordMatchMsg');

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

// 회원가입 제출 처리
function handleSignup (e) {
  e.preventDefault();

  const { value: name } = document.querySelector('#name');
  const { value: email } = document.querySelector('#email');
  const { value: password } = document.querySelector('#password');
  const { value: confirm } = document.querySelector('#passwordConfirm');

  if (!name || !email || !password || !confirm) {
    alert('모든 필드를 입력해주세요.');
    return;
  }

  if (password !== confirm) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  if (password.length < 8) {
    alert('비밀번호는 8자 이상이어야 합니다.');
    return;
  }

  alert(`회원가입 요청: ${name} (${email})`);
  // Supabase 연동 시 실제 회원가입 로직으로 대체
}

signupForm.addEventListener('submit', handleSignup);
