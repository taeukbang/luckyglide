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
    
    // 마이링크 생성 API 호출
    const apiUrl = "https://partner-ext-api.myrealtrip.com/v1/mylink";
    
    // 타임아웃 설정 (8초 - Vercel 10초 제한 내에서 최대한 기다림)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      const upstream = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUrl }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const text = await upstream.text();
      
      if (!upstream.ok) {
        return json({ error: `mylink creation error ${upstream.status}`, body: text }, 502);
      }
      
      try {
        const jsonObj = JSON.parse(text);
        return json(jsonObj);
      } catch {
        return json({ error: "invalid upstream json", body: text }, 502);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return json({ error: "Request timeout: MyRealTrip API took too long to respond" }, 504);
      }
      throw fetchError;
    }
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}
