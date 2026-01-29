export const config = { runtime: "edge" };

import { createClient } from "@supabase/supabase-js";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const depdt = searchParams.get("depdt");
    const rtndt = searchParams.get("rtndt");
    const tripDays = searchParams.get("tripDays");
    const nonstop = searchParams.get("nonstop") === "true";
    
    if (!partnerId || !from || !to || !depdt) {
      return json({ error: "partnerId, from, to, depdt are required" }, 400);
    }
    
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Supabase env missing" }, 500);
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Supabase에서 마이링크 조회
    let query = supabase
      .from("partner_mylinks")
      .select("mylink")
      .eq("partner_id", partnerId)
      .eq("from", from)
      .eq("to", to)
      .eq("departure_date", depdt);
    
    if (rtndt) {
      query = query.eq("return_date", rtndt);
    }
    
    if (tripDays) {
      query = query.eq("trip_days", Number(tripDays));
    }
    
    query = query.eq("nonstop", nonstop);
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      return json({ error: `Supabase query error: ${error.message}` }, 500);
    }
    
    if (!data || !data.mylink) {
      return json({ mylink: null }, 200);
    }
    
    return json({ mylink: data.mylink }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}




