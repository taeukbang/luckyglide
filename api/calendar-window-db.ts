export const config = { runtime: "edge" };
import { createClient } from "@supabase/supabase-js";

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const body = await req.json().catch(() => ({}));
    const { from = "ICN", to, startDate, days = 180, tripDays = 3, transfer = -1 } = body || {};
    if (!to) return json({ error: "to is required" }, 400);

    const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string | undefined;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return json({ error: "Supabase env missing" }, 500);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const base = startDate ? new Date(startDate) : new Date();
    if (!startDate) base.setDate(base.getDate() + 1);

    const limit = Math.min(180, Math.max(1, Number(days)));
    const depDates: string[] = [];
    const retDates: string[] = [];
    for (let i = 0; i < limit; i++) {
      const dep = new Date(base);
      dep.setDate(dep.getDate() + i);
      depDates.push(toIso(dep));
      const ret = new Date(dep);
      ret.setDate(ret.getDate() + Math.max(1, Number(tripDays)) - 1);
      retDates.push(toIso(ret));
    }

    // 주의: PostgREST IN 길이 제한 회피용으로 2회 분할(안전 여유). 180이면 한 번으로 충분하지만 방어적으로 처리
    const chunk = <T,>(arr: T[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
    const depChunks = chunk(depDates, 100);
    const retChunks = chunk(retDates, 100);

    const results: any[] = [];
    for (const depC of depChunks) {
      for (const retC of retChunks) {
        const { data, error } = await supabase
          .from("fares")
          .select("departure_date, return_date, trip_days, min_price, collected_at")
          .eq("from", from)
          .eq("to", to)
          .eq("transfer_filter", transfer)
          .eq("is_latest", true)
          .in("departure_date", depC)
          .in("return_date", retC)
          .order("collected_at", { ascending: false })
          .order("departure_date", { ascending: true });
        if (error) throw error;
        if (data) results.push(...data);
      }
    }

    const priceByDepIso = new Map<string, number>();
    for (const r of results) {
      const depIso = String(r.departure_date);
      const expectedRet = (() => {
        const d = new Date(depIso);
        d.setDate(d.getDate() + Math.max(1, Number(tripDays)) - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      })();
      if (String(r.return_date) !== expectedRet) continue;
      if (priceByDepIso.has(depIso)) continue;
      const val = (r as any).min_price !== null && (r as any).min_price !== undefined ? Number((r as any).min_price) : NaN;
      if (!Number.isNaN(val)) priceByDepIso.set(depIso, val);
    }

    const items = depDates.map((depIso) => {
      const d = new Date(depIso);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const key = `${mm}/${dd}`;
      const price = priceByDepIso.get(depIso);
      return price !== undefined ? { date: key, price } : null;
    }).filter(Boolean);

    return json({ items });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" };
}


