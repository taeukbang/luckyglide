export const config = { runtime: "edge" };

import { getPartnerAccessToken } from "../server/mrtPartnerAuth";
import { buildMrtBookingUrl } from "../src/lib/utils";

const BACKOFFICE = "https://api3-backoffice.myrealtrip.com";

function toCityCode(iata: string) {
  const up = String(iata || "").toUpperCase();
  // 광범위 매핑: IATA 공항코드 -> IATA 도시(메트로)코드
  // 없는 경우 원본 반환
  const map: Record<string, string> = {
    // KR
    ICN: "SEL", GMP: "SEL",
    PUS: "PUS", CJU: "CJU", TAE: "TAE", KWJ: "KWJ", CJJ: "CJJ", USN: "USN", RSU: "RSU",
    // JP
    NRT: "TYO", HND: "TYO",
    KIX: "OSA", ITM: "OSA",
    CTS: "SPK", OKD: "SPK", FUK: "FUK", NGO: "NGO", KMQ: "KMQ", SDJ: "SDJ", KOJ: "KOJ", OKA: "OKA",
    // CN (mainland)
    PEK: "BJS", PKX: "BJS",
    PVG: "SHA", SHA: "SHA",
    CAN: "CAN", SZX: "SZX", HGH: "HGH", XMN: "XMN", CSX: "CSX",
    // TW/HK/MO
    TPE: "TPE", TSA: "TPE", KHH: "KHH",
    HKG: "HKG", MFM: "MFM",
    // US major metros
    JFK: "NYC", LGA: "NYC", EWR: "NYC",
    IAD: "WAS", DCA: "WAS", BWI: "WAS",
    ORD: "CHI", MDW: "CHI",
    // US West
    SFO: "SFO", OAK: "OAK", SJC: "SJC",
    LAX: "LAX", LGB: "LGB", SNA: "SNA", ONT: "ONT", BUR: "BUR",
    SEA: "SEA", PDX: "PDX", PHX: "PHX", LAS: "LAS",
    // UK
    LHR: "LON", LGW: "LON", LTN: "LON", STN: "LON", LCY: "LON", SEN: "LON",
    // FR
    CDG: "PAR", ORY: "PAR", BVA: "PAR",
    // IT
    FCO: "ROM", CIA: "ROM",
    MXP: "MIL", LIN: "MIL", BGY: "MIL",
    // ES
    BCN: "BCN", MAD: "MAD",
    // DE/NL/BE/CH
    BER: "BER", FRA: "FRA", MUC: "MUC",
    AMS: "AMS",
    BRU: "BRU",
    ZRH: "ZRH", GVA: "GVA",
    // CA
    YYZ: "YTO", YTZ: "YTO", YKZ: "YTO",
    YUL: "YMQ", YMX: "YMQ",
    YVR: "YVR",
    // AU/NZ
    SYD: "SYD", MEL: "MEL", AVV: "MEL", BNE: "BNE", PER: "PER", ADL: "ADL", AKL: "AKL", WLG: "WLG", CHC: "CHC",
    // BR/AR
    GRU: "SAO", CGH: "SAO", VCP: "SAO",
    GIG: "RIO", SDU: "RIO",
    EZE: "BUE", AEP: "BUE",
    // RU/TR/AE/SG/TH/VN
    SVO: "MOW", DME: "MOW", VKO: "MOW",
    IST: "IST", SAW: "IST",
    DXB: "DXB", AUH: "AUH",
    SIN: "SIN",
    BKK: "BKK", DMK: "BKK", HKT: "HKT", CNX: "CNX",
    SGN: "SGN", HAN: "HAN", DAD: "DAD", CXR: "CXR",
  };
  return map[up] || up;
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if ((req as any).method && (req as any).method === "OPTIONS") {
      return new Response(null, { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS" } });
    }
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const { from, to, depdt, rtndt, tripType = "RT", nonstop, mobile } = await req.json();
    if (!from || !to || !depdt || !rtndt) return json({ error: "from, to, depdt, rtndt are required" }, 400);

    const token = await getPartnerAccessToken();
    const ua = req.headers.get("user-agent") || "";
    const uaMobile = /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(ua);
    const useMobile = typeof mobile === 'boolean' ? mobile : uaMobile;
    const depCity = toCityCode(from);
    const arrCity = toCityCode(to);

    // nonstop=true일 경우: 소비자용 검색 URL을 targetUrl로 직접 사용하여 mylink 생성
    if (nonstop) {
      const targetUrl = buildMrtBookingUrl(
        { from, to, fromNameKo: "인천", toNameKo: arrCity, depdt, rtndt, adt: 1, chd: 0, inf: 0, cabin: "Y" },
        { mobile: useMobile, nonstop: true }
      );
      const r2 = await fetch(`${BACKOFFICE}/partner/v2/mylink`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "partner-access-token": token,
          "origin": "https://partner.myrealtrip.com",
        },
        body: JSON.stringify({ targetUrl }),
      });
      if (!r2.ok) {
        const t = await r2.text().catch(() => "");
        return json({ error: "mylink request failed", status: r2.status, body: t, targetUrl }, 502);
      }
      const j2 = await r2.json().catch(() => ({}));
      const mylink = j2?.data?.mylink;
      const expirationMinutes = j2?.data?.expirationMinutes ?? null;
      if (!mylink) return json({ error: "Invalid mylink response", body: j2, targetUrl }, 502);
      return json({ mylink, gid: null, landingUrl: targetUrl, expirationMinutes, nonstop: true });
    }

    const r1 = await fetch(`${BACKOFFICE}/flight/api/partner/shopping/fare/query-landing-url`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "partner-access-token": token,
        "origin": "https://partner.myrealtrip.com",
      },
      body: JSON.stringify({
        depAirportCd: depCity,
        arrAirportCd: arrCity,
        depDate: depdt,
        arrDate: rtndt,
        tripTypeCd: tripType,
      }),
    });
    if (!r1.ok) {
      const t = await r1.text().catch(() => "");
      return json({ error: "landing-url request failed", status: r1.status, body: t }, 502);
    }
    const j1 = await r1.json().catch(() => ({}));
    const landingUrl = j1?.data?.url;
    const gid = j1?.data?.gid;
    if (!landingUrl || !gid) return json({ error: "Invalid landing-url response", body: j1 }, 502);

    const r2 = await fetch(`${BACKOFFICE}/partner/v2/mylink`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "partner-access-token": token,
        "origin": "https://partner.myrealtrip.com",
      },
      body: JSON.stringify({ targetUrl: landingUrl }),
    });
    if (!r2.ok) {
      const t = await r2.text().catch(() => "");
      return json({ error: "mylink request failed", status: r2.status, body: t, gid, landingUrl }, 502);
    }
    const j2 = await r2.json().catch(() => ({}));
    const mylink = j2?.data?.mylink;
    const expirationMinutes = j2?.data?.expirationMinutes ?? null;
    if (!mylink) return json({ error: "Invalid mylink response", body: j2, gid, landingUrl }, 502);

    return json({ mylink, gid, landingUrl, expirationMinutes });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}


