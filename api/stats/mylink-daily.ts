export const config = { 
  runtime: "edge",
};

import { createClient } from "@supabase/supabase-js";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { 
    status, 
    headers: { "content-type": "application/json", ...corsHeaders() } 
  });
}

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate");     // YYYY-MM-DD
    const limit = Number(searchParams.get("limit") || "30");
    
    if (!partnerId) {
      return json({ error: "partnerId is required" }, 400);
    }
    
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Supabase env missing" }, 500);
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Supabase에서 통계 조회
    let query = supabase
      .from("partner_mylink_stats")
      .select("date, count")
      .eq("partner_id", partnerId)
      .order("date", { ascending: false })
      .limit(limit);
    
    if (startDate) {
      query = query.gte("date", startDate);
    }
    
    if (endDate) {
      query = query.lte("date", endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return json({ error: `Supabase query error: ${error.message}` }, 500);
    }
    
    const total = data?.reduce((sum, d) => sum + d.count, 0) || 0;
    
    return json({
      partner_id: partnerId,
      period: { 
        start: startDate || null, 
        end: endDate || null 
      },
      total,
      days: data?.length || 0,
      daily: data || []
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}


