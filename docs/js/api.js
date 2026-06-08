// 데모용 API 레이어 — 백엔드 연동 전 localStorage 기반으로 동작
// 실제 서버 연동 시 각 함수의 주석 처리된 fetch 예시로 교체

// 여행방 전체를 저장하는 localStorage 키
const DB_KEY = 'motrip:rooms';

// 저장소에서 전체 여행방 맵을 역직렬화
function readDB() {
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : {};
}

// 전체 여행방 맵을 직렬화해 저장
function writeDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// 네트워크 지연을 흉내 내는 헬퍼
function delay(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 짧은 임의 식별자를 생성
function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

// 여행방 생성 — POST /rooms
async function createRoom({ title, destination, startDate, endDate, host }) {
  await delay();

  // 신규 여행방 식별자와 초대 코드 생성
  const id = uid('room_');
  const inviteCode = uid().slice(0, 6).toUpperCase();

  // 주최자를 첫 멤버로 등록
  const hostMember = { id: uid('mem_'), nickname: host || '주최자', isHost: true };

  // 여행방 기본 구조 구성(일정 보드 포함)
  const room = { id, title, destination, startDate, endDate, inviteCode, members: [hostMember], votes: [], itinerary: [] };

  // 저장소에 반영
  const db = readDB();
  db[id] = room;
  writeDB(db);

  // 실제: return fetch('/rooms', { method:'POST', body: JSON.stringify(room) }).then((r) => r.json());
  return { room, me: hostMember };
}

// 여행방 조회 — GET /rooms/:id
async function getRoom(roomId) {
  await delay();

  const db = readDB();
  const room = db[roomId];

  // 없는 방이면 예외 발생
  if (!room) throw new Error('ROOM_NOT_FOUND');
  return room;
}

// 여행방 참여 — POST /rooms/:id/join
async function joinRoom(roomId, { nickname }) {
  await delay();

  const db = readDB();
  const room = db[roomId];
  if (!room) throw new Error('ROOM_NOT_FOUND');

  // 새 멤버 생성 후 목록에 추가
  const member = { id: uid('mem_'), nickname, isHost: false };
  room.members.push(member);
  writeDB(db);

  // 실제: return fetch(`/rooms/${roomId}/join`, { method:'POST', body: JSON.stringify({ nickname }) }).then((r) => r.json());
  return member;
}

// 투표 생성 — POST /rooms/:id/votes
async function createVote(roomId, { title, options, createdBy }) {
  await delay();

  const db = readDB();
  const room = db[roomId];
  if (!room) throw new Error('ROOM_NOT_FOUND');

  // 선택지를 득표 집계가 가능한 구조로 변환
  const builtOptions = options.map((label) => ({ id: uid('opt_'), label, voterIds: [] }));
  const vote = { id: uid('vote_'), title, options: builtOptions, createdBy };
  room.votes.push(vote);
  writeDB(db);

  // 실제: return fetch(`/rooms/${roomId}/votes`, { method:'POST', body: JSON.stringify(vote) }).then((r) => r.json());
  return vote;
}

// 투표 제출 — POST /rooms/:id/votes/:voteId
async function castVote(roomId, voteId, { optionId, memberId }) {
  await delay();

  const db = readDB();
  const room = db[roomId];
  if (!room) throw new Error('ROOM_NOT_FOUND');

  // 대상 투표를 탐색
  const vote = room.votes.find((v) => v.id === voteId);
  if (!vote) throw new Error('VOTE_NOT_FOUND');

  // 이미 참여했는지 모든 선택지에서 확인
  const voted = vote.options.some((o) => o.voterIds.includes(memberId));
  if (voted) throw new Error('ALREADY_VOTED');

  // 선택한 옵션에 투표자 추가
  const option = vote.options.find((o) => o.id === optionId);
  if (!option) throw new Error('OPTION_NOT_FOUND');
  option.voterIds.push(memberId);
  writeDB(db);

  // 실제: return fetch(`/rooms/${roomId}/votes/${voteId}`, { method:'POST', body: JSON.stringify({ optionId }) }).then((r) => r.json());
  return vote;
}

// 일정에 장소 추가 — POST /rooms/:id/itinerary
async function addItineraryItem(roomId, { day, placeName, address, x, y }) {
  await delay();

  const db = readDB();
  const room = db[roomId];
  if (!room) throw new Error('ROOM_NOT_FOUND');

  // 기존 방 호환을 위해 일정 배열 보정
  room.itinerary = room.itinerary || [];

  // 새 일정 항목 생성 후 추가
  const item = { id: uid('item_'), day, placeName, address, x, y };
  room.itinerary.push(item);
  writeDB(db);

  // 실제: return fetch(`/rooms/${roomId}/itinerary`, { method:'POST', body: JSON.stringify(item) }).then((r) => r.json());
  return item;
}

// 일정에서 장소 제거 — DELETE /rooms/:id/itinerary/:itemId
async function removeItineraryItem(roomId, itemId) {
  await delay();

  const db = readDB();
  const room = db[roomId];
  if (!room) throw new Error('ROOM_NOT_FOUND');

  // 해당 항목을 제외하고 일정 재구성
  room.itinerary = (room.itinerary || []).filter((it) => it.id !== itemId);
  writeDB(db);

  // 실제: return fetch(`/rooms/${roomId}/itinerary/${itemId}`, { method:'DELETE' });
  return true;
}
