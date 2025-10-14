import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildMrtBookingUrl(params: { from: string; fromNameKo?: string; to: string; toNameKo: string; depdt: string; rtndt: string; adt?: number; chd?: number; inf?: number; cabin?: string }) {
  const { from, fromNameKo = "인천", to, toNameKo, depdt, rtndt, adt = 1, chd = 0, inf = 0, cabin = "Y" } = params;
  const base = "https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1";
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
  push("nonstop", "");
  push("freebag", "");
  // original fields (empty placeholders)
  push("orgDepctycd", ""); push("orgDepctycd", ""); push("orgDepctycd", ""); push("orgDepctycd", "");
  push("orgArrctycd", ""); push("orgArrctycd", ""); push("orgArrctycd", ""); push("orgArrctycd", "");
  push("orgPreferaircd", "");
  push("preferaircd", "");
  // Optional KSESID (session-specific). If provided via env, include.
  const MRT_KSESID = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MRT_KSESID) || undefined;
  if (MRT_KSESID) push("KSESID", String(MRT_KSESID));
  return `${base}?${qs.toString()}`;
}