import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 간단한 UA 기반 모바일 판별
export function isMobileUA() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(navigator.userAgent);
}

export function buildMrtBookingUrl(
  params: { from: string; fromNameKo?: string; to: string; toNameKo: string; depdt: string; rtndt: string; adt?: number; chd?: number; inf?: number; cabin?: string },
  opts?: { mobile?: boolean; nonstop?: boolean }
) {
  const { from, fromNameKo = "인천", to, toNameKo, depdt, rtndt, adt = 1, chd = 0, inf = 0, cabin = "Y" } = params;
  const useMobile = typeof opts?.mobile === 'boolean' ? opts.mobile : isMobileUA();
  const base = useMobile
    ? "https://flights.myrealtrip.com/air/b2c/AIR/MBL/AIRMBLSCH0100100010.k1"
    : "https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1";
  const qs = new URLSearchParams();
  const push = (k: string, v: string) => qs.append(k, v);
  push("initform", "RT");
  push("domintgubun", "I");
  // dep/arr codes and names (duplicated params as their form expects)
  push("depctycd", from); push("depctycd", to); push("depctycd", ""); push("depctycd", "");
  push("depctynm", fromNameKo); push("depctynm", toNameKo); push("depctynm", ""); push("depctynm", "");
  push("arrctycd", to); push("arrctycd", from); push("arrctycd", ""); push("arrctycd", "");
  push("arrctynm", toNameKo); push("arrctynm", fromNameKo); push("arrctynm", ""); push("arrctynm", "");
  // dates (duplicate 4 times)
  push("depdt", depdt); push("depdt", rtndt); push("depdt", ""); push("depdt", "");
  // misc flags
  push("opencase", "N"); push("opencase", "N"); push("opencase", "N");
  push("openday", ""); push("openday", ""); push("openday", "");
  push("depdomintgbn", "I");
  push("secrchType", "FARE");
  push("maxprice", "");
  push("availcount", "250");
  push("tasktype", "B2C");
  push("adtcount", String(adt));
  push("chdcount", String(chd));
  push("infcount", String(inf));
  push("cabinclass", cabin);
  push("nonstop", opts?.nonstop ? "Y" : "");
  push("freebag", "");
  // original fields (empty placeholders)
  push("orgDepctycd", ""); push("orgDepctycd", ""); push("orgDepctycd", ""); push("orgDepctycd", "");
  push("orgArrctycd", ""); push("orgArrctycd", ""); push("orgArrctycd", ""); push("orgArrctycd", "");
  push("orgPreferaircd", "");
  push("preferaircd", "");
  // Optional KSESID: hardcoded as requested. DO NOT include secrets in production repos in general.
  const MRT_KSESID = "air:b2c:SELK138RB:SELK138RB::00";
  if (MRT_KSESID) push("KSESID", String(MRT_KSESID));
  const built = `${base}?${qs.toString()}`;
  // Safety: ensure KSESID param exists even if URLSearchParams handling changes
  return built.includes("KSESID=") ? built : `${built}&KSESID=${encodeURIComponent(MRT_KSESID)}`;
}

// Timezone-safe ISO date add (treat input as UTC calendar date)
export function addDaysIsoUTC(iso: string, days: number) {
  const [yy, mm, dd] = iso.split("-").map((s) => Number(s));
  const dt = new Date(Date.UTC(yy, (mm || 1) - 1, dd || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// KST(UTC+9) 기준으로 YYYY-MM-DD에 days를 더한 값을 반환
export function addDaysIsoKST(iso: string, days: number) {
  const [yy, mm, dd] = iso.split("-").map(Number);
  const KST_OFFSET = 9 * 60 * 60 * 1000; // UTC+9
  // KST 자정 기준 타임스탬프 → UTC 연산 → KST로 복귀
  const startUTC = Date.UTC(yy, (mm || 1) - 1, dd || 1) - KST_OFFSET;
  const endUTC = startUTC + days * 24 * 60 * 60 * 1000;
  const endKST = endUTC + KST_OFFSET;
  const d = new Date(endKST);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

// 요일(한글 약칭) 반환
export function weekdayKo(d: Date): string {
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  const idx = d.getDay();
  return names[idx] ?? "";
}