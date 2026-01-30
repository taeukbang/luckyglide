export const config = { 
  runtime: "nodejs",
  maxDuration: 10, // Vercel 무료 플랜은 10초 제한
};

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  
  try {
    const body = await req.json().catch(() => ({}));
    const { targetUrl, partnerId } = body || {};
    
    if (!targetUrl) {
      return json({ error: "targetUrl is required" }, 400);
    }
    
    if (!partnerId) {
      return json({ error: "partnerId is required" }, 400);
    }
    
    // 파트너별 API 키 가져오기
    const apiKeyEnvName = `MRT_PARTNER_API_KEY_${partnerId}`;
    const apiKey = process.env[apiKeyEnvName];
    
    if (!apiKey) {
      return json({ error: `API key not found for partner: ${partnerId}` }, 500);
    }
    
    // 마이링크 생성 API 호출 (재시도 로직 포함)
    const apiUrl = "https://partner-ext-api.myrealtrip.com/v1/mylink";
    const proxyResponse = await fetch(`${proxyUrl}/mylink`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true", // Ngrok 경고 페이지 건너뛰기
            "User-Agent": "LuckyGlide-Vercel/1.0"
          },
          body: JSON.stringify({ targetUrl, partnerId }),
          signal: controller.signal,
        });
      
      try {
        const startTime = Date.now();
        const upstream = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Connection": "keep-alive", // 연결 재사용
          },
          body: JSON.stringify({ targetUrl }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        
        const text = await upstream.text();
        
        if (!upstream.ok) {
          // 5xx 에러가 아니면 재시도하지 않음
          if (upstream.status < 500 || attempt === maxRetries) {
            return json({ error: `mylink creation error ${upstream.status}`, body: text }, 502);
          }
          // 5xx 에러이고 재시도 가능하면 계속
          continue;
        }
        
        try {
          const jsonObj = JSON.parse(text);
          if (attempt > 0) {
            console.log(`[MyLink] 재시도 ${attempt}회 후 성공 (${elapsed}ms)`);
          }
          return json(jsonObj);
        } catch {
          return json({ error: "invalid upstream json", body: text }, 502);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          // 타임아웃: 마지막 시도가 아니면 재시도
          if (attempt < maxRetries) {
            console.log(`[MyLink] 시도 ${attempt + 1} 타임아웃, 재시도 중...`);
            continue;
          }
          return json({ error: "Request timeout: MyRealTrip API took too long to respond after retries" }, 504);
        }
        
        // 네트워크 에러: 마지막 시도가 아니면 재시도
        if (attempt < maxRetries) {
          console.log(`[MyLink] 시도 ${attempt + 1} 네트워크 에러, 재시도 중...`);
          continue;
        }
        
        throw fetchError;
      }
    }
    
    // 모든 재시도 실패
    return json({ error: "Failed after all retries" }, 504);
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}
