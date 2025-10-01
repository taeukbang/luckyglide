/*
  Daily full scan script
  - Scans all destinations (optionally filtered by env) and stores latest fares into Supabase
  - Intended to be run in CI (GitHub Actions) or locally with env configured
*/

import { scanAndStore } from "../server/scan";
import { DESTINATIONS } from "../server/cities";

type City = { nameKo: string; code: string; region: string };

function formatIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function pLimit(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    if (active >= concurrency) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job();
  };
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try { resolve(await fn()); }
        catch (e) { reject(e); }
        finally { active--; next(); }
      };
      queue.push(task);
      next();
    });
  };
}

async function main() {
  const from = process.env.SCAN_FROM || "ICN";
  const days = Number(process.env.SCAN_DAYS || 30);
  const minTripDays = Number(process.env.SCAN_MIN_DAYS || 3);
  const maxTripDays = Number(process.env.SCAN_MAX_DAYS || 7);
  const concurrency = Math.max(1, Number(process.env.SCAN_CONCURRENCY || 4));
  const transfer = (process.env.SCAN_TRANSFER !== undefined && process.env.SCAN_TRANSFER !== null)
    ? Number(process.env.SCAN_TRANSFER)
    : -1;

  // Optional filters
  const filterRegions = (process.env.SCAN_REGIONS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const filterCodes = (process.env.SCAN_CODES || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  let targets: City[] = DESTINATIONS;
  if (filterRegions.length) targets = targets.filter(t => filterRegions.includes(t.region));
  if (filterCodes.length) targets = targets.filter(t => filterCodes.includes(t.code));

  if (!targets.length) {
    console.log("No targets after filters; exiting.");
    return;
  }

  const startBase = new Date();
  startBase.setDate(startBase.getDate() + 1); // tomorrow
  const startDate = formatIso(startBase);

  console.log(`[scan-all] from=${from} transfer=${transfer} targets=${targets.length} days=${days} tripDays=${minTripDays}-${maxTripDays} concurrency=${concurrency}`);

  const limit = pLimit(concurrency);
  let totalRows = 0;
  let success = 0;
  let fail = 0;

  await Promise.all(targets.map(t => limit(async () => {
    const label = `${from}->${t.code}`;
    try {
      const r = await scanAndStore({ from, to: t.code, startDate, days, minTripDays, maxTripDays, transfer });
      totalRows += r.rows;
      success++;
      console.log(`[ok] ${label} rows=${r.rows}`);
    } catch (e: any) {
      fail++;
      console.error(`[fail] ${label} ${e?.message || e}`);
    }
  })));

  console.log(`[done] routes=${targets.length} success=${success} fail=${fail} rows=${totalRows}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


