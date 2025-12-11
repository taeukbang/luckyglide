export const config = { runtime: "edge" };
import { createClient } from "@supabase/supabase-js";

// 이 라우트는 단일 목적지(from,to)를 간단 스캔하여 DB(fares)에 최신 행들을 적재합니다.
// 서버 버전(scanAndStore)과 동일한 스키마에 맞춰 INSERT만 담당하고, 캘린더 조회는 서버리스에서 직접 호출합니다.

function formatIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const url = new URL(req.url);
    const fromQ = String(url.searchParams.get("from") ?? "ICN");
    const toQ = String(url.searchParams.get("to") ?? "");
    const transferQ = Number(url.searchParams.get("transfer") ?? -1);
    if (!toQ) return json({ error: "to is required" }, 400);

    const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string | undefined;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Supabase env missing" }, 500);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const now = new Date();
    now.setDate(now.getDate() + 1);
    const startDate = formatIso(now);
    const days = 14;
    const minTripDays = 3;
    const maxTripDays = 7;

    const rows: any[] = [];
    for (let i = 0; i < days; i++) {
      const dep = new Date(startDate);
      const depReal = new Date(dep);
      depReal.setDate(depReal.getDate() + i);
      const depStr = formatIso(depReal);
      for (let len = minTripDays; len <= maxTripDays; len++) {
        const payload = { from: fromQ, to: toQ, departureDate: depStr, period: len, transfer: transferQ, international: true, airlines: ["All"] };
        const r = await fetch(`https://api3.myrealtrip.com/flight/api/price/calendar`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok) continue;
        const data = await r.json();
        const arr = data?.flightCalendarInfoResults ?? [];
        // 정확 체류일: 복귀일 = 출발일 + (len - 1)
        const ret = new Date(depStr);
        ret.setDate(ret.getDate() + (len - 1));
        const retStr = formatIso(ret);
        const exact = arr.find((e: any) => String(e?.date) === retStr);
        rows.push({
          from: fromQ,
          to: toQ,
          departure_date: depStr,
          return_date: retStr,
          trip_days: len,
          min_price: exact ? Number(exact.price) : null,
          min_airline: exact ? String(exact.airline ?? "") : null,
          collected_at: new Date().toISOString(),
          is_latest: true,
          transfer_filter: transferQ,
        });
      }
    }

    // 이전 최신 플래그 해제 후 insert
    await supabase.from("fares").update({ is_latest: false })
      .eq("from", fromQ).eq("to", toQ).eq("transfer_filter", transferQ).eq("is_latest", true);
    const { error } = await supabase.from("fares").insert(rows);
    if (error) throw error;

    return json({ ok: true, rows: rows.length });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,GET,OPTIONS" };
}


