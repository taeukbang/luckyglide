export interface CalendarRequest {
  from: string;
  to: string;
  departureDate: string; // YYYY-MM-DD
  period: number; // e.g., 30
  transfer: number; // -1: all
  international: boolean;
  airlines: string[]; // ["All"] or codes
}

export interface CalendarEntry {
  date: string;
  airline: string;
  price: number;
}

export interface CalendarResponse {
  from: string;
  to: string;
  flightCalendarInfoResults: CalendarEntry[];
}

const BASE_URL = process.env.MRT_CAL_BASE ?? "https://api3.myrealtrip.com";

export async function fetchCalendar(request: CalendarRequest): Promise<CalendarResponse> {
  const url = `${BASE_URL}/flight/api/price/calendar`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Calendar API error: ${res.status} ${text}`);
  }
  return res.json() as Promise<CalendarResponse>;
}

export function pickMinEntry(data: CalendarResponse) {
  const arr = data.flightCalendarInfoResults ?? [];
  if (!arr.length) return null;
  return arr.reduce((min, cur) => (cur.price < (min?.price ?? Infinity) ? cur : min));
}

// Find exact entry by ISO date (YYYY-MM-DD). Returns null if not found.
export function pickEntryByDate(data: CalendarResponse, isoDate: string) {
  const arr = data.flightCalendarInfoResults ?? [];
  if (!arr.length) return null;
  const found = arr.find((e) => String(e.date) === String(isoDate));
  return found ?? null;
}


