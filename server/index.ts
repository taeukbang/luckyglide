import express from "express";
import cors from "cors";
import { fetchCalendar, pickMinEntry } from "./myrealtrip";
import { scanAndStore } from "./scan";
import { ENRICHED_DESTINATIONS as DESTINATIONS } from "./cities";
import { supabase, hasSupabase } from "./supabase";
import { fetchCalendar as fetchCal } from "./myrealtrip";

const app = express();
app.use(cors());
app.use(express.json());

// ---- MRT Partner access token cache/helpers ----
let MRT_PARTNER_ACCESS_TOKEN: string | null = null;
let MRT_PARTNER_ACCESS_EXP: number | null = null; // epoch seconds

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadRaw = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const json = Buffer.from(payloadRaw, "base64").toString("utf8");
    const obj = JSON.parse(json);
    const exp = Number(obj?.exp);
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

async function refreshPartnerAccessToken(): Promise<{ token: string; exp: number | null }> {
  const refreshToken = (process.env.MRT_PARTNER_REFRESH_TOKEN || "").trim().replace(/^"+|"+$/g, "");
  if (!refreshToken) {
    throw new Error("MRT_PARTNER_REFRESH_TOKEN is not set");
  }
  const url = "https://api3.myrealtrip.com/authentication/v3/partner/token/refresh";
  const clientId = (process.env.MRT_PARTNER_CLIENT_ID || "").trim();
  // Try preferred payload then fallback to snake_case key
  const attempts = [
    { refreshToken, ...(clientId ? { clientId } : {}) },
    { refresh_token: refreshToken, ...(clientId ? { client_id: clientId } : {}) },
  ];
  let token: string | undefined;
  let lastStatus = 0;
  let lastText = "";
  for (const payload of attempts) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    lastStatus = res.status;
    lastText = await res.text().catch(() => "");
    if (!res.ok) continue;
    try {
      const data = JSON.parse(lastText);
      token = (data?.data?.accessToken ?? data?.accessToken) as string | undefined;
      if (token) break;
    } catch {}
  }
  if (!token) throw new Error(`Partner refresh error: accessToken missing (last ${lastStatus} ${lastText?.slice(0, 500)})`);
  const exp = decodeJwtExp(token);
  MRT_PARTNER_ACCESS_TOKEN = token;
  MRT_PARTNER_ACCESS_EXP = exp;
  return { token, exp };
}

async function refreshPartnerAccessTokenWithRaw(): Promise<{ token?: string; exp?: number | null; upstreamStatus: number; upstreamBody: string }> {
  const refreshToken = (process.env.MRT_PARTNER_REFRESH_TOKEN || "").trim().replace(/^"+|"+$/g, "");
  if (!refreshToken) {
    throw new Error("MRT_PARTNER_REFRESH_TOKEN is not set");
  }
  const url = "https://api3.myrealtrip.com/authentication/v3/partner/token/refresh";
  const clientId = (process.env.MRT_PARTNER_CLIENT_ID || "").trim();
  const attempts = [
    { refreshToken, ...(clientId ? { clientId } : {}) },
    { refresh_token: refreshToken, ...(clientId ? { client_id: clientId } : {}) },
  ];
  for (const payload of attempts) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text().catch(() => "");
    try {
      const data = JSON.parse(text);
      const token = (data?.data?.accessToken ?? data?.accessToken) as string | undefined;
      if (token) {
        const exp = decodeJwtExp(token);
        MRT_PARTNER_ACCESS_TOKEN = token;
        MRT_PARTNER_ACCESS_EXP = exp;
        return { token, exp, upstreamStatus: res.status, upstreamBody: text.slice(0, 4000) };
      }
    } catch {}
    // if first attempt failed, return last upstream
    if (payload === attempts[attempts.length - 1]) {
      return { upstreamStatus: res.status, upstreamBody: text.slice(0, 4000) };
    }
    // else continue loop to next attempt
  }
  return { upstreamStatus: 0, upstreamBody: "no-attempts" };
}

async function ensurePartnerAccessToken(): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = MRT_PARTNER_ACCESS_EXP ?? 0;
  // refresh if missing or expiring in <= 60s
  if (!MRT_PARTNER_ACCESS_TOKEN || !exp || exp - nowSec <= 60) {
    const { token } = await refreshPartnerAccessToken();
    return token;
  }
  return MRT_PARTNER_ACCESS_TOKEN;
}

// Step debug/status: ensure token and return expiry (masked; token not exposed)
app.get("/api/mrt/partner/token", async (req, res) => {
  try {
    if (!process.env.MRT_PARTNER_REFRESH_TOKEN) {
      return res.status(500).json({ ok: false, error: "MRT_PARTNER_REFRESH_TOKEN missing" });
    }
    const debug = String(req.query.debug ?? "") === "1" || String(req.query.refresh ?? "") === "1";
    if (debug) {
      const r = await refreshPartnerAccessTokenWithRaw();
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = r.exp ?? MRT_PARTNER_ACCESS_EXP ?? null;
      const expiresInSec = exp ? Math.max(0, exp - nowSec) : null;
      return res.json({
        ok: !!r.token,
        exp,
        expiresInSec,
        preview: r.token ? r.token.slice(0, 12) + "..." : null,
        upstream: { status: r.upstreamStatus, body: r.upstreamBody },
      });
    } else {
      const token = await ensurePartnerAccessToken();
      const exp = MRT_PARTNER_ACCESS_EXP ?? null;
      const nowSec = Math.floor(Date.now() / 1000);
      const expiresInSec = exp ? Math.max(0, exp - nowSec) : null;
      res.json({
        ok: true,
        exp,
        expiresInSec,
        // reveal only short prefix for debug
        preview: token.slice(0, 12) + "...",
      });
    }
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? "internal error" });
  }
});

// Issue partner landing URL (마이링크)
// body: { depAirportCd, depDate, arrAirportCd, arrDate, tripTypeCd?: "OW"|"RT" }
app.post("/api/mrt/partner/landing-url", async (req, res) => {
  try {
    const { depAirportCd, depDate, arrAirportCd, arrDate, tripTypeCd } = req.body || {};
    if (!depAirportCd || !arrAirportCd || !depDate) {
      return res.status(400).json({ error: "depAirportCd, arrAirportCd, depDate are required" });
    }
    if (!process.env.MRT_PARTNER_REFRESH_TOKEN) {
      return res.status(500).json({ error: "MRT_PARTNER_REFRESH_TOKEN missing" });
    }
    const token = await ensurePartnerAccessToken();
    const url = "https://api3.myrealtrip.com/flight/api/partner/shopping/fare/query-landing-url";
    const payload: any = {
      depAirportCd: String(depAirportCd),
      depDate: String(depDate),
      arrAirportCd: String(arrAirportCd),
      tripTypeCd: (tripTypeCd === "OW" || tripTypeCd === "RT")
        ? tripTypeCd
        : (arrDate && String(arrDate) !== String(depDate) ? "RT" : "OW"),
    };
    if (arrDate) payload.arrDate = String(arrDate);
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "partner-access-token": token,
      },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(502).json({ error: `landing-url error ${upstream.status}`, body: text });
    }
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      return res.status(502).json({ error: "invalid upstream json", body: text });
    }
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

app.get("/api/calendar", async (req, res) => {
  try {
    const from = String(req.query.from ?? "");
    const to = String(req.query.to ?? "");
    const departureDate = String(req.query.date ?? "");
    const period = Number(req.query.period ?? 30);
    const transfer = Number(req.query.transfer ?? -1);
    const international = String(req.query.international ?? "true") === "true";
    const airlines = (String(req.query.airlines ?? "All")).split(",").filter(Boolean);

    if (!from || !to || !departureDate) {
      return res.status(400).json({ error: "from, to, date are required" });
    }

    const payload = { from, to, departureDate, period, transfer, international, airlines };
    const data = await fetchCalendar(payload);
    res.json({ ...data, min: pickMinEntry(data) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

app.post("/api/calendar", async (req, res) => {
  try {
    const data = await fetchCalendar(req.body);
    res.json({ ...data, min: pickMinEntry(data) });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

app.post("/api/scan", async (req, res) => {
  try {
    const { from, to, transfer: bodyTransfer } = req.body || {};
    // Allow querystring fallback for easier triggering: /api/scan?from=ICN&to=FUK
    const fromQ = String((req.query.from as string | undefined) ?? from ?? "");
    const toQ = String((req.query.to as string | undefined) ?? to ?? "");
    const transferQ = Number((req.query.transfer as string | undefined) ?? (bodyTransfer ?? -1));
    const now = new Date();
    now.setDate(now.getDate() + 1); // 내일
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // 단일 목적지만 빠르게 스캔 (기본 14일 윈도우)
    const result = await scanAndStore({
      from: fromQ,
      to: toQ,
      startDate,
      days: 14,
      minTripDays: 3,
      maxTripDays: 7,
      transfer: transferQ,
    });
    res.json({ ok: true, ...result });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

app.post("/api/scan-all", async (req, res) => {
  try {
    const { from = "ICN", regions, codes, transfer = -1 } = req.body || {} as { from?: string; regions?: string[]; codes?: string[]; transfer?: number };
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let targets = DESTINATIONS;
    if (Array.isArray(regions) && regions.length) {
      targets = targets.filter((c) => regions.includes(c.region));
    }
    if (Array.isArray(codes) && codes.length) {
      targets = targets.filter((c) => codes.includes(c.code));
    }

    let total = 0;
    for (const city of targets) {
      const r = await scanAndStore({
        from,
        to: city.code,
        startDate,
        days: 30,
        minTripDays: 3,
        maxTripDays: 7,
        transfer,
      });
      total += r.rows;
    }
    res.json({ routes: targets.length, rows: total, regions: regions ?? null, codes: codes ?? null, transfer });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

app.get("/api/destinations", (req, res) => {
  const regions = Array.from(new Set(DESTINATIONS.map((d) => d.region)));
  res.json({ regions, destinations: DESTINATIONS });
});

app.get("/api/latest", async (req, res) => {
  try {
    const from = String(req.query.from ?? "ICN");
    const region = req.query.region ? String(req.query.region) : null;
    const codesParam = req.query.codes ? String(req.query.codes) : "";
    const trRaw = (req.query.transfer as any);
    const transfer = (String(trRaw) === "0" || Number(trRaw) === 0) ? 0 : -1;
    const tdRaw = req.query.tripDays as any;
    const tripDaysFilter = tdRaw !== undefined && tdRaw !== null && tdRaw !== '' && !Number.isNaN(Number(tdRaw)) ? Number(tdRaw) : null;

    // 대상 도시: 지역이 지정되면 해당 지역만, "모두" 또는 미지정이면 전체
    let targets = DESTINATIONS;
    if (region && region !== "모두") {
      targets = targets.filter((d) => d.region === region);
    }
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      if (set.size > 0) {
        targets = targets.filter((d) => set.has(d.code));
      }
    }
    const codes = targets.map((d) => d.code);

    if (!hasSupabase) {
      return res.status(500).json({ error: "Supabase env missing" });
    }

    // 병렬 쿼리 실행: extrema, recent, baseline을 동시에 조회
    const [extremaResult, recentResult, baselineResult] = await Promise.all([
      // 1. extrema 쿼리 (최저가/최고가)
      (async () => {
        if (tripDaysFilter != null) {
          const { data, error } = await supabase
            .from("fares_city_extrema_tripdays")
            .select("from,to,departure_date,return_date,trip_days,min_price,max_price,min_airline,collected_at,transfer_filter")
            .eq("from", from)
            .in("to", codes)
            .eq("transfer_filter", transfer)
            .eq("trip_days", tripDaysFilter);
          if (error) throw error;
          return data ?? [];
        } else {
          // 전역(extrema view) 사용
          const view = transfer === 0 ? "fares_city_extrema_direct" : "fares_city_extrema";
          const { data, error } = await supabase
            .from(view)
            .select("from,to,departure_date,return_date,trip_days,min_price,max_price,min_airline,collected_at")
            .eq("from", from)
            .in("to", codes);
          if (error) throw error;
          return data ?? [];
        }
      })(),
      
      // 2. 최근 수집 시점 쿼리
      (async () => {
        let qRecent = supabase
          .from("fares")
          .select("to,collected_at")
          .eq("from", from)
          .in("to", codes)
          .eq("transfer_filter", transfer)
          .eq("is_latest", true)
          .order("collected_at", { ascending: false });
        if (tripDaysFilter) qRecent = (qRecent as any).eq("trip_days", tripDaysFilter);
        const { data: recentRows, error: errRecent } = await qRecent as any;
        if (errRecent) throw errRecent;
        return recentRows ?? [];
      })(),
      
      // 3. baseline 쿼리 (통계/badge 계산용)
      (async () => {
        const baselineView = transfer === 0 ? "fares_baseline_direct" : "fares_baseline_all";
        const { data: baseRows, error: errBase } = await supabase
          .from(baselineView)
          .select("from,to,sample_rows,p50_price,p25_price,p10_price,p05_price,p01_price")
          .eq("from", from)
          .in("to", codes);
        if (errBase) throw errBase;
        return baseRows ?? [];
      })()
    ]);

    const extrema = extremaResult;
    const recentRows = recentResult;
    const byTo = new Map<string, any>((extrema ?? []).map((r: any) => [r.to, r]));
    const baseByTo = new Map<string, any>((baselineResult ?? []).map((r: any) => [r.to, r]));
    const latestCollectedByTo = new Map<string, string>();
    for (const row of (recentRows ?? [])) {
      if (!latestCollectedByTo.has(row.to)) {
        latestCollectedByTo.set(row.to, row.collected_at as any);
      }
    }
    const itemsOut = targets.map((t) => {
      const r = byTo.get(t.code);
      const lastCollected = latestCollectedByTo.get(t.code) ?? r?.collected_at ?? null;
      // badge computation (transfer scope aware) - simplified: only isGood
      let meta: any = {};
      if (r) {
        const b = baseByTo?.get(t.code);
        const n = Number(b?.sample_rows || 0);
        const price = (r?.min_price !== null && r?.min_price !== undefined) ? Number(r.min_price) : null;
        const p10 = b?.p10_price != null ? Number(b.p10_price) : null;
        const MIN_SAMPLE = 50;
        const isGood = (typeof price === 'number' && typeof p10 === 'number' && n >= MIN_SAMPLE && price <= p10 * 0.70);
        const baseline = n ? { p10, sample: n, scope: (transfer === 0 ? 'direct' : 'all') } : null;
        meta = { ...(r?.trip_days ? { tripDays: Number(r.trip_days) } : {}), baseline, isGood };
      }
      return {
        code: t.code,
        city: t.nameKo,
        region: t.region,
        country: (t as any).country ?? null,
        countryCode: (t as any).countryCode ?? null,
        price: r?.min_price !== null && r?.min_price !== undefined ? Number(r.min_price) : null,
        originalPrice: r?.max_price !== null && r?.max_price !== undefined ? Number(r.max_price) : null,
        tripDays: r?.trip_days !== null && r?.trip_days !== undefined ? Number(r.trip_days) : null,
        departureDate: r?.departure_date ?? null,
        returnDate: r?.return_date ?? null,
        airline: r?.min_airline ?? null,
        collectedAt: lastCollected,
        meta,
      };
    });

    return res.json({ count: itemsOut.length, items: itemsOut });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

// In-memory cache for live latest endpoint
type LiveItem = {
  code: string;
  city: string;
  region: string;
  price: number | null;
  originalPrice: number | null;
  departureDate: string | null;
  returnDate: string | null;
  airline: string | null;
  tripDays: number | null;
};

const liveCache = new Map<string, { ts: number; items: LiveItem[] }>();
const LIVE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function formatIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function pLimit(concurrency: number) {
  let activeCount = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (activeCount >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    activeCount++;
    job();
  };
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try { resolve(await fn()); }
        catch (e) { reject(e); }
        finally {
          activeCount--;
          next();
        }
      };
      queue.push(task);
      next();
    });
  };
}

// Live latest: compute per-destination best price by calling MRT calendar API directly (no DB)
app.get("/api/latest-live", async (req, res) => {
  try {
    const from = String(req.query.from ?? "ICN");
    const region = req.query.region ? String(req.query.region) : null;
    const codesParam = req.query.codes ? String(req.query.codes) : "";
    const days = Number(req.query.days ?? 30);
    const minTripDays = Number(req.query.minTripDays ?? 3);
    const maxTripDays = Number(req.query.maxTripDays ?? 7);
    const concurrency = Math.max(1, Number(req.query.concurrency ?? 16));

    let targets = DESTINATIONS;
    if (region && region !== "모두") {
      targets = targets.filter((d) => d.region === region);
    }
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      targets = targets.filter((d) => set.has(d.code));
    }

    const cacheKey = `${from}|${region ?? "all"}|${codesParam}|${days}|${minTripDays}-${maxTripDays}`;
    const cached = liveCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.ts < LIVE_TTL_MS) {
      return res.json({ count: cached.items.length, items: cached.items, cached: true });
    }

    const base = new Date();
    base.setDate(base.getDate() + 1); // tomorrow

    const limit = pLimit(concurrency);

    const results: LiveItem[] = await Promise.all(targets.map((t) =>
      limit(async () => {
        let best: { price: number; date: string; airline: string; len: number } | null = null;
        let worstPrice: number | null = null;

        for (let len = minTripDays; len <= maxTripDays; len++) {
          for (let i = 0; i < days; i++) {
            const dep = new Date(base);
            dep.setDate(dep.getDate() + i);
            const depStr = formatIso(dep);
            const data = await fetchCal({ from, to: t.code, departureDate: depStr, period: len, transfer: -1, international: true, airlines: ["All"] });
            const slice = data.flightCalendarInfoResults?.slice(0, Math.max(len, 1)) ?? [];
            if (!slice.length) continue;
            // pick min within this departure window
            const localMin = slice.reduce((acc: any, cur: any) => (acc && acc.price <= cur.price ? acc : cur));
            if (localMin) {
              const p = Number(localMin.price);
              if (!Number.isNaN(p)) {
                if (!best || p < best.price) {
                  best = { price: p, date: String(localMin.date), airline: String(localMin.airline ?? ""), len };
                }
                worstPrice = worstPrice === null ? p : Math.max(worstPrice, p);
              }
            }
          }
        }

        if (!best) {
          return {
            code: t.code,
            city: t.nameKo,
            region: t.region,
            price: null,
            originalPrice: null,
            departureDate: null,
            returnDate: null,
            airline: null,
            tripDays: null,
          } as LiveItem;
        }

        const depIso = best.date;
        const ret = new Date(depIso);
        ret.setDate(ret.getDate() + (best.len - 1));
        const retIso = formatIso(ret);

        return {
          code: t.code,
          city: t.nameKo,
          region: t.region,
          price: best.price,
          originalPrice: worstPrice,
          departureDate: depIso,
          returnDate: retIso,
          airline: best.airline || null,
          tripDays: best.len,
        } as LiveItem;
      })
    ));

    liveCache.set(cacheKey, { ts: now, items: results });
    res.json({ count: results.length, items: results, cached: false });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

// Debug: inspect raw fares rows for a destination (helps diagnose "가격 준비중")
app.get("/api/debug/fares", async (req, res) => {
  try {
    const from = String(req.query.from ?? "ICN");
    const to = String(req.query.to ?? "");
    const limit = Number(req.query.limit ?? 20);
    if (!to) return res.status(400).json({ error: "to is required" });
    if (!hasSupabase) return res.status(500).json({ error: "Supabase env missing" });
    const { data, error } = await supabase
      .from("fares")
      .select("from,to,departure_date,return_date,trip_days,min_price,min_airline,collected_at")
      .eq("from", from)
      .eq("to", to)
      .order("collected_at", { ascending: false })
      .limit(Math.max(1, limit));
    if (error) throw error;
    res.json({ count: data?.length ?? 0, items: data ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

// Compute calendar for a specific trip duration (naive per-day scan)
// body: { from, to, startDate?: YYYY-MM-DD (default: tomorrow), days?: number (default 30), tripDays: number }
app.post("/api/calendar-window", async (req, res) => {
  try {
    const { from = "ICN", to, startDate, days = 30, tripDays = 3, airlines = ["All"], transfer = -1, international = true } = req.body || {};
    if (!to) return res.status(400).json({ error: "to is required" });
    const base = startDate ? new Date(startDate) : new Date();
    if (!startDate) base.setDate(base.getDate() + 1);

    const out: { date: string; price: number }[] = [];
    for (let i = 0; i < days; i++) {
      const dep = new Date(base);
      dep.setDate(dep.getDate() + i);
      const yyyy = dep.getFullYear();
      const mm = String(dep.getMonth() + 1).padStart(2, "0");
      const dd = String(dep.getDate()).padStart(2, "0");
      const depStr = `${yyyy}-${mm}-${dd}`;
      const data = await fetchCal({ from, to, departureDate: depStr, period: tripDays, transfer, international, airlines });
      // 창(출발일 포함 tripDays일) 내 최저가 사용 → 카드의 스캔 로직과 일치
      const slice = data.flightCalendarInfoResults?.slice(0, Math.max(tripDays, 1)) ?? [];
      const min = slice.length
        ? slice.reduce((acc: number, cur: any) => Math.min(acc, Number(cur.price)), Number.POSITIVE_INFINITY)
        : null;
      if (min !== null && Number.isFinite(min)) {
        out.push({ date: `${mm}/${dd}`, price: Number(min) });
      }
    }
    res.json({ items: out });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

// DB 기반 창 가격: 특정 체류일 tripDays로 startDate~days 동안, fares_latest(또는 최신 rows)에서 가격을 구성
// body: { from, to, startDate?: YYYY-MM-DD (default: tomorrow), days?: number (<= 180), tripDays: number }
app.post("/api/calendar-window-db", async (req, res) => {
  try {
    const { from = "ICN", to, startDate, days = 180, tripDays = 3, transfer = -1 } = req.body || {};
    if (!to) return res.status(400).json({ error: "to is required" });
    if (!hasSupabase) return res.status(500).json({ error: "Supabase env missing" });

    const base = startDate ? new Date(startDate) : new Date();
    if (!startDate) base.setDate(base.getDate() + 1);

    // 날짜 목록 구성
    const isoDates: string[] = [];
    for (let i = 0; i < Math.min(180, Number(days)); i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      isoDates.push(`${yyyy}-${mm}-${dd}`);
    }

    // 최신 스냅샷(is_latest=true)에서 해당 출발일/복귀일 정확 매칭 가격 추출
    // 주: Supabase에서 IN 절 길이 제한에 유의(분할 필요 시 분할). 여기서는 단순 구현.
    const depDates = isoDates;
    const retDates = isoDates.map((depIso) => {
      const d = new Date(depIso);
      d.setDate(d.getDate() + Math.max(1, Number(tripDays)) - 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });

    // 단순화: 출발/복귀가 각각 depDates/retDates 안에 있는 최근 is_latest=true 행을 시간순으로 가져온 뒤 매핑
    // is_latest=true 만 보지 말고, 동일 셀(departure/return/trip_days)의 '가장 최근 수집'을 사용
    const { data, error } = await supabase
      .from("fares")
      .select("departure_date, return_date, trip_days, min_price, collected_at")
      .eq("from", from)
      .eq("to", to)
      .eq("transfer_filter", transfer)
      .eq("is_latest", true)
      .in("departure_date", depDates)
      .in("return_date", retDates)
      .order("collected_at", { ascending: false })
      .order("departure_date", { ascending: true });
    if (error) throw error;

    // 동일 출발일(키: MM/DD)에 대해 가장 최근 수집 1건만 사용
    // 정확 페어 매칭 및 연도 포함 키(ISO)로 중복 제거
    const priceByDepIso = new Map<string, number>();
    for (const r of (data ?? [])) {
      const depIso = String(r.departure_date);
      const expectedRet = (() => {
        const d = new Date(depIso);
        d.setDate(d.getDate() + Math.max(1, Number(tripDays)) - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      })();
      if (String(r.return_date) !== expectedRet) continue; // 다른 체류일 행 무시
      if (priceByDepIso.has(depIso)) continue; // 최신 값만 사용
      const priceNum = (r as any).min_price !== null && (r as any).min_price !== undefined ? Number((r as any).min_price) : NaN;
      if (!Number.isNaN(priceNum)) priceByDepIso.set(depIso, priceNum);
    }

    const items = isoDates.map((depIso) => {
      const d = new Date(depIso);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      const mmdd = `${m}/${da}`;
      const p = priceByDepIso.get(depIso);
      return (p !== undefined) ? { date: mmdd, price: p } : null;
    }).filter(Boolean);

    return res.json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => console.log(`server listening on http://localhost:${PORT}`));


