export interface HolidayRangeIso {
  startIso: string; // YYYY-MM-DD
  endIso: string;   // YYYY-MM-DD (inclusive)
  label: string;
}

export interface HolidayRangeMMDD {
  startMMDD: string; // MM/DD
  endMMDD: string;   // MM/DD (inclusive)
  label: string;
}

/** Convert ISO (KST assumed) to MM/DD string */
export function isoToMMDD(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

/** Expand an ISO range to individual ISO days (inclusive). */
function expandIsoRange(startIso: string, endIso: string): string[] {
  const days: string[] = [];
  const s = new Date(startIso);
  const e = new Date(endIso);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const y = d.getFullYear();
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

/**
 * Build fixed-date holiday ISO ranges for a given year.
 * - 삼일절(03-01), 근로자의 날(05-01), 어린이날(05-05)
 * (대체공휴일은 JSON에서 별도로 지정하도록 함)
 */
export function getFixedHolidayIsoRanges(year: number): HolidayRangeIso[] {
  const mk = (mm: number, dd: number, label: string): HolidayRangeIso => ({
    startIso: `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
    endIso: `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`,
    label,
  });
  return [
    mk(3, 1, "삼일절"),
    mk(5, 1, "근로자의 날"),
    mk(5, 5, "어린이날"),
  ];
}

/**
 * Merge fixed holidays and custom ranges (from JSON or props), and filter to MM/DD values
 * that exist in the provided domain (array of MM/DD strings used by the chart).
 */
export function buildHolidayRangesForDomain(options: {
  domainMMDD: string[];
  years: number[]; // years visible in the chart domain
  customIsoRanges?: HolidayRangeIso[]; // e.g., 설 연휴, 부처님오신날(음력), 대체공휴일 등
  domainIsoSet?: Set<string>; // exact ISO dates visible in the chart (if known)
}): HolidayRangeMMDD[] {
  const { domainMMDD, years, customIsoRanges = [], domainIsoSet } = options;
  const fixed = years.flatMap((y) => getFixedHolidayIsoRanges(y));
  const all: HolidayRangeIso[] = [...fixed, ...customIsoRanges];

  const mmddRanges: HolidayRangeMMDD[] = [];
  for (const r of all) {
    const isoDays = expandIsoRange(r.startIso, r.endIso);
    const filteredIso = domainIsoSet
      ? isoDays.filter((iso) => domainIsoSet.has(iso))
      : isoDays;
    const mmdds = filteredIso.map(isoToMMDD).filter((mmdd) => domainMMDD.includes(mmdd));
    if (mmdds.length === 0) continue;
    const startMMDD = mmdds[0];
    const endMMDD = mmdds[mmdds.length - 1];
    mmddRanges.push({ startMMDD, endMMDD, label: r.label });
  }
  return mmddRanges;
}


