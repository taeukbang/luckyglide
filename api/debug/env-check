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
    ),
    note: "연결 테스트는 하지 않음 (빠른 응답을 위해)"
  };
  
  return json(debugInfo);
}
