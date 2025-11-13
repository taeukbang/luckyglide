export const config = { runtime: "edge" };

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
}
function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}

let ACCESS_TOKEN: string | null = null;
let ACCESS_EXP: number | null = null; // epoch seconds

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
    const decoded = atob(base64 + pad);
    const obj = JSON.parse(decoded);
    const exp = Number(obj?.exp);
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<{ token: string; exp: number | null }> {
  const refreshToken = process.env.MRT_PARTNER_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("MRT_PARTNER_REFRESH_TOKEN is not set");
  const url = "https://api3.myrealtrip.com/authentication/v3/partner/token/refresh";
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Partner refresh error: ${r.status} ${text}`);
  }
  const data = await r.json().catch(() => ({}));
  const token = data?.data?.accessToken as string | undefined;
  if (!token) throw new Error("Partner refresh error: accessToken missing");
  const exp = decodeJwtExp(token);
  ACCESS_TOKEN = token;
  ACCESS_EXP = exp;
  return { token, exp };
}

async function ensureAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = ACCESS_EXP ?? 0;
  if (!ACCESS_TOKEN || !exp || exp - now <= 60) {
    const { token } = await refreshAccessToken();
    return token;
  }
  return ACCESS_TOKEN;
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    if (!process.env.MRT_PARTNER_REFRESH_TOKEN) {
      return json({ ok: false, error: "MRT_PARTNER_REFRESH_TOKEN missing" }, 500);
    }
    const token = await ensureAccessToken();
    const exp = ACCESS_EXP ?? null;
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresInSec = exp ? Math.max(0, exp - nowSec) : null;
    return json({
      ok: true,
      exp,
      expiresInSec,
      preview: token.slice(0, 12) + "...",
    });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "internal error" }, 500);
  }
}


