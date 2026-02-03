export const config = { 
  runtime: "nodejs",
  maxDuration: 10, // Vercel 무료 플랜은 10초 제한
};

import { createClient } from "@supabase/supabase-js";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}

// 📊 통계 기록 함수 (비동기, 실패해도 무시)
async function recordStats(partnerId: string) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.log('[Stats] Supabase 환경변수 없음, 통계 기록 생략');
      return;
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 한국 시간 기준 오늘 날짜
    const kstDate = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
    );
    const today = kstDate.toISOString().split('T')[0];
    
    console.log(`[Stats] 기록 중: ${partnerId} / ${today}`);
    
    // 카운터 증가 (원자적)
    const { error } = await supabase.rpc('increment_mylink_count', {
      p_partner_id: partnerId,
      p_date: today
    });
    
    if (error) {
      console.error('[Stats] 기록 실패:', error.message);
    } else {
      console.log('[Stats] ✅ 기록 완료');
    }
  } catch (err: any) {
    console.error('[Stats] 예외 발생:', err.message);
    // 통계 실패해도 무시 (사용자 응답에 영향 없음)
  }
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
    
    // 🎯 로컬 프록시 사용 (터널링을 통한 로컬 PC 접근)
    const proxyUrl = process.env.PROXY_URL;
    
    // 🔍 디버깅: 환경변수 출력
    console.log(`[Vercel] PROXY_URL 환경변수: ${proxyUrl || 'NOT SET'}`);
    console.log(`[Vercel] PROXY 관련 환경변수: ${Object.keys(process.env).filter(k => k.includes('PROXY')).join(', ')}`);
    
    if (proxyUrl) {
      console.log(`[Vercel] ✅ 로컬 프록시 사용: ${proxyUrl}/mylink`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8초 타임아웃 (Vercel 10초 제한 고려)
        
        const proxyResponse = await fetch(`${proxyUrl}/mylink`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            "User-Agent": "LuckyGlide-Vercel/1.0"
          },
          body: JSON.stringify({ targetUrl, partnerId }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const data = await proxyResponse.json();
        
        console.log(`[Vercel] 로컬 프록시 응답: ${proxyResponse.status}`);
        
        // 📊 성공 시 통계 기록 (비동기, 실패해도 무시)
        if (proxyResponse.ok) {
          recordStats(partnerId).catch(() => {});
        }
        
        return json(data, proxyResponse.status);
      } catch (error: any) {
        console.error('[Vercel] 로컬 프록시 오류:', error.message);
        return json({ 
          error: "Local proxy unavailable",
          details: error.message,
          hint: "로컬 프록시 서버와 터널링 도구가 실행 중인지 확인하세요"
        }, 503);
      }
    }
    
    // ⚠️ 프록시 없음: 직접 호출 (로컬 VPN 환경 필요)
    console.log('[Vercel] ⚠️ PROXY_URL 미설정! 직접 호출 시도');
    
    // 파트너별 API 키 가져오기
    const apiKeyEnvName = `MRT_PARTNER_API_KEY_${partnerId}`;
    const apiKey = process.env[apiKeyEnvName];
    
    if (!apiKey) {
      return json({ error: `API key not found for partner: ${partnerId}` }, 500);
    }
    
    // 마이링크 생성 API 호출 (재시도 로직 포함)
    const apiUrl = "https://partner-ext-api.myrealtrip.com/v1/mylink";
    const maxRetries = 2; // 최대 2회 재시도
    const timeoutPerAttempt = 4000; // 각 시도당 4초 타임아웃
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutPerAttempt);
      
      try {
        const startTime = Date.now();
        const upstream = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Connection": "keep-alive",
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
          
          // 📊 성공 시 통계 기록 (비동기, 실패해도 무시)
          recordStats(partnerId).catch(() => {});
          
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
