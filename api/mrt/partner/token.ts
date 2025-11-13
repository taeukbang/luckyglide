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
  const refreshToken = (process.env.MRT_PARTNER_REFRESH_TOKEN || "").trim().replace(/^"+|"+$/g, "");
  if (!refreshToken) throw new Error("MRT_PARTNER_REFRESH_TOKEN is not set");
  const url = "https://api3.myrealtrip.com/authentication/v3/partner/token/refresh";
  const clientId = (process.env.MRT_PARTNER_CLIENT_ID || "").trim();
  const attempts = [
    { refreshToken, ...(clientId ? { clientId } : {}) },
    { refresh_token: refreshToken, ...(clientId ? { client_id: clientId } : {}) },
  ];
  let token: string | undefined;
  let lastStatus = 0;
  let lastText = "";
  for (const payload of attempts) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    lastStatus = r.status;
    lastText = await r.text().catch(() => "");
    if (!r.ok) continue;
    try {
      const data = JSON.parse(lastText);
      token = (data?.data?.accessToken ?? data?.accessToken) as string | undefined;
      if (token) break;
    } catch {}
  }
  if (!token) throw new Error("Partner refresh error: accessToken missing");
  const exp = decodeJwtExp(token);
  ACCESS_TOKEN = token;
  ACCESS_EXP = exp;
  return { token, exp };
}

type AttemptResult = {
  payloadUsed: "refreshToken" | "refresh_token";
  clientIdIncluded: boolean;
  status: number;
  body: string;
  ok: boolean;
  token?: string;
  exp?: number | null;
};

async function doAttempt(url: string, payload: any, used: AttemptResult["payloadUsed"], incl: boolean): Promise<AttemptResult> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8", "Accept": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await r.text().catch(() => "");
  let token: string | undefined;
  let exp: number | null | undefined;
  try {
    const data = JSON.parse(text);
    token = (data?.data?.accessToken ?? data?.accessToken) as string | undefined;
    if (token) exp = decodeJwtExp(token);
  } catch {}
  return { payloadUsed: used, clientIdIncluded: incl, status: r.status, body: text.slice(0, 4000), ok: !!token, token, exp: exp ?? null };
}

async function doAttemptForm(url: string, form: URLSearchParams, used: AttemptResult["payloadUsed"], incl: boolean): Promise<AttemptResult> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "Accept": "application/json" },
    body: form.toString(),
  });
  const text = await r.text().catch(() => "");
  let token: string | undefined;
  let exp: number | null | undefined;
  try {
    const data = JSON.parse(text);
    token = (data?.data?.accessToken ?? data?.accessToken) as string | undefined;
    if (token) exp = decodeJwtExp(token);
  } catch {}
  return { payloadUsed: used, clientIdIncluded: incl, status: r.status, body: text.slice(0, 4000), ok: !!token, token, exp: exp ?? null };
}

async function refreshAccessTokenWithRaw(): Promise<{ token?: string; exp?: number | null; upstreamStatus: number; upstreamBody: string; payloadUsed?: "refreshToken" | "refresh_token"; clientIdIncluded?: boolean; attempts: AttemptResult[] }> {
  const refreshToken = (process.env.MRT_PARTNER_REFRESH_TOKEN || "").trim().replace(/^"+|"+$/g, "");
  if (!refreshToken) throw new Error("MRT_PARTNER_REFRESH_TOKEN is not set");
  const url = "https://api3.myrealtrip.com/authentication/v3/partner/token/refresh";
  const clientId = (process.env.MRT_PARTNER_CLIENT_ID || "").trim();
  const attempt1Payload = { refreshToken, ...(clientId ? { clientId } : {}) };
  const attempt2Payload = { refresh_token: refreshToken, ...(clientId ? { client_id: clientId } : {}) };
  const a1 = await doAttempt(url, attempt1Payload, "refreshToken", !!clientId);
  if (a1.ok && a1.token) {
    ACCESS_TOKEN = a1.token;
    ACCESS_EXP = a1.exp ?? null;
    return { token: a1.token, exp: a1.exp ?? null, upstreamStatus: a1.status, upstreamBody: a1.body, payloadUsed: a1.payloadUsed, clientIdIncluded: a1.clientIdIncluded, attempts: [a1] };
  }
  const a2 = await doAttempt(url, attempt2Payload, "refresh_token", !!clientId);
  if (a2.ok && a2.token) {
    ACCESS_TOKEN = a2.token;
    ACCESS_EXP = a2.exp ?? null;
    return { token: a2.token, exp: a2.exp ?? null, upstreamStatus: a2.status, upstreamBody: a2.body, payloadUsed: a2.payloadUsed, clientIdIncluded: a2.clientIdIncluded, attempts: [a1, a2] };
  }
  // Fallback: form-urlencoded camel
  const form1 = new URLSearchParams();
  form1.set("refreshToken", refreshToken);
  if (clientId) form1.set("clientId", clientId);
  const a3 = await doAttemptForm(url, form1, "refreshToken", !!clientId);
  if (a3.ok && a3.token) {
    ACCESS_TOKEN = a3.token;
    ACCESS_EXP = a3.exp ?? null;
    return { token: a3.token, exp: a3.exp ?? null, upstreamStatus: a3.status, upstreamBody: a3.body, payloadUsed: a3.payloadUsed, clientIdIncluded: a3.clientIdIncluded, attempts: [a1, a2, a3] };
  }
  // Fallback: form-urlencoded snake
  const form2 = new URLSearchParams();
  form2.set("refreshToken", refreshToken); // also keep camel in case backend maps both
  form2.set("refresh_token", refreshToken);
  if (clientId) {
    form2.set("clientId", clientId);
    form2.set("client_id", clientId);
  }
  const a4 = await doAttemptForm(url, form2, "refresh_token", !!clientId);
  if (a4.ok && a4.token) {
    ACCESS_TOKEN = a4.token;
    ACCESS_EXP = a4.exp ?? null;
    return { token: a4.token, exp: a4.exp ?? null, upstreamStatus: a4.status, upstreamBody: a4.body, payloadUsed: a4.payloadUsed, clientIdIncluded: a4.clientIdIncluded, attempts: [a1, a2, a3, a4] };
  }
  // Return last attempt info, include attempts array
  const last = a4;
  return { upstreamStatus: last.status, upstreamBody: last.body, payloadUsed: last.payloadUsed, clientIdIncluded: last.clientIdIncluded, attempts: [a1, a2, a3, a4] };
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
    const { searchParams } = new URL(req.url);
    const debug = searchParams.get("debug") === "1" || searchParams.get("refresh") === "1";
    if (debug) {
      const r = await refreshAccessTokenWithRaw();
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = r.exp ?? ACCESS_EXP ?? null;
      const expiresInSec = exp ? Math.max(0, exp - nowSec) : null;
      return json({
        ok: !!r.token,
        exp,
        expiresInSec,
        preview: r.token ? r.token.slice(0, 12) + "..." : null,
        upstream: { status: r.upstreamStatus, body: r.upstreamBody },
        meta: { payloadUsed: r.payloadUsed ?? null, clientIdIncluded: r.clientIdIncluded ?? false },
        attempts: r.attempts ?? [],
      });
    } else {
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
    }
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "internal error" }, 500);
  }
}


