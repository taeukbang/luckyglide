/*
  마이링크 생성 스크립트
  - Supabase에서 예약 URL 패턴을 생성하고 마이링크 생성 API를 호출하여 변환
  - 로컬 환경에서 실행 (IP 화이트리스트 문제 해결)
  - 생성된 마이링크를 Supabase에 저장
*/

import { createClient } from "@supabase/supabase-js";
import { DESTINATIONS } from "../server/cities";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

// 예약 URL 생성 (utils.ts의 buildMrtBookingUrl과 동일한 로직)
function buildMrtBookingUrl(params: {
  from: string;
  fromNameKo?: string;
  to: string;
  toNameKo: string;
  depdt: string;
  rtndt: string;
  nonstop?: boolean;
}): string {
  const { from, fromNameKo = "인천", to, toNameKo, depdt, rtndt, nonstop = false } = params;
  const base = "https://flights.myrealtrip.com/air/b2c/AIR/INT/AIRINTSCH0100100010.k1";
  const qs = new URLSearchParams();
  const push = (k: string, v: string) => qs.append(k, v);
  push("initform", "RT");
  push("domintgubun", "I");
  push("depctycd", from); push("depctycd", to); push("depctycd", ""); push("depctycd", "");
  push("depctynm", fromNameKo); push("depctynm", toNameKo); push("depctynm", ""); push("depctynm", "");
  push("arrctycd", to); push("arrctycd", from); push("arrctycd", ""); push("arrctycd", "");
  push("arrctynm", toNameKo); push("arrctynm", fromNameKo); push("arrctynm", ""); push("arrctynm", "");
  push("depdt", depdt); push("depdt", rtndt); push("depdt", ""); push("depdt", "");
  push("opencase", "N"); push("opencase", "N"); push("opencase", "N");
  push("openday", ""); push("openday", ""); push("openday", "");
  push("depdomintgbn", "I");
  push("secrchType", "FARE");
  push("maxprice", "");
  push("availcount", "250");
  push("tasktype", "B2C");
  push("adtcount", "1");
  push("chdcount", "0");
  push("infcount", "0");
  push("cabinclass", "Y");
  push("nonstop", nonstop ? "Y" : "");
  push("freebag", "");
  push("orgDepctycd", ""); push("orgDepctycd", ""); push("orgDepctycd", ""); push("orgDepctycd", "");
  push("orgArrctycd", ""); push("orgArrctycd", ""); push("orgArrctycd", ""); push("orgArrctycd", "");
  push("orgPreferaircd", "");
  push("preferaircd", "");
  const MRT_KSESID = "air:b2c:SELK138RB:SELK138RB::00";
  if (MRT_KSESID) push("KSESID", String(MRT_KSESID));
  const built = `${base}?${qs.toString()}`;
  return built.includes("KSESID=") ? built : `${built}&KSESID=${encodeURIComponent(MRT_KSESID)}`;
}

// 마이링크 생성 API 호출
async function createMylink(targetUrl: string, apiKey: string): Promise<string | null> {
  try {
    const apiUrl = "https://partner-ext-api.myrealtrip.com/v1/mylink";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targetUrl }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[mylink-api] Error ${response.status}: ${text}`);
      return null;
    }
    
    const data = await response.json();
    const mylink = data?.data?.mylink as string | undefined;
    return mylink || null;
  } catch (e: any) {
    console.error(`[mylink-api] Exception: ${e?.message || e}`);
    return null;
  }
}

async function main() {
  const partnerId = process.env.PARTNER_ID;
  if (!partnerId) {
    console.error("PARTNER_ID environment variable is required");
    process.exit(1);
  }
  
  const apiKeyEnvName = `MRT_PARTNER_API_KEY_${partnerId}`;
  const apiKey = process.env[apiKeyEnvName];
  if (!apiKey) {
    console.error(`API key not found: ${apiKeyEnvName}`);
    process.exit(1);
  }
  
  const from = process.env.GEN_FROM || "ICN";
  const days = Number(process.env.GEN_DAYS || 14);
  const minTripDays = Number(process.env.GEN_MIN_DAYS || 3);
  const maxTripDays = Number(process.env.GEN_MAX_DAYS || 7);
  const nonstop = process.env.GEN_NONSTOP === "true";
  
  // Optional filters
  const filterCodes = (process.env.GEN_CODES || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  
  let targets = DESTINATIONS;
  if (filterCodes.length) {
    targets = targets.filter(t => filterCodes.includes(t.code));
  }
  
  if (!targets.length) {
    console.log("No targets after filters; exiting.");
    return;
  }
  
  const startBase = new Date();
  startBase.setDate(startBase.getDate() + 1); // tomorrow
  const startDate = formatIso(startBase);
  
  console.log(`[generate-mylinks] partner=${partnerId} from=${from} targets=${targets.length} days=${days} tripDays=${minTripDays}-${maxTripDays} nonstop=${nonstop}`);
  
  let success = 0;
  let fail = 0;
  let skipped = 0;
  
  for (const target of targets) {
    for (let i = 0; i < days; i++) {
      const dep = new Date(startBase);
      dep.setDate(dep.getDate() + i);
      const depStr = formatIso(dep);
      
      for (let tripDays = minTripDays; tripDays <= maxTripDays; tripDays++) {
        const ret = new Date(dep);
        ret.setDate(ret.getDate() + (tripDays - 1));
        const retStr = formatIso(ret);
        
        // 예약 URL 생성
        const bookingUrl = buildMrtBookingUrl({
          from,
          fromNameKo: "인천",
          to: target.code,
          toNameKo: target.nameKo,
          depdt: depStr,
          rtndt: retStr,
          nonstop,
        });
        
        // 이미 존재하는지 확인
        const { data: existing } = await supabase
          .from("partner_mylinks")
          .select("id, mylink")
          .eq("partner_id", partnerId)
          .eq("from", from)
          .eq("to", target.code)
          .eq("departure_date", depStr)
          .eq("return_date", retStr)
          .eq("trip_days", tripDays)
          .eq("nonstop", nonstop)
          .maybeSingle();
        
        if (existing?.mylink) {
          skipped++;
          continue;
        }
        
        // 마이링크 생성
        const mylink = await createMylink(bookingUrl, apiKey);
        
        if (!mylink) {
          fail++;
          console.error(`[fail] ${partnerId} ${from}->${target.code} ${depStr}~${retStr} (${tripDays}일) - 마이링크 생성 실패`);
          continue;
        }
        
        // Supabase에 저장 (upsert)
        const { error } = await supabase
          .from("partner_mylinks")
          .upsert({
            partner_id: partnerId,
            from,
            to: target.code,
            departure_date: depStr,
            return_date: retStr,
            trip_days: tripDays,
            nonstop,
            booking_url: bookingUrl,
            mylink,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "partner_id,from,to,departure_date,return_date,trip_days,nonstop"
          });
        
        if (error) {
          fail++;
          console.error(`[fail] ${partnerId} ${from}->${target.code} ${depStr}~${retStr} (${tripDays}일) - 저장 실패: ${error.message}`);
        } else {
          success++;
          console.log(`[ok] ${partnerId} ${from}->${target.code} ${depStr}~${retStr} (${tripDays}일) - ${mylink.slice(0, 30)}...`);
        }
        
        // API 호출 제한을 고려한 딜레이 (선택사항)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  console.log(`[done] partner=${partnerId} success=${success} fail=${fail} skipped=${skipped}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


