// Supabase 연동 API 레이어 — PostgREST + fetch (관계형 스키마)
// 테이블: rooms, members, votes, vote_options, ballots, itinerary_items
// 반환 형태는 기존(localStorage)과 동일하게 맞춰 room.js 수정이 필요 없도록 한다

// Supabase 접속 정보(config.js에서 주입)
const SB_URL = CONFIG.SUPABASE_URL;
const SB_KEY = CONFIG.SUPABASE_PUBLISHABLE_KEY;
const REST = `${SB_URL}/rest/v1`;

// 공통 요청 헤더 생성
function sbHeaders(extra = {}) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// GET 요청 후 JSON 배열 반환
async function sbGet(path) {
  const res = await fetch(`${REST}/${path}`, { headers: sbHeaders() });
  if (!res.ok) throw new Error('NETWORK');
  return res.json();
}

// INSERT 요청 후 생성된 행 배열 반환
async function sbInsert(table, body) {
  const res = await fetch(`${REST}/${table}`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(body),
  });
  // 제약 위반(중복 투표 등)은 409로 구분
  if (res.status === 409) throw new Error('CONFLICT');
  if (!res.ok) throw new Error('NETWORK');
  return res.json();
}

// DELETE 요청
async function sbDelete(path) {
  const res = await fetch(`${REST}/${path}`, { method: 'DELETE', headers: sbHeaders() });
  if (!res.ok) throw new Error('NETWORK');
  return true;
}

// === DB 행 → 화면용 객체(카멜케이스) 매핑 ===

// 멤버 행 매핑
function mapMember(m) {
  return { id: m.id, nickname: m.nickname, isHost: m.is_host };
}

// 투표 행 매핑(선택지·득표 포함)
function mapVote(v) {
  return {
    id: v.id,
    title: v.title,
    createdBy: v.created_by,
    // 선택지별 득표자 ID 목록을 ballots에서 추출
    options: (v.vote_options || []).map((o) => ({
      id: o.id,
      label: o.label,
      voterIds: (o.ballots || []).map((b) => b.member_id),
    })),
  };
}

// 일정 항목 행 매핑
function mapItem(it) {
  return { id: it.id, day: it.day, placeName: it.place_name, address: it.address, x: it.x, y: it.y };
}

// 여행방 행(임베디드) 매핑
function mapRoom(row) {
  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    inviteCode: row.invite_code,
    members: (row.members || []).map(mapMember),
    votes: (row.votes || []).map(mapVote),
    itinerary: (row.itinerary_items || []).map(mapItem),
  };
}

// === Auth 헬퍼 ===

// 현재 로그인한 Supabase 사용자 ID 반환
async function getCurrentUserId() {
  try {
    if (typeof supabaseClient !== 'undefined') {
      const { data } = await supabaseClient.auth.getUser();
      if (data?.user?.id) return data.user.id;
    }
  } catch (e) {}
  try {
    if (typeof _supabase !== 'undefined') {
      const { data } = await _supabase.auth.getSession();
      if (data?.session?.user?.id) return data.session.user.id;
    }
  } catch (e) {}
  return null;
}

// 로그아웃 처리
async function logout() {
  try {
    if (typeof supabaseClient !== 'undefined') {
      await supabaseClient.auth.signOut();
    }
    if (typeof _supabase !== 'undefined') {
      await _supabase.auth.signOut();
    }
  } catch (e) {}
  localStorage.removeItem('sb-session');
  window.location.href = '/design/html/index.html';
}

// === API 함수 ===

// 여행방 생성 — POST /rooms (+ 주최자 멤버 등록)
async function createRoom({ title, destination, startDate, endDate, host }) {
  // 초대 코드 생성
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  // 현재 로그인한 사용자 ID
  const userId = await getCurrentUserId();

  // 여행방 행 생성
  const [room] = await sbInsert('rooms', {
    title,
    destination: destination || null,
    start_date: startDate || null,
    end_date: endDate || null,
    invite_code: inviteCode,
  });

  // 주최자를 첫 멤버로 등록 (user_id 함께 저장)
  const [me] = await sbInsert('members', {
    room_id: room.id,
    nickname: host || '주최자',
    is_host: true,
    user_id: userId,
  });

  // 생성 직후 화면용 객체로 매핑해 반환
  return { room: mapRoom({ ...room, members: [me], votes: [], itinerary_items: [] }), me: mapMember(me) };
}

// 여행방 삭제 — DELETE /rooms (멤버·투표·일정 등 FK on delete cascade로 함께 삭제)
async function deleteRoom(roomId) {
  return sbDelete(`rooms?id=eq.${roomId}`);
}

// 여행방 조회 — GET /rooms (임베딩으로 연관 데이터 한 번에)
async function getRoom(roomId) {
  // 멤버·투표·선택지·표·일정을 중첩 select로 함께 조회
  const select = 'id,title,destination,start_date,end_date,invite_code,'
    + 'members(id,nickname,is_host),'
    + 'votes(id,title,created_by,vote_options(id,label,ballots(member_id))),'
    + 'itinerary_items(id,day,place_name,address,x,y)';

  const rows = await sbGet(`rooms?id=eq.${roomId}&select=${select}`);

  // 없는 방이면 예외 발생
  if (!rows.length) throw new Error('ROOM_NOT_FOUND');
  return mapRoom(rows[0]);
}

// 현재 사용자가 멤버인 모든 여행방 조회
async function getUserRooms() {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const members = await sbGet(`members?user_id=eq.${userId}&select=room_id`);
  const roomIds = members.map(m => m.room_id);
  if (!roomIds.length) return [];
  return getRoomsBrief(roomIds);
}

// 여러 여행방의 요약 정보 조회 — GET /rooms?id=in.(...)
async function getRoomsBrief(ids) {
  // 빈 목록이면 즉시 반환
  if (!ids.length) return [];
  // id 목록을 in 필터로 한 번에 조회(주최자 판별용 멤버 포함)
  return sbGet(`rooms?id=in.(${ids.join(',')})&select=id,title,destination,start_date,end_date,members(id,is_host)`);
}

// 여행방 참여 — POST /members
async function joinRoom(roomId, { nickname }) {
  const userId = await getCurrentUserId();
  // 새 멤버 행 생성 후 매핑 반환 (user_id 함께 저장)
  const [member] = await sbInsert('members', { room_id: roomId, nickname, is_host: false, user_id: userId });
  return mapMember(member);
}

// 투표 생성 — POST /votes (+ 선택지 일괄 등록)
async function createVote(roomId, { title, options, createdBy }) {
  // 투표 행 생성
  const [vote] = await sbInsert('votes', { room_id: roomId, title, created_by: createdBy || null });

  // 선택지들을 한 번의 요청으로 추가
  const rows = options.map((label) => ({ vote_id: vote.id, label }));
  const created = await sbInsert('vote_options', rows);

  // 화면용 투표 객체로 매핑(초기 득표 0)
  return mapVote({ ...vote, vote_options: created.map((o) => ({ ...o, ballots: [] })) });
}

// 투표 삭제 — DELETE /votes (선택지·표는 FK on delete cascade로 함께 삭제)
async function deleteVote(roomId, voteId) {
  return sbDelete(`votes?id=eq.${voteId}`);
}

// 투표 제출 — POST /ballots (중복은 DB unique 제약으로 차단)
async function castVote(roomId, voteId, { optionId, memberId }) {
  try {
    // 표 한 줄 생성
    await sbInsert('ballots', { vote_id: voteId, option_id: optionId, member_id: memberId });
  } catch (err) {
    // 제약 위반(중복 투표)을 별도 에러로 변환
    if (err.message === 'CONFLICT') throw new Error('ALREADY_VOTED');
    throw err;
  }
  return true;
}

// 일정에 장소 추가 — POST /itinerary_items
async function addItineraryItem(roomId, { day, placeName, address, x, y }) {
  // 일정 항목 행 생성 후 매핑 반환
  const [item] = await sbInsert('itinerary_items', {
    room_id: roomId, day, place_name: placeName, address: address || null, x, y,
  });
  return mapItem(item);
}

// 일정에서 장소 제거 — DELETE /itinerary_items
async function removeItineraryItem(roomId, itemId) {
  return sbDelete(`itinerary_items?id=eq.${itemId}`);
}
