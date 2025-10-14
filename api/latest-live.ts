export const config = { runtime: "edge" };
import { DESTINATIONS_MIN } from "./_cities";

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
    const tripDays = Number(searchParams.get("tripDays") ?? 7);

    let targets = DESTINATIONS_MIN;
    if (region && region !== "모두") targets = targets.filter((d) => d.region === region);
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      targets = targets.filter((d) => set.has(d.code));
    }

    const base = new Date();
    base.setDate(base.getDate() + 1);

    const items: LiveItem[] = [];
    for (const t of targets) {
      // 그래프와 동일 기준: 출발일을 days일만큼 순회하며 period=tripDays 창 내 최저가를 계산
      let best: { price: number; date: string; airline: string } | null = null;
      let worst: number | null = null;
      for (let i = 0; i < days; i++) {
        const dep = new Date(base);
        dep.setDate(dep.getDate() + i);
        const depStr = formatIso(dep);
        const url = `https://api3.myrealtrip.com/pds/api/v1/flight/price/calendar`;
        const payload = { from, to: t.code, departureDate: depStr, period: tripDays, transfer: -1, international: true, airlines: ["All"] };
        const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok) continue;
        const data = await r.json();
        const slice = data.flightCalendarInfoResults?.slice(0, Math.max(tripDays, 1)) ?? [];
        if (!slice.length) continue;
        // 창 내 최저가(그래프 기준과 동일)
        const localMin = slice.reduce((acc: any, cur: any) => (acc && acc.price <= cur.price ? acc : cur));
        const localMax = slice.reduce((mx: number, cur: any) => Math.max(mx, Number(cur.price)), 0);
        if (localMin) {
          const p = Number(localMin.price);
          if (!best || p < best.price) best = { price: p, date: String(localMin.date), airline: String(localMin.airline ?? "") };
          worst = worst === null ? localMax : Math.max(worst, localMax);
        }
      }
      if (!best) {
        items.push({ code: t.code, city: t.nameKo, region: t.region, price: null, originalPrice: null, departureDate: null, returnDate: null, airline: null, tripDays: null });
      } else {
        // best.date는 창 내 최저가 발생일. 요청 tripDays 기준 복귀일 계산
        const depIso = String(best.date);
        const ret = new Date(depIso);
        ret.setDate(ret.getDate() + (tripDays - 1));
        const retIso = formatIso(ret);
        items.push({ code: t.code, city: t.nameKo, region: t.region, price: Number(best.price), originalPrice: worst, departureDate: depIso, returnDate: retIso, airline: String(best.airline ?? ""), tripDays });
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


