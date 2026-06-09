require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');

const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (docs/)
app.use(express.static(path.join(__dirname, 'docs')));

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash',
  maxOutputTokens: 1024,
});

const SYSTEM_PROMPT = `너는 "모여행"의 AI 여행 추천 봇이야.
항상 한국어로 친절하고 상세하게 답변해줘.
사용자의 취향과 예산, 일정에 맞는 여행지를 구체적으로 추천하고,
추천하는 장소의 특징, 즐길 거리, 맛집, 교통편, 팁도 함께 알려줘.
답변은 짧게 2~3문장으로 요약하지 말고, 충분한 정보를 제공해줘.
여행지 추천 시 실제 존재하는 장소 이름을 사용해줘.`;

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

    console.log('Gemini API 호출 중...');
    const result = await model.invoke(messages);
    console.log('Gemini 응답 성공');
    res.json({ response: result.content });
  } catch (err) {
    console.error('Gemini API 오류 상세:', err);
    res.status(500).json({
      error: 'AI 응답 생성 중 오류가 발생했습니다.',
      detail: err.message
    });
  }
});

// 기본 경로 → AI 채팅 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'design', 'html', 'ai-chat.html'));
});

// SPA 대비: 없는 경로는 index.html로 (선택)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'docs', 'design', 'html', 'ai-chat.html'));
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const keyPreview = process.env.GEMINI_API_KEY
    ? process.env.GEMINI_API_KEY.slice(0, 6) + '...'
    : '(없음)';
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  console.log(`AI 채팅 페이지: http://localhost:${PORT}/design/html/ai-chat.html`);
  console.log(`GEMINI_API_KEY: ${keyPreview}`);
});
