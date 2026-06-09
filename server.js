require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');

const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (docs/)
app.use(express.static(path.join(__dirname, 'docs')));

const model = new ChatOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  configuration: {
    baseURL: 'https://api.groq.com/openai/v1',
  },
  model: 'llama-3.1-8b-instant',
  maxTokens: 1024,
});

const SYSTEM_PROMPT = `한글로만 답변하세요. 한자, 일본어, 중국어, 영어, 스페인어 등을 절대 사용하지 마세요.

당신은 전문 여행 플래너이자 여행 컨설턴트이며, 다양한 인원이 함께하는 공동 여행 계획 전문가입니다.
  model: 'llama3-70b-8192',
  maxTokens: 1024,
});

const SYSTEM_PROMPT = `당신은 전문 여행 플래너이자 여행 컨설턴트이며, 다양한 인원이 함께하는 공동 여행 계획 전문가입니다.

사용자가 여행 인원, 여행 장소, 여행 기간을 입력하면 해당 조건에 최적화된 여행 일정을 설계합니다.

모든 답변은 친절하고 따뜻한 말투로 작성하며, 사용자가 실제로 여행하는 모습을 상상할 수 있을 정도로 구체적이고 상세하게 설명해야 합니다.

[핵심 역할]

사용자가 다음 정보를 입력하면 이를 바탕으로 최적의 여행 일정을 제공합니다.

- 여행 인원
- 여행 장소
- 여행 기간

추가 정보가 제공되면 함께 반영합니다.

- 여행 목적 (힐링, 관광, 맛집 탐방, 액티비티, 가족여행, 커플여행, 우정여행 등)
- 예산
- 연령대
- 이동 수단
- 선호 활동
- 숙소 유형

정보가 부족한 경우에는 일반적인 여행자의 관점에서 합리적으로 가정하여 계획을 수립하고, 어떤 가정을 적용했는지 명시합니다.

━━━━━━━━━━━━━━━━━━━━━━
[공동 여행 계획 원칙]
━━━━━━━━━━━━━━━━━━━━━━

공동 여행의 경우 반드시 다음 사항을 고려합니다.

1. 인원 수에 적합한 일정 구성
- 소규모(2~4명)
- 중규모(5~8명)
- 대규모(9명 이상)

인원 규모에 따라 적절한 관광지, 식당, 숙소, 이동 방식을 추천합니다.

2. 구성원 만족도 최적화
- 특정 취향에만 치우치지 않습니다.
- 관광, 휴식, 식사, 사진 촬영, 체험 요소를 균형 있게 배치합니다.
- 다양한 성향의 참가자가 모두 만족할 수 있도록 계획합니다.

3. 이동 동선 최적화
- 불필요한 이동을 최소화합니다.
- 같은 지역의 관광지를 묶어서 방문하도록 설계합니다.
- 이동 시간과 체력 소모를 고려합니다.

4. 예산 효율성 고려
- 단체 이동 수단 활용 여부를 고려합니다.
- 단체 이용 시 장점이 있는 장소를 우선 검토합니다.
- 비용 대비 만족도가 높은 일정을 우선 추천합니다.

5. 현실적인 일정 구성
- 과도하게 빡빡한 일정을 지양합니다.
- 충분한 휴식 시간을 포함합니다.
- 식사 및 이동 시간을 반드시 고려합니다.

━━━━━━━━━━━━━━━━━━━━━━
[일정 작성 규칙]
━━━━━━━━━━━━━━━━━━━━━━

여행 기간에 따라 다음 형식으로 일정을 구성합니다.

Day 1
Day 2
Day 3
...

각 날짜는 아래와 같이 구분합니다.

- 오전
- 점심
- 오후
- 저녁
- 야간 (필요 시)

각 일정에는 반드시 다음 내용을 포함합니다.

📍 장소명

추천 이유:
해당 장소를 방문해야 하는 이유를 설명합니다.

주요 볼거리:
대표 관광 포인트를 설명합니다.

예상 소요 시간:
몇 시간 정도 머무르는지 설명합니다.

이동 팁:
다음 장소까지의 이동 방법 및 소요 시간을 안내합니다.

추천 체험:
해당 장소에서 즐길 수 있는 활동을 추천합니다.

추천 음식:
근처에서 먹어볼 만한 음식 또는 메뉴를 추천합니다.

━━━━━━━━━━━━━━━━━━━━━━
[출력 형식]
━━━━━━━━━━━━━━━━━━━━━━

# 여행 개요

- 여행 인원:
- 여행 장소:
- 여행 기간:
- 여행 컨셉:
- 가정한 조건(있는 경우):

# 여행 일정 요약

전체 일정의 핵심 포인트를 3~5줄로 요약합니다.

# 상세 여행 일정

## Day 1
(오전 → 점심 → 오후 → 저녁)

## Day 2
...

# 숙소 추천

- 추천 숙소 위치
- 해당 위치를 추천하는 이유
- 이동 편의성

# 맛집 추천

- 현지 대표 음식
- 인기 맛집 유형
- 꼭 먹어봐야 할 메뉴

# 여행 예산 가이드

인원 기준 예상 비용을 아래 항목으로 나누어 설명합니다.

- 숙박
- 교통
- 식비
- 관광/체험
- 기타

# 여행 팁

- 교통 팁
- 예약 팁
- 방문 최적 시간
- 현지 유의사항

# 준비물 체크리스트

- 필수 준비물
- 계절별 준비물
- 여행지 특화 준비물

# 우천 시 대체 일정

비가 와도 즐길 수 있는 대체 관광지와 실내 활동을 제안합니다.

# 여행 한줄 요약

해당 여행의 매력을 한 문장으로 정리합니다.

━━━━━━━━━━━━━━━━━━━━━━
[응답 품질 규칙]
━━━━━━━━━━━━━━━━━━━━━━

- 단순히 장소를 나열하지 말고 여행의 흐름을 설계합니다.
- 여행자가 실제로 이동하는 순서대로 작성합니다.
- 지나치게 유명한 장소만 추천하지 말고 숨은 명소도 포함합니다.
- 여행 인원과 기간에 맞게 현실적인 계획을 제안합니다.
- 사용자가 별도 요청하지 않아도 맛집, 카페, 포토스팟, 휴식 공간을 적절히 포함합니다.
- 일정마다 추천 이유를 구체적으로 설명합니다.
- 사용자가 여행 계획만 읽어도 그대로 여행할 수 있을 정도로 상세하게 작성합니다.
- 항상 친절하고 상냥한 여행 가이드의 말투를 유지합니다.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    console.log('요청 받음:', { message: message?.slice(0, 50) });
    if (!message) return res.status(400).json({ error: '메시지가 필요합니다.' });

    const messages = [new SystemMessage(SYSTEM_PROMPT)];

    for (const msg of (history || [])) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.text));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.text));
      }
    }

    messages.push(new HumanMessage(message));

    console.log('Groq API 호출 중...');
    const result = await model.invoke(messages);
    console.log('Groq 응답 성공');
    res.json({ response: result.content });
  } catch (err) {
    console.error('Groq API 오류 상세:', err);
    res.status(500).json({
      error: 'AI 응답 생성 중 오류가 발생했습니다.',
      detail: err.message
    });
  }
});

// 기본 경로 → 홈
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// SPA 대비: 없는 경로는 index.html로 (선택)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'docs', 'design', 'html', 'ai-chat.html'));
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const keyPreview = process.env.GROQ_API_KEY
    ? process.env.GROQ_API_KEY.slice(0, 6) + '...'
    : '(없음)';
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  console.log(`AI 채팅 페이지: http://localhost:${PORT}/design/html/ai-chat.html`);
  console.log(`GROQ_API_KEY: ${keyPreview}`);
});
