import { fetchCalendar, CalendarEntry, pickMinEntry } from "./myrealtrip";
import { supabase, hasSupabase } from "./supabase";

export interface ScanParams {
  from: string;
  to: string;
  startDate: string; // YYYY-MM-DD (tomorrow)
  days: number; // how many days to scan forward e.g., 30
  minTripDays?: number; // default 3
  maxTripDays?: number; // default 7
}

export interface StoredFareRow {
  from: string;
  to: string;
  departure_date: string;
  return_date: string;
  trip_days: number;
  min_price: number | null;
  min_airline: string | null;
  collected_at: string; // ISO
  is_latest?: boolean;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function scanAndStore(params: ScanParams) {
  const { from, to, startDate, days, minTripDays = 3, maxTripDays = 7 } = params;

  const base = new Date(startDate);
  const end = new Date(base);
  end.setDate(end.getDate() + days);

  const results: StoredFareRow[] = [];

  for (let d = new Date(base); d <= end; d.setDate(d.getDate() + 1)) {
    for (let len = minTripDays; len <= maxTripDays; len++) {
      const dep = new Date(d);
      const ret = new Date(d);
      // 복귀일은 UI 표기와 동일하게 출발일 + (여행일수 - 1)
      ret.setDate(ret.getDate() + (len - 1));

      const depStr = formatDate(dep);
      // 캘린더 API는 출발일 기준으로 period 범위 가격을 반환
      const data = await fetchCalendar({
        from,
        to,
        departureDate: depStr,
        period: len, // 여행일수만큼 최소 범위로 조회(보수적 접근)
        transfer: -1,
        international: true,
        airlines: ["All"],
      });

      // 창 전체에서의 최저가 항목을 선택하고, 해당 항목의 날짜를 출발일로 사용
      const windowMin: CalendarEntry | null = pickMinEntry(data);
      const depUseStr = windowMin?.date ?? depStr;
      const depUse = new Date(depUseStr);
      const retUse = new Date(depUse);
      retUse.setDate(retUse.getDate() + (len - 1));

      results.push({
        from,
        to,
        departure_date: depUseStr,
        return_date: formatDate(retUse),
        trip_days: len,
        min_price: windowMin?.price ?? null,
        min_airline: windowMin?.airline ?? null,
        collected_at: new Date().toISOString(),
      });
    }
  }

  // insert rows to supabase: mark previous latest as false, then insert new rows as latest
  if (hasSupabase) {
    // 1) 이전 최신 플래그 해제: 해당 from/to에 대해 모두 false 처리
    //    주의: 대량 업데이트지만 인덱스(where is_latest=true)로 비용 최소화
    const routeSet = new Set(results.map(r => `${r.from}|${r.to}`));
    for (const key of routeSet) {
      const [f, t] = key.split("|");
      await supabase
        .from("fares")
        .update({ is_latest: false })
        .eq("from", f)
        .eq("to", t)
        .eq("is_latest", true);
    }
    // Set latest flag for new rows
    const rows = results.map(r => ({ ...r, is_latest: true }));
    const { error } = await supabase.from("fares").insert(rows);
    if (error) throw error;
  }

  return { rows: results.length };
}


