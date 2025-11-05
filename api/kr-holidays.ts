export const config = { runtime: "edge" };

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400" // CDN 6h, SWR 24h
    }
  });
}

type NagerHoliday = {
  date: string; // YYYY-MM-DD
  localName: string;
  name: string;
};

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const yearsParam = searchParams.get("years");
    const now = new Date();
    const fallbackYears = [now.getFullYear(), now.getFullYear() + 1];
    const years = yearsParam
      ? yearsParam.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
      : fallbackYears;

    const all: NagerHoliday[] = [];
    for (const y of years) {
      const r = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/KR`, { next: { revalidate: 21600 } as any });
      if (!r.ok) continue;
      const arr = (await r.json()) as any[];
      for (const it of arr) {
        all.push({ date: String(it.date), localName: String(it.localName ?? it.name ?? ""), name: String(it.name ?? it.localName ?? "") });
      }
    }

    // sort and compress contiguous days
    const items = all
      .map((h) => ({ ...h, dt: new Date(h.date) }))
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());

    const ranges: { startIso: string; endIso: string; label: string }[] = [];
    let curStart: Date | null = null;
    let curEnd: Date | null = null;
    let labels: string[] = [];
    const flush = () => {
      if (!curStart || !curEnd) return;
      const joined = labels.join(" ");
      // Label building rules
      let label: string;
      const hasSubstitute = labels.some((l) => /대체/.test(l));
      if (labels.length === 1) {
        label = labels[0] || "공휴일";
      } else if (hasSubstitute) {
        const base = labels.find((l) => !/대체/.test(l)) || "대체휴일";
        // normalize base like "삼일절" → "삼일절", leave as is
        label = `${base.replace(/\s*대체.*$/, "").trim()} 대체휴일`;
      } else if (/설/.test(joined)) {
        label = "설 연휴";
      } else if (/추석/.test(joined)) {
        label = "추석 연휴";
      } else {
        // default: first holiday name
        label = labels[0] || "공휴일";
      }
      ranges.push({ startIso: toISO(curStart), endIso: toISO(curEnd), label });
      curStart = curEnd = null;
      labels = [];
    };
    for (let i = 0; i < items.length; i++) {
      const { dt, localName } = items[i];
      if (!curStart) {
        curStart = new Date(dt);
        curEnd = new Date(dt);
        labels = [localName];
        continue;
      }
      const prev = curEnd as Date;
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      if (toISO(dt) === toISO(next)) {
        curEnd = new Date(dt);
        labels.push(localName);
      } else {
        flush();
        curStart = new Date(dt);
        curEnd = new Date(dt);
        labels = [localName];
      }
    }
    flush();

    return json({ count: ranges.length, ranges });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}


