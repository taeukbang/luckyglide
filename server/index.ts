import express from "express";
import cors from "cors";
import { fetchCalendar, pickMinEntry } from "./myrealtrip";
import { scanAndStore } from "./scan";
import { DESTINATIONS } from "./cities";
import { supabase, hasSupabase } from "./supabase";
import { fetchCalendar as fetchCal } from "./myrealtrip";

const app = express();
app.use(cors());
app.use(express.json());

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
    const { from, to } = req.body || {};
    // Allow querystring fallback for easier triggering: /api/scan?from=ICN&to=FUK
    const fromQ = String((req.query.from as string | undefined) ?? from ?? "");
    const toQ = String((req.query.to as string | undefined) ?? to ?? "");
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
    });
    res.json({ ok: true, ...result });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "internal error" });
  }
});

app.post("/api/scan-all", async (req, res) => {
  try {
    const { from = "ICN", regions, codes } = req.body || {} as { from?: string; regions?: string[]; codes?: string[] };
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
      });
      total += r.rows;
    }
    res.json({ routes: targets.length, rows: total, regions: regions ?? null, codes: codes ?? null });
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

    // 단일 로직: fares_city_extrema에서 (from,to)별 최저가 행 반환
    const { data: extrema, error: errExt } = await supabase
      .from("fares_city_extrema")
      .select("from,to,departure_date,return_date,trip_days,min_price,max_price,min_airline,collected_at")
      .eq("from", from)
      .in("to", codes);
    if (errExt) throw errExt;

    const byTo = new Map<string, any>((extrema ?? []).map((r: any) => [r.to, r]));
    const itemsOut = targets.map((t) => {
      const r = byTo.get(t.code);
      return {
        code: t.code,
        city: t.nameKo,
        region: t.region,
        country: null,
        countryCode: null,
        price: r?.min_price !== null && r?.min_price !== undefined ? Number(r.min_price) : null,
        originalPrice: r?.max_price !== null && r?.max_price !== undefined ? Number(r.max_price) : null,
        tripDays: r?.trip_days !== null && r?.trip_days !== undefined ? Number(r.trip_days) : null,
        departureDate: r?.departure_date ?? null,
        returnDate: r?.return_date ?? null,
        airline: r?.min_airline ?? null,
        collectedAt: r?.collected_at ?? null,
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
    const concurrency = Math.max(1, Number(req.query.concurrency ?? 4));

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

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => console.log(`server listening on http://localhost:${PORT}`));


