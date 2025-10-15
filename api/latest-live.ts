export const config = { runtime: "edge" };
import { DESTINATIONS_ALL } from "./_cities";

type LiveItem = {
  code: string; city: string; region: string;
  price: number | null; originalPrice: number | null;
  departureDate: string | null; returnDate: string | null;
  airline: string | null; tripDays: number | null;
};

function formatIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });

  try {
    const { searchParams } = new URL(req.url);
    const from = String(searchParams.get("from") ?? "ICN");
    const region = searchParams.get("region");
    const codesParam = String(searchParams.get("codes") ?? "");
    const days = Number(searchParams.get("days") ?? 14);
    const minTripDays = Number(searchParams.get("minTripDays") ?? (searchParams.get("tripDays") ?? 3));
    const maxTripDays = Number(searchParams.get("maxTripDays") ?? (searchParams.get("tripDays") ?? 7));

    let targets = DESTINATIONS_ALL;
    if (region && region !== "모두") targets = targets.filter((d) => d.region === region);
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      targets = targets.filter((d) => set.has(d.code));
    }

    const base = new Date();
    base.setDate(base.getDate() + 1);

    const items: LiveItem[] = [];
    for (const t of targets) {
      // 정확 일수 매칭: 출발일(D+days) × 체류일(len)에서 복귀일 = 출발일+(len-1) 항목 가격만 고려
      let best: { price: number; dep: string; ret: string; airline: string; len: number } | null = null;
      let worst: number | null = null;
      for (let len = Math.max(1, minTripDays); len <= Math.max(minTripDays, maxTripDays); len++) {
        for (let i = 0; i < days; i++) {
          const dep = new Date(base);
          dep.setDate(dep.getDate() + i);
          const depStr = formatIso(dep);
          const url = `https://api3.myrealtrip.com/pds/api/v1/flight/price/calendar`;
          const payload = { from, to: t.code, departureDate: depStr, period: len, transfer: -1, international: true, airlines: ["All"] };
          const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
          if (!r.ok) continue;
          const data = await r.json();
          const arr = data.flightCalendarInfoResults ?? [];
          const ret = new Date(depStr);
          ret.setDate(ret.getDate() + (len - 1));
          const retStr = formatIso(ret);
          const exact = arr.find((e: any) => String(e?.date) === retStr);
          const localMax = arr.reduce((mx: number, cur: any) => Math.max(mx, Number(cur.price ?? 0)), 0);
          if (!exact) continue;
          const p = Number(exact.price);
          if (!Number.isFinite(p)) continue;
          if (!best || p < best.price) best = { price: p, dep: depStr, ret: retStr, airline: String(exact.airline ?? ""), len };
          worst = worst === null ? localMax : Math.max(worst, localMax);
        }
      }
      if (!best) {
        items.push({ code: t.code, city: t.nameKo, region: t.region, price: null, originalPrice: null, departureDate: null, returnDate: null, airline: null, tripDays: null });
      } else {
        // best는 dep/ret가 확정된 정확 체류일 매칭 결과
        items.push({ code: t.code, city: t.nameKo, region: t.region, price: Number(best.price), originalPrice: worst, departureDate: best.dep, returnDate: best.ret, airline: String(best.airline ?? ""), tripDays: best.len });
      }
    }
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


