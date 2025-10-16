export const config = { runtime: "edge" };
import { DESTINATIONS_ALL } from "./_cities";
import { createClient } from "@supabase/supabase-js";

type Item = {
  code: string;
  city: string;
  region: string;
  price: number | null;
  originalPrice: number | null;
  departureDate: string | null;
  returnDate: string | null;
  airline: string | null;
  tripDays: number | null;
  collectedAt: string | null;
};

export default async function handler(req: Request): Promise<Response> {
  if ((req as any).method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders() });
  try {
    const { searchParams } = new URL(req.url);
    const from = String(searchParams.get("from") ?? "ICN");
    const region = searchParams.get("region");
    const codesParam = String(searchParams.get("codes") ?? "");

    let targets = DESTINATIONS_ALL;
    if (region && region !== "모두") targets = targets.filter((d) => d.region === region);
    if (codesParam) {
      const set = new Set(codesParam.split(",").map((s) => s.trim()).filter(Boolean));
      targets = targets.filter((d) => set.has(d.code));
    }
    const codes = targets.map((d) => d.code);

    const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string | undefined;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Supabase env missing" }, 500);
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: extrema, error: errExt } = await supabase
      .from("fares_city_extrema")
      .select("from,to,departure_date,return_date,trip_days,min_price,max_price,min_airline,collected_at")
      .eq("from", from)
      .in("to", codes);
    if (errExt) throw errExt;

    const byTo = new Map<string, any>((extrema ?? []).map((r: any) => [r.to, r]));
    const items: Item[] = targets.map((t) => {
      const r = byTo.get(t.code);
      return {
        code: t.code,
        city: t.nameKo,
        region: t.region,
        price: r?.min_price !== null && r?.min_price !== undefined ? Number(r.min_price) : null,
        originalPrice: r?.max_price !== null && r?.max_price !== undefined ? Number(r.max_price) : null,
        tripDays: r?.trip_days !== null && r?.trip_days !== undefined ? Number(r.trip_days) : null,
        departureDate: r?.departure_date ?? null,
        returnDate: r?.return_date ?? null,
        airline: r?.min_airline ?? null,
        collectedAt: r?.collected_at ?? null,
      } as Item;
    });

    return json({ count: items.length, items });
  } catch (e: any) {
    return json({ error: e?.message ?? "internal error" }, 500);
  }
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders() } });
}
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
}


