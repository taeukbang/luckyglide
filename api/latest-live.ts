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
    const concurrency = Math.max(1, Number(searchParams.get("concurrency") ?? 4));

    let targets = DESTINATIONS_ALL;
    if (region && region !== "모두") targets = targets.filter((d) => d.region === region);
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      targets = targets.filter((d) => set.has(d.code));
    }

    const base = new Date();
    base.setDate(base.getDate() + 1);

    // 동시성 제어를 위한 간단한 풀
    async function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), ms);
      try {
        // @ts-ignore fetch-only use; p expected from fetch below
        const res = await p;
        return res;
      } finally {
        clearTimeout(t);
      }
    }

    type Acc = { best: { price: number; dep: string; ret: string; airline: string; len: number } | null; worst: number | null };
    const accByCode = new Map<string, Acc>();
    for (const t of targets) accByCode.set(t.code, { best: null, worst: null });

    const tasks: Array<() => Promise<void>> = [];
    for (const t of targets) {
      for (let i = 0; i < days; i++) {
        const dep = new Date(base);
        dep.setDate(dep.getDate() + i);
        const depStr = formatIso(dep);
        tasks.push(async () => {
          const url = `https://api3.myrealtrip.com/pds/api/v1/flight/price/calendar`;
          const payload = { from, to: t.code, departureDate: depStr, period: Math.max(1, maxTripDays), transfer: -1, international: true, airlines: ["All"] };
          let data: any | null = null;
          try {
            const r = await withTimeout(fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }), 7000);
            if (!r.ok) return;
            data = await r.json();
          } catch {
            return;
          }
          const arr = data?.flightCalendarInfoResults ?? [];
          if (!Array.isArray(arr) || arr.length === 0) return;
          // 이 출발일에서 요구 체류일 범위에 해당하는 복귀일 가격들 평가
          for (let len = Math.max(1, minTripDays); len <= Math.max(minTripDays, maxTripDays); len++) {
            const ret = new Date(depStr);
            ret.setDate(ret.getDate() + (len - 1));
            const retStr = formatIso(ret);
            const exact = arr.find((e: any) => String(e?.date) === retStr);
            if (!exact) continue;
            const p = Number(exact.price);
            if (!Number.isFinite(p)) continue;
            const cur = accByCode.get(t.code)!;
            if (!cur.best || p < cur.best.price) cur.best = { price: p, dep: depStr, ret: retStr, airline: String(exact.airline ?? ""), len };
          }
          const localMax = arr.reduce((mx: number, cur: any) => Math.max(mx, Number(cur.price ?? 0)), 0);
          const cur = accByCode.get(t.code)!;
          cur.worst = cur.worst === null ? localMax : Math.max(cur.worst, localMax);
        });
      }
    }

    async function runPool() {
      const running: Promise<void>[] = [];
      let idx = 0;
      const next = async () => {
        if (idx >= tasks.length) return;
        const task = tasks[idx++];
        const p = task().finally(next);
        running.push(p);
      };
      const start = Math.min(concurrency, tasks.length);
      for (let i = 0; i < start; i++) await next();
      await Promise.all(running);
    }

    await runPool();

    const items: LiveItem[] = targets.map((t) => {
      const { best, worst } = accByCode.get(t.code)!;
      if (!best) return { code: t.code, city: t.nameKo, region: t.region, price: null, originalPrice: null, departureDate: null, returnDate: null, airline: null, tripDays: null };
      return { code: t.code, city: t.nameKo, region: t.region, price: Number(best.price), originalPrice: worst, departureDate: best.dep, returnDate: best.ret, airline: String(best.airline ?? ""), tripDays: best.len };
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


