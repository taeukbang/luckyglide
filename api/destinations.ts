import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DESTINATIONS } from "../server/cities";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const regions = Array.from(new Set(DESTINATIONS.map((d) => d.region)));
  return res.status(200).json({ regions, destinations: DESTINATIONS });
}


