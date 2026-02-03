export const config = { 
  runtime: "nodejs",
  maxDuration: 5,
};

export default async function handler(req: Request): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  
  // 환경변수 확인
  const proxyUrl = process.env.PROXY_URL;
  const allProxyKeys = Object.keys(process.env).filter(k => k.includes('PROXY'));
  
  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      proxy_url: proxyUrl || null,
      proxy_url_exists: !!proxyUrl,
      all_proxy_keys: allProxyKeys,
      env_keys_count: Object.keys(process.env).length,
    }, null, 2),
    { status: 200, headers }
  );
}
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
