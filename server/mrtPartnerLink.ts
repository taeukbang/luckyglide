import { getPartnerAccessToken } from "./mrtPartnerAuth";
import { buildMrtBookingUrl } from "../src/lib/utils";

const BACKOFFICE = "https://api3-backoffice.myrealtrip.com";

function toCityCode(iata: string) {
  const up = String(iata || "").toUpperCase();
  const map: Record<string, string> = {
    // KR
    ICN: "SEL", GMP: "SEL",
    PUS: "PUS", CJU: "CJU", TAE: "TAE", KWJ: "KWJ", CJJ: "CJJ", USN: "USN", RSU: "RSU",
    // JP
    NRT: "TYO", HND: "TYO",
    KIX: "OSA", ITM: "OSA",
    CTS: "SPK", OKD: "SPK", FUK: "FUK", NGO: "NGO", KMQ: "KMQ", SDJ: "SDJ", KOJ: "KOJ", OKA: "OKA",
    // CN
    PEK: "BJS", PKX: "BJS",
    PVG: "SHA", SHA: "SHA",
    CAN: "CAN", SZX: "SZX", HGH: "HGH", XMN: "XMN", CSX: "CSX",
    // TW/HK/MO
    TPE: "TPE", TSA: "TPE", KHH: "KHH",
    HKG: "HKG", MFM: "MFM",
    // US East/Metros
    JFK: "NYC", LGA: "NYC", EWR: "NYC",
    IAD: "WAS", DCA: "WAS", BWI: "WAS",
    ORD: "CHI", MDW: "CHI",
    // US West
    SFO: "SFO", OAK: "OAK", SJC: "SJC",
    LAX: "LAX", LGB: "LGB", SNA: "SNA", ONT: "ONT", BUR: "BUR",
    SEA: "SEA", PDX: "PDX", PHX: "PHX", LAS: "LAS",
    // UK/FR/IT
    LHR: "LON", LGW: "LON", LTN: "LON", STN: "LON", LCY: "LON", SEN: "LON",
    CDG: "PAR", ORY: "PAR", BVA: "PAR",
    FCO: "ROM", CIA: "ROM",
    MXP: "MIL", LIN: "MIL", BGY: "MIL",
    // DE/NL/BE/CH
    BER: "BER", FRA: "FRA", MUC: "MUC",
    AMS: "AMS",
    BRU: "BRU",
    ZRH: "ZRH", GVA: "GVA",
    // ES
    BCN: "BCN", MAD: "MAD",
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

export async function createPartnerMylink(params: { from: string; to: string; depdt: string; rtndt: string; tripType?: string; nonstop?: boolean; mobile?: boolean }, ua?: string) {
  const { from, to, depdt, rtndt, tripType = "RT", nonstop, mobile } = params;
  const token = await getPartnerAccessToken();
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(String(ua || ""));
  const useMobile = typeof mobile === 'boolean' ? mobile : uaMobile;
  const depCity = toCityCode(from);
  const arrCity = toCityCode(to);

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
    if (!r2.ok) throw new Error(`mylink request failed: ${r2.status}`);
    const j2 = await r2.json().catch(() => ({}));
    const mylink = j2?.data?.mylink;
    const expirationMinutes = j2?.data?.expirationMinutes ?? null;
    if (!mylink) throw new Error("Invalid mylink response");
    return { mylink, gid: null, landingUrl: targetUrl, expirationMinutes, nonstop: true };
  }

  // gid path
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
  if (!r1.ok) throw new Error(`landing request failed: ${r1.status}`);
  const j1 = await r1.json().catch(() => ({}));
  const landingUrl = j1?.data?.url;
  const gid = j1?.data?.gid;
  if (!landingUrl || !gid) throw new Error("Invalid landing-url response");

  const r2 = await fetch(`${BACKOFFICE}/partner/v2/mylink`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "partner-access-token": token,
      "origin": "https://partner.myrealtrip.com",
    },
    body: JSON.stringify({ targetUrl: landingUrl }),
  });
  if (!r2.ok) throw new Error(`mylink request failed: ${r2.status}`);
  const j2 = await r2.json().catch(() => ({}));
  const mylink = j2?.data?.mylink;
  const expirationMinutes = j2?.data?.expirationMinutes ?? null;
  if (!mylink) throw new Error("Invalid mylink response");
  return { mylink, gid, landingUrl, expirationMinutes, nonstop: false };
}


