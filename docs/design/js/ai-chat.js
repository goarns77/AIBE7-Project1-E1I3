const chatMessages = document.querySelector('#chatMessages');
const chatInput = document.querySelector('#chatInput');
const sendBtn = document.querySelector('#sendBtn');
const newChatBtn = document.querySelector('#newChatBtn');
const logoutBtn = document.querySelector('#logoutBtn');

let currentUser = null;

// ────── localStorage 저장/불러오기 ──────

function getStorageKey () {
  const uid = currentUser?.id || 'anonymous';
  return `chat_log_${uid}`;
}

function saveToLocal (messages) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(messages));
  } catch { /* 용량 초과 등 무시 */ }
}

function loadFromLocal () {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ────── 메시지 말풍선 생성 ──────

function createMessage (type, content) {
  const isAI = type === 'ai';
  const wrapper = document.createElement('div');
  wrapper.className = `message message-${type}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.innerHTML = isAI
    ? '<i class="bi bi-stars"></i>'
    : '<i class="bi bi-person-fill"></i>';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = content;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);

  return wrapper;
}

// ────── 마크다운 렌더링 ──────

function renderMarkdown (text) {
  if (typeof marked === 'undefined') return text;
  return marked.parse(text, { breaks: true, gfm: true });
}

function addMessage (type, content) {
  const html = type === 'ai' ? renderMarkdown(content) : content;
  const msg = createMessage(type, html);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ────── 채팅 내역 불러오기 ──────

async function loadChatHistory () {
  const local = loadFromLocal();
  if (local && local.length > 0) {
    for (const msg of local) {
      addMessage(msg.role === 'user' ? 'user' : 'ai', msg.html || msg.text);
    }
    return;
  }

  // localStorage에 없으면 Supabase 시도
  if (!currentUser) return;
  try {
    const { data, error } = await _supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });

    if (error) return;
    if (!data || data.length === 0) return;

    const localCopy = [];
    for (const msg of data) {
      const content = msg.html_content || msg.content || '';
      if (!content) continue;
      addMessage(msg.role === 'user' ? 'user' : 'ai', content);
      localCopy.push({ role: msg.role, text: msg.content || '', html: msg.html_content || '' });
    }
    saveToLocal(localCopy);
  } catch { /* 테이블 없음 */ }
}

// ────── 메시지 저장 ──────

const _messageBuffer = [];

function pushMessage (role, text, html) {
  _messageBuffer.push({ role, text, html: html || text });
  saveToLocal(_messageBuffer);
}

async function saveToSupabase (role, content, htmlContent) {
  if (!currentUser) return;
  try {
    await _supabase.from('chat_messages').insert({
      user_id: currentUser.id,
      role,
      content,
      html_content: htmlContent || content
    });
  } catch { /* 테이블 없으면 무시 */ }
}

// ────── AI 응답 생성 ──────

function createRecommendCard (title, desc, tag) {
  const placeholderImages = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop'
  ];
  const imgUrl = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];

  return `
    <div class="recommend-card">
      <img src="${imgUrl}" alt="${title}" loading="lazy">
      <div class="recommend-card-body">
        <h6>${title}</h6>
        <p>${desc}</p>
        <span class="badge">${tag}</span>
      </div>
    </div>
  `;
}

function generateAIResponse (query) {
  const responses = [
    {
      match: /국내|제주|부산|강릉|여수|속초|경주/,
      text: '국내 여행을 원하시는군요! 🏖<br>다음 두 곳을 추천드립니다.',
      cards: [
        { title: '제주도 올레길 코스', desc: '한라산과 바다를 함께 즐기는 3박 4일 코스', tag: '자연/힐링' },
        { title: '부산 해운대 감성 여행', desc: '카페 투어와 해변을 즐기는 당일치기 여행', tag: '도시/감성' }
      ]
    },
    {
      match: /해외|일본|동남아|유럽|오사카|도쿄|다낭/,
      text: '해외 여행 좋아요! ✈️<br>아래 여행지를 추천드립니다.',
      cards: [
        { title: '오사카 먹부림 여행', desc: '3박 4일 자유여행, 구루메 패스 포함', tag: '해외/미식' },
        { title: '다낭 바캉스', desc: '리조트에서 즐기는 4박 5일 올인클루시브', tag: '해외/휴양' }
      ]
    },
    {
      match: /힐링|휴식|자연|캠핑|숲/,
      text: '지친 일상에 힐링이 필요하셨군요 🧘<br>조용히 쉴 수 있는 곳을 추천드려요.',
      cards: [
        { title: '속초 설악산 힐링 캠프', desc: '1박 2일 오토캠핑과 숲속 산책', tag: '자연/힐링' },
        { title: '담양 죽녹원 산책', desc: '대나무 숲길을 따라 느린 하루', tag: '데이트/산책' }
      ]
    },
    {
      match: /맛집|음식|먹방|미식/,
      text: '미식 여행을 원하시나요? 🍜<br>맛집 투어 코스를 준비했어요.',
      cards: [
        { title: '서울 맛집 투어', desc: '익선동·성수동 핫플레이스 3곳 방문', tag: '미식/도시' },
        { title: '전주 한옥마을 먹거리', desc: '비빔밥·콩나물국밥·모주 체험', tag: '미식/전통' }
      ]
    },
    {
      match: /액티비티|스포츠|서핑|스노클링|레저/,
      text: '액티비티 여행 짜릿하겠네요! 🏄<br>즐길 거리 가득한 곳을 추천드려요.',
      cards: [
        { title: '양양 서핑 캠프', desc: '초보도 가능한 서핑 강습 2일 패키지', tag: '레저/바다' },
        { title: '제주 스노클링 투어', desc: '서우봉·문섬 등 청정 바다 탐험', tag: '레저/제주' }
      ]
    },
    {
      match: /가족|아이|아기|키즈/,
      text: '가족 여행을 계획 중이시군요! 👨‍👩‍👧‍👦<br>온 가족이 함께 즐길 여행지예요.',
      cards: [
        { title: '용평 리조트 패키지', desc: '사계절 액티비티와 키즈 프로그램', tag: '가족/리조트' },
        { title: '에버랜드 1박 2일', desc: '테마파크·동물원·캐빈 숙박 포함', tag: '가족/테마파크' }
      ]
    }
  ];

  for (const res of responses) {
    if (res.match.test(query)) {
      let text = res.text + '<br>';
      for (const card of res.cards) {
        text += createRecommendCard(card.title, card.desc, card.tag);
      }
      return text;
    }
  }

  const hints = ['국내 여행', '해외 여행', '힐링 여행', '맛집 여행', '액티비티', '가족 여행'];
  const hintStr = hints.map(h => `"${h}"`).join(', ');
  return `좋은 여행을 계획 중이시군요! 😊<br><br>` +
    `취향에 맞는 키워드를 알려주시면<br>더 정확히 추천해드릴게요.<br><br>` +
    `예시: ${hintStr}`;
}

// ────── 서버 API 호출 ──────

const CHAT_API_URL = '/api/chat';

// AI 응답 생성 (서버 우선, 실패 시 키워드 fallback)
async function getAIResponse (text) {
  try {
    const res = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: _messageBuffer.slice(-10) // 최근 10개만 컨텍스트로 전달
      })
    });
    if (!res.ok) throw new Error('API 응답 오류');
    const data = await res.json();
    return data.response;
  } catch {
    return generateAIResponse(text); // 서버 오프라인 시 키워드 fallback
  }
}

// 로딩 인디케이터 (점점 애니메이션)
let _loadingEl = null;

function showLoading () {
  _loadingEl = createMessage('ai', '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>');
  chatMessages.appendChild(_loadingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideLoading () {
  if (_loadingEl) {
    _loadingEl.remove();
    _loadingEl = null;
  }
}

// ────── 메시지 전송 ──────

async function sendMessage () {
  const text = chatInput.value.trim();
  if (!text) return;

  // 사용자 메시지
  addMessage('user', text);
  pushMessage('user', text);
  saveToSupabase('user', text);
  chatInput.value = '';

  // 로딩 표시
  showLoading();

  // AI 응답
  try {
    const aiText = await getAIResponse(text);
    hideLoading();
    addMessage('ai', aiText);
    pushMessage('assistant', aiText);
    saveToSupabase('assistant', aiText);
  } catch {
    hideLoading();
    addMessage('ai', MSG.chatError);
  }
}

// ────── 초기화 ──────

async function initChat () {
  try {
    const { data: { session } } = await _supabase.auth.getSession();
    currentUser = session?.user ?? null;
  } catch { /* 무시 */ }

  // 로그인하지 않으면 로그인 페이지로 이동
  if (!currentUser) {
    window.location.href = '/design/html/login.html';
    return;
  }

  await loadChatHistory();

  // 불러온 내역이 없으면 환영 메시지
  if (chatMessages.children.length === 0) {
    addMessage('ai', MSG.chatWelcome);
  }
}

// ────── 로그아웃 ──────

async function handleLogout () {
  try {
    await _supabase.auth.signOut();
  } catch { /* 무시 */ }
  localStorage.clear();
  window.location.href = '/design/html/login.html';
}

// ────── 새 대화 ──────

async function handleNewChat () {
  chatMessages.innerHTML = '';
  _messageBuffer.length = 0;
  localStorage.removeItem(getStorageKey());
  addMessage('ai', MSG.chatWelcome);

  if (currentUser) {
    try {
      await _supabase.from('chat_messages').delete().eq('user_id', currentUser.id);
    } catch { /* 무시 */ }
  }
}

// ────── 이벤트 바인딩 ──────

sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
  // 한글 IME 조합 중 Enter 무시
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    chatInput.value = chip.textContent.trim();
    sendMessage();
  });
});

if (newChatBtn) {
  newChatBtn.addEventListener('click', handleNewChat);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

initChat();
