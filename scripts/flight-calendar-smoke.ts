/**
 * 간단한 스모크 테스트 스크립트
 * 사용법:
 *   FROM=ICN TO=TYO npx tsx scripts/flight-calendar-smoke.ts
 * 또는 CLI 인자:
 *   npx tsx scripts/flight-calendar-smoke.ts --from ICN --to TYO --days 5 --tripDays 3
 */

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i];
  const v = process.argv[i + 1];
  if (k && v && k.startsWith("--")) args.set(k.slice(2), v);
}

const from = args.get("from") ?? process.env.FROM ?? "ICN";
const to = args.get("to") ?? process.env.TO ?? "TYO";
const days = Number(args.get("days") ?? process.env.DAYS ?? 5);
const tripDays = Number(args.get("tripDays") ?? process.env.TRIP_DAYS ?? 3);
const startDate = args.get("startDate") ?? process.env.START_DATE; // YYYY-MM-DD optional

const base = process.env.MRT_CAL_BASE ?? "https://api3.myrealtrip.com";
const url = `${base}/flight/api/price/calendar`;

async function main() {
  if (!to) throw new Error("to is required (--to or TO env)");
  const baseDate = startDate ? new Date(startDate) : new Date();
  if (!startDate) baseDate.setDate(baseDate.getDate() + 1);

  console.log(`[request] ${url}`);
  console.log({ from, to, days, tripDays, startDate: startDate ?? "(tomorrow default)" });

  const results: Array<{ departure: string; returnDate: string; price: number }> = [];
  for (let i = 0; i < days; i++) {
    const dep = new Date(baseDate);
    dep.setDate(dep.getDate() + i);
    const depStr = dep.toISOString().slice(0, 10);
    const ret = new Date(depStr);
    ret.setDate(ret.getDate() + Math.max(1, tripDays) - 1);
    const retStr = ret.toISOString().slice(0, 10);

    const payload = {
      from,
      to,
      departureDate: depStr,
      period: tripDays,
      transfer: -1,
      international: true,
      airlines: ["All"],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`skip ${depStr} -> HTTP ${res.status}`);
      continue;
    }
    const data = (await res.json()) as { flightCalendarInfoResults?: Array<{ date: string; price: number }> };
    const exact = (data.flightCalendarInfoResults ?? []).find((e) => String(e.date) === retStr);
    if (!exact || !Number.isFinite(Number(exact.price))) {
      console.warn(`skip ${depStr} -> no exact match`);
      continue;
    }
    results.push({ departure: depStr, returnDate: retStr, price: Number(exact.price) });
  }

  results.sort((a, b) => a.price - b.price);
  if (!results.length) {
    console.log("no prices found");
    return;
  }

  const best = results[0];
  const worst = results[results.length - 1];
  const avg = Math.round(results.reduce((s, r) => s + r.price, 0) / results.length);

  console.log("[summary]");
  console.log(`total: ${results.length}`);
  console.log(`best: ₩${best.price.toLocaleString()} dep ${best.departure} ret ${best.returnDate}`);
  console.log(`worst: ₩${worst.price.toLocaleString()} dep ${worst.departure} ret ${worst.returnDate}`);
  console.log(`avg: ₩${avg.toLocaleString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

