export const config = { runtime: "edge" };
import { DESTINATIONS_ALL } from "./_cities.js";

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders() });
  }
  try {
    const regions = Array.from(new Set(DESTINATIONS_ALL.map((d) => d.region)));
    return json({ regions, destinations: DESTINATIONS_ALL });
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


