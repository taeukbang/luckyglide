const BACKOFFICE = "https://api3-backoffice.myrealtrip.com";

type TokenCache = { accessToken: string | null; exp: number | null; refreshing: Promise<void> | null };
const cache: TokenCache = { accessToken: null, exp: null, refreshing: null };

function decodeExpFromJwt(token?: string | null) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decode = (b64: string) => {
      if (typeof atob === 'function') {
        // Edge/Browser
        const json = atob(b64);
        return json;
      }
      // Node
      // @ts-ignore Buffer may not exist on Edge runtime, guarded above
      return Buffer.from(b64, "base64").toString("utf8");
    };
    const payload = JSON.parse(decode(base64));
    return typeof payload?.exp === "number" ? payload.exp : null; // seconds
  } catch {
    return null;
  }
}

async function refreshAccessToken() {
  const refreshToken = process.env.MRT_PARTNER_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("MRT_PARTNER_REFRESH_TOKEN not configured");

  const res = await fetch(`${BACKOFFICE}/authentication/v3/partner/token/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "origin": "https://partner.myrealtrip.com",
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status}`);

  const data = await res.json().catch(() => ({} as any));
  const accessToken = data?.data?.accessToken ?? data?.accessToken ?? data?.token;
  if (!accessToken) throw new Error("no accessToken in refresh response");

  const expSec = decodeExpFromJwt(accessToken);
  const expMs = expSec ? expSec * 1000 : Date.now() + 50 * 60 * 1000;

  cache.accessToken = accessToken;
  cache.exp = expMs;
}

export async function getPartnerAccessToken(): Promise<string> {
  const now = Date.now();
  const safety = 90 * 1000; // 90s safety window

  if (!cache.accessToken && process.env.MRT_PARTNER_ACCESS_TOKEN) {
    cache.accessToken = process.env.MRT_PARTNER_ACCESS_TOKEN;
    const exp = decodeExpFromJwt(cache.accessToken);
    cache.exp = exp ? exp * 1000 : now + 20 * 60 * 1000;
  }

  const exp = cache.exp ?? 0;
  const needRefresh = !!process.env.MRT_PARTNER_REFRESH_TOKEN && (!cache.accessToken || exp - safety <= now);

  if (!needRefresh) return cache.accessToken as string;

  if (!cache.refreshing) {
    cache.refreshing = (async () => {
      try { await refreshAccessToken(); } finally { cache.refreshing = null; }
    })();
  }
  await cache.refreshing;

  if (!cache.accessToken) throw new Error("accessToken missing after refresh");
  return cache.accessToken;
}


