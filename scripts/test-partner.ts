import "dotenv/config";
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

async function main() {
  const from = process.env.TEST_FROM ?? "ICN";
  const to = process.env.TEST_TO ?? "KIX";
  const depdt = process.env.TEST_DEPDT ?? "2025-11-12";
  const rtndt = process.env.TEST_RTND ?? "2025-11-14";

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
      tripTypeCd: "RT",
    }),
  });
  const j1 = await r1.json().catch(() => ({}));
  console.log("step1 status:", r1.status, "body:", j1);
  if (!r1.ok) return;
  const landingUrl = j1?.data?.url;
  const gid = j1?.data?.gid;
  console.log("landingUrl:", landingUrl, "gid:", gid);

  const r2 = await fetch(`${BACKOFFICE}/partner/v2/mylink`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "partner-access-token": token,
      "origin": "https://partner.myrealtrip.com",
    },
    body: JSON.stringify({ targetUrl: landingUrl }),
  });
  const j2 = await r2.json().catch(() => ({}));
  console.log("step2 status:", r2.status, "body:", j2);
}

main().catch((e) => { console.error(e); process.exit(1); });


