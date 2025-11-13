export const config = { runtime: "edge" };

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
}
function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const rawRefresh = process.env.MRT_PARTNER_REFRESH_TOKEN || "";
    const trimmed = rawRefresh.trim().replace(/^"+|"+$/g, "");
    const hasRefreshToken = trimmed.length > 0;
    const refreshTokenLen = trimmed.length;
    const rawClientId = process.env.MRT_PARTNER_CLIENT_ID || "";
    const clientId = rawClientId.trim().replace(/^"+|"+$/g, "");
    const hasClientId = clientId.length > 0;
    const clientIdLen = clientId.length;
    return json({
      ok: true,
      runtime: "edge",
      hasRefreshToken,
      refreshTokenLen: hasRefreshToken ? refreshTokenLen : 0,
      hasClientId,
      clientIdLen: hasClientId ? clientIdLen : 0,
    });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "internal error" }, 500);
  }
}


