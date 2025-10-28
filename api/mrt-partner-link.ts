export const config = { runtime: "edge" };

import { getPartnerAccessToken } from "../server/mrtPartnerAuth";

const BACKOFFICE = "https://api3-backoffice.myrealtrip.com";

function toCityCode(iata: string) {
  const up = String(iata || "").toUpperCase();
  const map: Record<string, string> = {
    ICN: "SEL", GMP: "SEL",
    KIX: "OSA", ITM: "OSA",
    NRT: "TYO", HND: "TYO",
    JFK: "NYC", LGA: "NYC", EWR: "NYC",
    LHR: "LON", LGW: "LON", LTN: "LON", STN: "LON", LCY: "LON", SEN: "LON",
    CDG: "PAR", ORY: "PAR", BVA: "PAR",
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

    const { from, to, depdt, rtndt, tripType = "RT" } = await req.json();
    if (!from || !to || !depdt || !rtndt) return json({ error: "from, to, depdt, rtndt are required" }, 400);

    const token = await getPartnerAccessToken();
    const depCity = toCityCode(from);
    const arrCity = toCityCode(to);

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


