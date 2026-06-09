const chatMessages = document.querySelector('#chatMessages');
const chatInput = document.querySelector('#chatInput');
const sendBtn = document.querySelector('#sendBtn');
const newChatBtn = document.querySelector('.chat-header-btn');

// 로그인 세션 확인 및 메시지 로드
let currentUser = null;

async function initChat () {
  try {
    const { data: { session } } = await _supabase.auth.getSession();
    currentUser = session?.user ?? null;

    if (currentUser) {
      await loadChatHistory();
    } else {
      const welcome = createMessage('ai', MSG.chatWelcome);
      chatMessages.appendChild(welcome);
    }
  } catch {
    const welcome = createMessage('ai', MSG.chatWelcome);
    chatMessages.appendChild(welcome);
  }
}

// 서버에서 채팅 내역 불러오기
async function loadChatHistory () {
  try {
    const { data, error } = await _supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: true });

    if (error) return;
    if (!data || data.length === 0) {
      const welcome = createMessage('ai', MSG.chatWelcome);
      chatMessages.appendChild(welcome);
      return;
    }

    for (const msg of data) {
      const type = msg.role === 'user' ? 'user' : 'ai';
      const content = msg.content || msg.html_content || '';
      if (!content) continue;
      const el = createMessage(type, content);
      chatMessages.appendChild(el);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch {
    // 서버 조회 실패 시 시작 메시지만 표시
  }
}

// 메시지 말풍선 생성
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

// 메시지를 서버에 저장
async function saveMessage (role, content, htmlContent) {
  if (!currentUser) return;

  try {
    await _supabase.from('chat_messages').insert({
      user_id: currentUser.id,
      role,
      content,
      html_content: htmlContent || content
    });
  } catch {
    // 저장 실패는 무시 (화면 표시에는 영향 없음)
  }
}

// 추천 결과 카드 생성
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

// 새로운 메시지 추가 후 스크롤
function addMessage (type, content) {
  const msg = createMessage(type, content);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 사용자 메시지 전송
async function sendMessage () {
  const text = chatInput.value.trim();
  if (!text) return;

  // 사용자 메시지 추가
  addMessage('user', text);
  await saveMessage('user', text);
  chatInput.value = '';

  // AI 응답 생성
  try {
    const aiResponse = generateAIResponse(text);
    addMessage('ai', aiResponse);
    await saveMessage('assistant', aiResponse.replace(/<[^>]+>/g, ''), aiResponse);
  } catch {
    addMessage('ai', MSG.chatError);
  }
}

// AI 응답 생성 (키워드 기반 추천)
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

  // 키워드 매칭
  for (const res of responses) {
    if (res.match.test(query)) {
      let text = res.text + '<br>';
      for (const card of res.cards) {
        text += createRecommendCard(card.title, card.desc, card.tag);
      }
      return text;
    }
  }

  // 기본 응답 (키워드 힌트 포함)
  const hints = ['국내 여행', '해외 여행', '힐링 여행', '맛집 여행', '액티비티', '가족 여행'];
  const hintStr = hints.map(h => `"${h}"`).join(', ');
  return `좋은 여행을 계획 중이시군요! 😊<br><br>` +
    `취향에 맞는 키워드를 알려주시면<br>더 정확히 추천해드릴게요.<br><br>` +
    `예시: ${hintStr}`;
}

// 새 대화 시작
async function handleNewChat () {
  chatMessages.innerHTML = '';
  const welcome = createMessage('ai', MSG.chatWelcome);
  chatMessages.appendChild(welcome);

  if (currentUser) {
    try {
      await _supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', currentUser.id);
    } catch {
      // 삭제 실패 무시
    }
  }
}

// 이벤트 바인딩
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
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

// 초기화
initChat();
