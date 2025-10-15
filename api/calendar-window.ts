export const config = { runtime: "edge" };

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" } });
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" } });
  try {
    const body = await req.json();
    const { from = "ICN", to, startDate, days = 30, tripDays = 3, airlines = ["All"], transfer = -1, international = true } = body || {};
    if (!to) return json({ error: "to is required" }, 400);

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
      const url = `https://api3.myrealtrip.com/pds/api/v1/flight/price/calendar`;
      const payload = { from, to, departureDate: depStr, period: tripDays, transfer, international, airlines };
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) continue;
      const data = await r.json();
      const arr = data?.flightCalendarInfoResults ?? [];
      // Match by RETURN date: dep + (tripDays - 1) to align with MRT calendar UI
      const ret = new Date(depStr);
      ret.setDate(ret.getDate() + Math.max(1, Number(tripDays)) - 1);
      const ryyyy = ret.getFullYear();
      const rmm = String(ret.getMonth() + 1).padStart(2, "0");
      const rdd = String(ret.getDate()).padStart(2, "0");
      const retStr = `${ryyyy}-${rmm}-${rdd}`;
      const exact = arr.find((e: any) => String(e?.date) === retStr);
      if (!exact || !Number.isFinite(Number(exact.price))) continue;
      // Chart x-axis: show DEPARTURE date (MM/DD) for clarity
      out.push({ date: `${mm}/${dd}`, price: Number(exact.price) });
    }
    return json({ items: out });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}


