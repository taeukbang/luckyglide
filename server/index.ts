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

    // tripDays 지정 시: tripDays별 최저가를 직접 계산 (전역 extrema는 trip_days 혼합이라 필터 시 결과가 비는 문제 방지)
    let extrema: any[] | null = null;
    if (tripDaysFilter != null) {
      const { data: rows, error } = await supabase
        .from("fares")
        .select("to, trip_days, min_price, min_airline, departure_date, return_date, collected_at")
        .eq("from", from)
        .in("to", codes)
        .eq("transfer_filter", transfer)
        .eq("is_latest", true)
        .eq("trip_days", tripDaysFilter)
        .order("min_price", { ascending: true })
        .order("collected_at", { ascending: false });
      if (error) throw error;
      // to별 최저가 1행만 선택
      const seen = new Set<string>();
      extrema = [];
      for (const r of rows ?? []) {
        if (!seen.has(r.to)) { extrema.push(r); seen.add(r.to); }
      }
    } else {
      // 전역(extrema view) 사용
      const view = transfer === 0 ? "fares_city_extrema_direct" : "fares_city_extrema";
      const { data, error } = await supabase
        .from(view)
        .select("from,to,departure_date,return_date,trip_days,min_price,max_price,min_airline,collected_at")
        .eq("from", from)
        .in("to", codes);
      if (error) throw error;
      extrema = data ?? [];
    }
    

    // 최근 수집 시점(해당 목적지의 latest rows 중 최대 collected_at)
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

    const byTo = new Map<string, any>((extrema ?? []).map((r: any) => [r.to, r]));

    // Optional: baseline join to compute badges (direct or all)
    let baseByTo: Map<string, any> | null = null;
    {
      const baselineView = transfer === 0 ? "fares_baseline_direct" : "fares_baseline_all";
      const { data: baseRows, error: errBase } = await supabase
        .from(baselineView)
        .select("from,to,sample_rows,p50_price,p25_price,p10_price,p05_price,p01_price")
        .eq("from", from)
        .in("to", codes);
      if (errBase) throw errBase;
      baseByTo = new Map<string, any>((baseRows ?? []).map((r: any) => [r.to, r]));
    }
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
        country: null,
        countryCode: null,
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


