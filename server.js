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
  model: 'qwen/qwen3-32b',
  maxTokens: 4096,
});

const MAX_PROMPT_TOKENS = 5000;
const TPM_LIMIT = 6000;

function estimateTokens(text) {
  return Math.ceil(text.length / 1.5);
}

const SYSTEM_PROMPT = `한글로만 답변하세요.

당신은 전문 여행 플래너입니다. 여행 인원, 장소, 기간을 바탕으로 최적의 일정을 설계하세요. 정보가 부족하면 합리적으로 가정하고 그 사실을 명시하세요.

[공동 여행 계획 원칙]
- 인원 규모(소 2~4 / 중 5~8 / 대 9+)에 맞춰 구성
- 다양한 취향을 균형 있게 포함
- 이동 동선 최적화, 충분한 휴식 포함
- 예산 효율적이고 현실적인 일정

[일정 형식]
Day N: 오전 / 점심 / 오후 / 저녁 / 야간
각 일정에 장소명, 추천 이유, 소요 시간, 이동 팁, 추천 체험/음식 포함

[출력 섹션]
# 여행 개요 → # 여행 일정 요약 → # 상세 여행 일정(Day별) → # 숙소 추천 → # 맛집 추천 → # 여행 예산 가이드 → # 여행 팁 → # 준비물 체크리스트 → # 우천 시 대체 일정 → # 여행 한줄 요약

[할루시네이션 방지]
- 구체적 상호명, 주소, 전화번호, 가격, 영업시간을 절대 생성하지 말고 "현지 인기 맛집", "해당 지역 대표 메뉴" 등 일반적으로 표현
- 불확실한 수치는 범위로 표현하고 추정치임을 명시
- 모르면 "해당 정보는 제공이 어렵습니다"라고 답변
- 세부 정보는 사용자가 직접 확인하도록 안내
- "~할 수 있습니다", "~을 고려해보세요" 같은 열린 표현 사용

[응답 품질]
- 단순 장소 나열이 아닌 여행 흐름 위주로 작성
- 숨은 명소와 맛집, 카페, 포토스팟을 적절히 포함
- 친절하고 상냥한 여행 가이드 말투 유지`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    console.log('요청 받음:', { message: message?.slice(0, 50) });
    if (!message) return res.status(400).json({ error: '메시지가 필요합니다.' });

    const systemTokens = estimateTokens(SYSTEM_PROMPT);
    const userTokens = estimateTokens(message);
    const maxHistoryTokens = MAX_PROMPT_TOKENS - systemTokens - userTokens - 500;

    const messages = [new SystemMessage(SYSTEM_PROMPT)];
    let historyTokens = 0;

    for (const msg of (history || [])) {
      const tokens = estimateTokens(msg.text || '');
      if (historyTokens + tokens > maxHistoryTokens) break;
      historyTokens += tokens;
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.text));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.text));
      }
    }

    messages.push(new HumanMessage(message));

    console.log('Groq API 호출 중...');
    const result = await model.invoke(messages);
    let responseText = result.content;
    // Qwen thinking 태그 제거
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, '');
    responseText = responseText.replace(/<think>[\s\S]*$/g, '');
    responseText = responseText.trim();
    console.log('Groq 응답 성공');
    res.json({ response: responseText });
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
  res.sendFile(path.join(__dirname, 'docs', 'design', 'html', 'index.html'));
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
