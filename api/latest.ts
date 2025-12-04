export const config = { runtime: "edge" };
import { DESTINATIONS_ALL } from "./_cities.js";
import { createClient } from "@supabase/supabase-js";

type Item = {
  code: string;
  city: string;
  region: string;
  price: number | null;
  originalPrice: number | null;
  departureDate: string | null;
  returnDate: string | null;
  airline: string | null;
  tripDays: number | null;
  collectedAt: string | null;
  meta?: any;
};

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const { searchParams } = new URL(req.url);
    const from = String(searchParams.get("from") ?? "ICN");
    const region = searchParams.get("region");
    const trParam = searchParams.get("transfer");
    const transfer = (trParam === "0" || trParam === "-1") ? Number(trParam) : -1;
    const codesParam = String(searchParams.get("codes") ?? "");
    const tdParam = searchParams.get("tripDays");
    const tripDaysFilter = tdParam && !Number.isNaN(Number(tdParam)) ? Number(tdParam) : null;
    // 특정 출발일 고정(모든 목적지 동일 출발일로 조회)
    const depParam = searchParams.get("dep"); // YYYY-MM-DD
    const depIso = depParam && /^\d{4}-\d{2}-\d{2}$/.test(depParam) ? depParam : null;
    const retParam = searchParams.get("ret");
    const retIso = retParam && /^\d{4}-\d{2}-\d{2}$/.test(retParam) ? retParam : null;
    const airlinesParam = searchParams.get("airlines");
    const airlineParam = searchParams.get("airline");
    const airlineFilters = (() => {
      const tokens = airlinesParam?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
      if (airlineParam) tokens.push(airlineParam.trim());
      const deduped = Array.from(new Set(tokens.filter(Boolean)));
      return deduped.length ? deduped : null;
    })();
    const applyAirlineFilter = <T extends { eq: Function; in: Function }>(query: T) => {
      if (!airlineFilters || !airlineFilters.length) return query;
      if (airlineFilters.length === 1) return (query as any).eq("min_airline", airlineFilters[0]);
      return (query as any).in("min_airline", airlineFilters);
    };

    let targets = DESTINATIONS_ALL;
    if (region && region !== "모두") targets = targets.filter((d) => d.region === region);
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      targets = targets.filter((d) => set.has(d.code));
    }
    const codes = targets.map((d) => d.code);

    const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string | undefined;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Supabase env missing" }, 500);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let extrema: any[] = [];
    if (depIso && retIso) {
      // 출발/도착일이 모두 고정된 경우: fares에서 해당 날짜의 최신 스냅샷을 목적지별 1건씩
      let q = supabase
        .from("fares")
        .select("from,to,departure_date,return_date,trip_days,min_price,min_airline,collected_at,transfer_filter")
        .eq("from", from)
        .in("to", codes)
        .eq("transfer_filter", transfer)
        .eq("is_latest", true)
        .eq("departure_date", depIso)
        .eq("return_date", retIso)
        .order("collected_at", { ascending: false });
      q = applyAirlineFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      const byTo = new Map<string, any>();
      for (const row of data ?? []) if (!byTo.has(row.to)) byTo.set(row.to, row);
      extrema = Array.from(byTo.values());
    } else if (depIso && tripDaysFilter != null) {
      // 일정 고정 모드: fares 테이블에서 해당 출발/복귀일 스냅샷을 직접 조회
      const retIso = addDaysIsoKST(depIso, Math.max(1, Number(tripDaysFilter)) - 1);
      let q = supabase
        .from("fares")
        .select("from,to,departure_date,return_date,trip_days,min_price,min_airline,collected_at,transfer_filter")
        .eq("from", from)
        .in("to", codes)
        .eq("transfer_filter", transfer)
        .eq("is_latest", true)
        .eq("departure_date", depIso)
        .eq("return_date", retIso)
        .order("collected_at", { ascending: false });
      q = applyAirlineFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      // 목적지별 최신 1건만 사용
      const byTo = new Map<string, any>();
      for (const row of data ?? []) {
        if (!byTo.has(row.to)) byTo.set(row.to, row);
      }
      extrema = Array.from(byTo.values());
    } else if (tripDaysFilter != null) {
      let q = supabase
        .from("fares_city_extrema_tripdays")
        .select("from,to,departure_date,return_date,trip_days,min_price,max_price,min_airline,collected_at,transfer_filter")
        .eq("from", from)
        .in("to", codes)
        .eq("transfer_filter", transfer)
        .eq("trip_days", tripDaysFilter);
      q = applyAirlineFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      extrema = data ?? [];
    } else {
      const view = transfer === 0 ? "fares_city_extrema_direct" : "fares_city_extrema";
      let q = supabase
        .from(view)
        .select("from,to,departure_date,return_date,trip_days,min_price,max_price,min_airline,collected_at")
        .eq("from", from)
        .in("to", codes);
      q = applyAirlineFilter(q);
      const { data, error } = await q;
      if (error) throw error;
      extrema = data ?? [];
    }
    // 최신 수집시점(해당 목적지의 latest rows 중 최상단)
    let qRecent = supabase
      .from("fares")
      .select("to,collected_at")
      .eq("from", from)
      .in("to", codes)
      .eq("transfer_filter", transfer)
      .eq("is_latest", true)
      .order("collected_at", { ascending: false });
    if (tripDaysFilter) qRecent = (qRecent as any).eq("trip_days", tripDaysFilter);
    if (depIso && retIso) qRecent = (qRecent as any).eq("departure_date", depIso).eq("return_date", retIso);
    else if (depIso && tripDaysFilter != null) {
      const retIsoCalc = addDaysIsoKST(depIso, Math.max(1, Number(tripDaysFilter)) - 1);
      qRecent = (qRecent as any).eq("departure_date", depIso).eq("return_date", retIsoCalc);
    }
    qRecent = applyAirlineFilter(qRecent as any);
    const { data: recentRows, error: errRecent } = await qRecent as any;
    if (errRecent) throw errRecent;

    const byTo = new Map<string, any>((extrema ?? []).map((r: any) => [r.to, r]));
    const latestCollectedByTo = new Map<string, string>();
    for (const row of (recentRows ?? [])) {
      if (!latestCollectedByTo.has(row.to)) latestCollectedByTo.set(row.to, row.collected_at as any);
    }
    // Baseline join to compute badges
    const baselineView = transfer === 0 ? "fares_baseline_direct" : "fares_baseline_all";
    const { data: baseRows, error: errBase } = await supabase
      .from(baselineView)
      .select("from,to,sample_rows,p50_price,p25_price,p10_price,p05_price,p01_price")
      .eq("from", from)
      .in("to", codes);
    // baseline 뷰가 없거나 에러 시에도 아이템은 반환 (배지 미표시)
    const safeBaseRows = errBase ? [] : (baseRows ?? []);
    const baseByTo = new Map<string, any>(safeBaseRows.map((r: any) => [r.to, r]));

    const items: Item[] = targets.map((t) => {
      const r = byTo.get(t.code);
      const lastCollected = latestCollectedByTo.get(t.code) ?? r?.collected_at ?? null;
      const b = baseByTo.get(t.code);
      const n = Number(b?.sample_rows || 0);
      const price = r?.min_price !== null && r?.min_price !== undefined ? Number(r.min_price) : null;
  const p10 = b?.p10_price != null ? Number(b.p10_price) : null;
      const MIN_SAMPLE = 50;
  const isGood = (typeof price === 'number' && typeof p10 === 'number' && n >= MIN_SAMPLE && price <= p10 * 0.70);
  const meta = b ? { baseline: { p10, sample: n, scope: transfer === 0 ? 'direct' : 'all' }, isGood } : null;
      return {
        code: t.code,
        city: t.nameKo,
        region: t.region,
        price,
        originalPrice: r?.max_price !== null && r?.max_price !== undefined ? Number(r.max_price) : null,
        tripDays: r?.trip_days !== null && r?.trip_days !== undefined ? Number(r.trip_days) : null,
        departureDate: r?.departure_date ?? null,
        returnDate: r?.return_date ?? null,
        airline: r?.min_airline ?? null,
        collectedAt: lastCollected,
        meta,
      } as Item;
    });

    return json({ count: items.length, items });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
}

// KST 기준으로 YYYY-MM-DD에 days를 더한 ISO 반환
function addDaysIsoKST(iso: string, days: number) {
  const [yy, mm, dd] = iso.split("-").map(Number);
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  const startUTC = Date.UTC(yy, (mm || 1) - 1, dd || 1) - KST_OFFSET;
  const endUTC = startUTC + days * 24 * 60 * 60 * 1000;
  const endKST = endUTC + KST_OFFSET;
  const d = new Date(endKST);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}


