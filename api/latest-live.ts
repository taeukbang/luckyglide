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
      // MyRealTrip 캘린더 직접 호출
      const depStr = formatIso(base);
      const url = `https://api3.myrealtrip.com/pds/api/v1/flight/price/calendar`;
      const payload = { from, to: t.code, departureDate: depStr, period: days, transfer: -1, international: true, airlines: ["All"] };
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(`mrt ${r.status}`);
      const data = await r.json();
      const arr = data.flightCalendarInfoResults ?? [];
      const best = arr.length ? arr.reduce((acc: any, cur: any) => (acc && acc.price <= cur.price ? acc : cur)) : null;
      const worst = arr.length ? arr.reduce((mx: number, cur: any) => Math.max(mx, Number(cur.price)), 0) : null;
      if (!best) {
        items.push({ code: t.code, city: t.nameKo, region: t.region, price: null, originalPrice: null, departureDate: null, returnDate: null, airline: null, tripDays: null });
      } else {
        // tripDays는 목록에서는 중요도가 낮으므로 null, 복귀일도 미표기
        items.push({ code: t.code, city: t.nameKo, region: t.region, price: Number(best.price), originalPrice: worst, departureDate: String(best.date), returnDate: null, airline: String(best.airline ?? ""), tripDays: null });
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


