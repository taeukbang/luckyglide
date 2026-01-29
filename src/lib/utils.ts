import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { extractPartnerIdFromPath, isPartnerActive } from "./partner-config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 간단한 UA 기반 모바일 판별
export function isMobileUA() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(navigator.userAgent);
}

// 마이리얼트립 앱(인앱브라우저) UA 식별
export function isMrtAppUA() {
  try {
    if (typeof navigator === 'undefined') return false;
    const ua = String(navigator.userAgent || '').toLowerCase();
    // 실제 앱 UA 토큰에 맞춰 보완 가능
    const hasBrand = /myrealtrip|myrealtripapp|mrtapp/.test(ua);
    const isAndroidWV = /\bwv\b/.test(ua);
    return hasBrand || (isAndroidWV && /myrealtrip/.test(ua));
  } catch {
    return false;
  }
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

// MyRealTrip 앱 내 인앱브라우저로 접속한 경우(status=mrt_app) 웹 링크를 딥링크로 변환
export function applyMrtDeepLinkIfNeeded(webUrl: string) {
  try {
    if (typeof window === 'undefined') return webUrl;
    const getStatusFromLocation = () => {
      const qsVal = new URLSearchParams(window.location.search).get('status');
      if (qsVal) return qsVal;
      const hash = window.location.hash || '';
      const key = 'status=';
      const idx = hash.indexOf(key);
      if (idx >= 0) {
        const sub = hash.slice(idx + key.length);
        const end = sub.indexOf('&');
        const raw = end >= 0 ? sub.slice(0, end) : sub;
        try { return decodeURIComponent(raw); } catch { return raw; }
      }
      return null;
    };
    const raw = getStatusFromLocation();
    const norm = String(raw || '').toLowerCase().trim().replace(/\/+$/, '');
    if (norm === 'mrt_app') {
      // PC(데스크톱) 또는 모바일 웹 브라우저는 웹 링크 유지
      if (!isMobileUA() || !isMrtAppUA()) return webUrl;
      return `mrt://flights?url=${encodeURIComponent(webUrl)}`;
    }
  } catch {}
  return webUrl;
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

// ---- Partner landing URL helper (frontend) ----
export async function fetchMrtPartnerLandingUrl(input: {
  depAirportCd: string;
  depDate: string; // YYYY-MM-DD
  arrAirportCd: string;
  arrDate?: string; // YYYY-MM-DD
  tripTypeCd?: "OW" | "RT";
}): Promise<{ url: string; gid?: number } | null> {
  try {
    const res = await fetch("/api/mrt/partner/landing-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      // 500 에러는 조용히 무시 (fallback으로 진행)
      return null;
    }
    const data = await res.json().catch(() => ({}));
    const url = data?.data?.url as string | undefined;
    const gid = data?.data?.gid as number | undefined;
    return url ? { url, gid } : null;
  } catch {
    return null;
  }
}

// ---- 마이링크 실시간 생성 API helper (frontend) ----
// 예약 URL을 받아서 실시간으로 MyLink로 변환
export async function createMylinkRealtime(targetUrl: string, partnerId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/mrt/partner/mylink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl, partnerId }),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData?.error || errorData?.details || `HTTP ${res.status}`;
      
      // 네트워크 에러인 경우 사용자 친화적 메시지
      if (res.status === 503 || errorMsg.includes('Network error') || errorMsg.includes('Unable to connect')) {
        console.warn(`[MyLink 생성 실패 - 네트워크 문제] 로컬 환경에서 MyRealTrip API에 접속할 수 없습니다. Vercel 배포 후 정상 작동할 수 있습니다.`);
      } else {
        console.error(`[MyLink 생성 실패] ${res.status}:`, errorData);
      }
      return null;
    }
    
    const data = await res.json().catch(() => ({}));
    const mylink = data?.data?.mylink as string | undefined;
    return mylink || null;
  } catch (e: any) {
    console.error(`[MyLink 생성 예외]:`, e?.message || e);
    return null;
  }
}

export async function resolveBookingUrlWithPartner(params: {
  from: string;
  to: string;
  toNameKo: string;
  depdt: string;
  rtndt?: string;
  nonstop?: boolean;
  utm?: string;
}) {
  const { from, to, toNameKo, depdt, rtndt, nonstop, utm = "utm_source=luckyglide" } = params;
  
  // 파트너 식별자 추출
  const partnerId = extractPartnerIdFromPath();
  const isPartner = isPartnerActive(partnerId);
  
  // UTM 파라미터 추가 헬퍼 함수
  const appendUtm = (u: string) => {
    try {
      const url = new URL(u);
      if (!url.searchParams.has("utm_source") && utm) {
        const [k, v] = utm.split("=");
        if (k && v) url.searchParams.set(k, v);
      }
      return url.toString();
    } catch {
      if (!u.includes("utm_source=") && utm) {
        return u + (u.includes("?") ? "&" : "?") + utm;
      }
      return u;
    }
  };
  
  // 파트너 경로인 경우 실시간으로 마이링크 생성
  if (isPartner && partnerId) {
    // 디버깅: 파트너 경로 감지 로그
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('[MyLink Debug] 파트너 경로 감지 - 실시간 MyLink 생성:', {
        partnerId,
        from,
        to,
        depdt,
        rtndt: rtndt ?? depdt,
        nonstop: !!nonstop,
      });
    }
    
    // 1. 예약 URL 생성
    // Try partner landing URL first
    let bookingUrl: string | null = null;
    const partner = await fetchMrtPartnerLandingUrl({
      depAirportCd: from,
      depDate: depdt,
      arrAirportCd: to,
      arrDate: rtndt ?? depdt,
      tripTypeCd: rtndt && rtndt !== depdt ? "RT" : "OW",
    });
    
    if (partner?.url) {
      bookingUrl = appendUtm(partner.url);
    } else {
      // Fallback to original web booking URL
      const web = buildMrtBookingUrl(
        { from, to, toNameKo, depdt, rtndt: rtndt ?? depdt },
        { nonstop: !!nonstop }
      );
      bookingUrl = appendUtm(web);
    }
    
    if (!bookingUrl) {
      // 예약 URL 생성 실패 시 fallback
      const web = buildMrtBookingUrl(
        { from, to, toNameKo, depdt, rtndt: rtndt ?? depdt },
        { nonstop: !!nonstop }
      );
      return applyMrtDeepLinkIfNeeded(appendUtm(web));
    }
    
    // 2. 실시간으로 MyLink 생성
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log('[MyLink Debug] 예약 URL 생성 완료, MyLink 변환 시작:', bookingUrl.substring(0, 100) + '...');
    }
    
    const mylink = await createMylinkRealtime(bookingUrl, partnerId);
    
    if (mylink) {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('[MyLink Debug] MyLink 생성 성공:', mylink.substring(0, 50) + '...');
      }
      return applyMrtDeepLinkIfNeeded(mylink);
    }
    
    // 3. MyLink 생성 실패 시 원본 예약 URL 반환 (fallback)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.warn('[MyLink Debug] MyLink 생성 실패, 원본 예약 URL 사용');
    }
    return applyMrtDeepLinkIfNeeded(bookingUrl);
  }
  
  // 일반 경로인 경우 기존 로직 그대로 실행
  // Try partner landing URL first
  const partner = await fetchMrtPartnerLandingUrl({
    depAirportCd: from,
    depDate: depdt,
    arrAirportCd: to,
    arrDate: rtndt ?? depdt,
    tripTypeCd: rtndt && rtndt !== depdt ? "RT" : "OW",
  });
  
  if (partner?.url) {
    return applyMrtDeepLinkIfNeeded(appendUtm(partner.url));
  }
  
  // Fallback to original web booking URL
  const web = buildMrtBookingUrl(
    { from, to, toNameKo, depdt, rtndt: rtndt ?? depdt },
    { nonstop: !!nonstop }
  );
  return applyMrtDeepLinkIfNeeded(appendUtm(web));
}