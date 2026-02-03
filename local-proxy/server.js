// 로컬 프록시 서버
// 당신의 PC에서 실행되어 마이리얼트립 API를 호출합니다.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health Check 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: '로컬 프록시 서버 정상 작동 중'
  });
});

// 마이링크 생성 프록시
app.post('/mylink', async (req, res) => {
  const { targetUrl, partnerId } = req.body;
  
  console.log(`[로컬 프록시] 요청 받음:`, { targetUrl, partnerId });
  
  // 환경변수에서 API 키 가져오기
  const apiKey = process.env[`MRT_PARTNER_API_KEY_${partnerId}`];
  
  if (!apiKey) {
    console.error(`[로컬 프록시] API 키 없음: ${partnerId}`);
    return res.status(400).json({ 
      error: 'Invalid partnerId',
      details: `No API key found for partner: ${partnerId}` 
    });
  }
  
  try {
    console.log(`[로컬 프록시] 마이리얼트립 API 호출 시작...`);
    const startTime = Date.now();
    
    const response = await fetch('https://partner-ext-api.myrealtrip.com/v1/mylink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetUrl })
    });
    
    const elapsed = Date.now() - startTime;
    const data = await response.json();
    
    console.log(`[로컬 프록시] ✅ 성공 (${elapsed}ms):`, data.data?.mylink);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('[로컬 프록시] ❌ 오류:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  로컬 프록시 서버 시작됨!              ║
╚════════════════════════════════════════╝

포트: ${PORT}
Health Check: http://localhost:${PORT}/health
마이링크 생성: http://localhost:${PORT}/mylink

다음 단계:
1. 다른 터미널에서 ngrok 실행:
   npx ngrok http ${PORT}
   
2. ngrok에서 제공하는 HTTPS URL을 복사

3. Vercel 환경변수에 추가:
   PROXY_URL=<ngrok_url>

4. 완료! 🎉
  `);
});


