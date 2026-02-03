export const config = { 
  runtime: "nodejs",
};

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { 
    status, 
    headers: { "content-type": "application/json" } 
  });
}

export default async function handler(req: Request): Promise<Response> {
  const proxyUrl = process.env.PROXY_URL;
  
  const debugInfo = {
    proxyUrl: proxyUrl || "❌ NOT SET",
    proxyUrlExists: !!proxyUrl,
    timestamp: new Date().toISOString(),
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('PROXY') || k.includes('MRT')
    )
  };
  
  // PROXY_URL이 설정되어 있으면 실제 연결 테스트
  if (proxyUrl) {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const testResponse = await fetch(`${proxyUrl}/health`, {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "LuckyGlide-Debug/1.0"
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      
      const healthData = await testResponse.text();
      
      return json({
        ...debugInfo,
        connectionTest: {
          success: testResponse.ok,
          status: testResponse.status,
          elapsed: `${elapsed}ms`,
          response: healthData.substring(0, 200)
        }
      });
    } catch (error: any) {
      return json({
        ...debugInfo,
        connectionTest: {
          success: false,
          error: error.message,
          errorName: error.name
        }
      });
    }
  }
  
  return json(debugInfo);
}
