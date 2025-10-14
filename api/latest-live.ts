import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DESTINATIONS } from "../server/cities";
import { fetchCalendar as fetchCal } from "../server/myrealtrip";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const from = String(req.query.from ?? "ICN");
    const region = req.query.region ? String(req.query.region) : null;
    const codesParam = req.query.codes ? String(req.query.codes) : "";
    const days = Number(req.query.days ?? 14);

    let targets = DESTINATIONS;
    if (region && region !== "모두") targets = targets.filter((d) => d.region === region);
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      targets = targets.filter((d) => set.has(d.code));
    }

    const base = new Date();
    base.setDate(base.getDate() + 1);

    const items: LiveItem[] = [];
    for (const t of targets) {
      // 단일 호출로 다음 days일 범위의 최소가 산출(서버리스 타임아웃 방지)
      const depStr = formatIso(base);
      const data = await fetchCal({ from, to: t.code, departureDate: depStr, period: days, transfer: -1, international: true, airlines: ["All"] });
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

    return res.status(200).json({ count: items.length, items });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "internal error" });
  }
}


