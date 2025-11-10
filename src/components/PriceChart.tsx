import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceArea, ReferenceLine } from "recharts";
import { useEffect, useRef, useState } from "react";
import { buildMrtBookingUrl, addDaysIsoKST } from "@/lib/utils";
import { gaEvent } from "@/lib/ga";
import { buildHolidayRangesForDomain, HolidayRangeIso } from "@/lib/holidays";

interface PriceChartProps {
  data: {
    date: string;
    price: number;
  }[];
  tripDays: number;
  bookingFromCode?: string;
  bookingToCode?: string;
  bookingToNameKo?: string;
  nonstop?: boolean;
}

export const PriceChart = ({ data, tripDays, bookingFromCode = "ICN", bookingToCode, bookingToNameKo, nonstop }: PriceChartProps) => {
  const [locked, setLocked] = useState(false);
  const [lockedPoint, setLockedPoint] = useState<{
    label: string;
    price: number;
    x: number;
    y: number;
  } | null>(null);
  const lastHoverRef = useRef<{
    label: string;
    price: number;
    x: number;
    y: number;
  } | null>(null);
  const toMMDD = (d: Date) => {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${m}/${da}`;
  };
  const parseMMDD = (mmdd: string) => {
    const [mm, dd] = String(mmdd).split("/");
    const base = new Date();
    const dt = new Date(base.getFullYear(), Math.max(0, Number(mm) - 1), Number(dd));
    return dt;
  };


  const CustomTooltip = ({ active, payload, label }: any) => {
    const effectiveActive = locked ? true : active;
    const effectiveLabel = locked && lockedPoint ? lockedPoint.label : label;
    const effectivePrice = locked && lockedPoint ? Number(lockedPoint.price) : Number(payload?.[0]?.value);
    if (!effectiveActive || !effectiveLabel || Number.isNaN(effectivePrice)) return null;
    const price = effectivePrice;
    const dep = parseMMDD(String(effectiveLabel));
    const arr = new Date(dep);
    const len = Math.max(1, Number(tripDays) || 1);
    arr.setDate(arr.getDate() + (len - 1));
    // 현재 연도 기준으로, 과거 날짜면 다음 해로 롤오버
    const today = new Date();
    const yyyy = today.getFullYear();
    const toIso = (d: Date) => {
      let year = yyyy;
      const candidate = new Date(year, d.getMonth(), d.getDate());
      if (candidate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        year += 1;
      }
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${year}-${m}-${da}`;
    };
    const depIso = toIso(dep);
    const retIso = addDaysIsoKST(depIso, len - 1);
    const bookingUrl = (bookingToCode && bookingToNameKo)
      ? buildMrtBookingUrl({ from: bookingFromCode, to: bookingToCode, toNameKo: bookingToNameKo, fromNameKo: "인천", depdt: depIso, rtndt: retIso }, { nonstop: !!nonstop })
      : null;
    return (
      <div style={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, padding: 8 }}>
        <div style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>출발일: {toMMDD(dep)}</div>
        <div style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>도착일: {toMMDD(arr)}</div>
        <div style={{ color: "hsl(var(--foreground))", fontSize: 12, marginTop: 4 }}>가격: ₩{price.toLocaleString()}</div>
        {bookingUrl ? (
          <div style={{ marginTop: 8 }}>
            <a href={bookingUrl} target="_blank" rel="noreferrer" onClick={()=>{
              gaEvent('click_graph', { code: bookingToCode, city: bookingToNameKo, depdt: depIso, rtndt: retIso, nonstop: !!nonstop, price });
            }} style={{
              display: "inline-block",
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 6,
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              textDecoration: "none"
            }}>이 가격으로 예약하기</a>
          </div>
        ) : null}
      </div>
    );
  };

  // ---- Build continuous domain (fill missing days with price: null) ----
  const buildFilled = () => {
    const raw = Array.isArray(data) ? data : [];
    if (!raw.length) return { domain: [] as string[], rows: [] as { date: string; price: number | null }[] };
    const startMMDD = String(raw[0].date);
    const endMMDD = String(raw[raw.length - 1].date);
    const today = new Date();
    const [smm, sdd] = startMMDD.split("/");
    let year = today.getFullYear();
    const candidate = new Date(year, Number(smm) - 1, Number(sdd));
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (candidate < todayMid) year += 1; // rollover to next year
    const cur = new Date(year, Number(smm) - 1, Number(sdd));

    const domain: string[] = [];
    const rows: { date: string; price: number | null }[] = [];
    let ptr = 0;
    for (let i = 0; i < 370; i++) {
      const mm = String(cur.getMonth() + 1).padStart(2, "0");
      const dd = String(cur.getDate()).padStart(2, "0");
      const mmdd = `${mm}/${dd}`;
      domain.push(mmdd);
      let price: number | null = null;
      if (ptr < raw.length && String(raw[ptr].date) === mmdd) {
        const p = Number((raw[ptr] as any).price);
        price = Number.isFinite(p) ? p : null;
        ptr++;
      }
      rows.push({ date: mmdd, price });
      if (mmdd === endMMDD && (i > 0 || startMMDD === endMMDD)) break;
      cur.setDate(cur.getDate() + 1);
    }
    return { domain, rows };
  };

  const filled = buildFilled();
  const domainMMDD = filled.domain.length ? filled.domain : (Array.isArray(data) ? data.map((d) => String(d.date)) : []);
  const chartData = filled.rows.length ? filled.rows : (Array.isArray(data) ? data : []);

  const minPoint = (chartData && chartData.length)
    ? chartData.reduce((acc: any, cur: any) => {
        if (cur.price === null || cur.price === undefined || Number.isNaN(Number(cur.price))) return acc;
        if (!acc || Number(cur.price) < Number(acc.price)) return cur;
        return acc;
      }, null as any)
    : null as any;

  const CustomDot = (props: any) => {
    const { cx, cy, payload, value } = props;
    const raw = (payload && Object.prototype.hasOwnProperty.call(payload, 'price')) ? payload.price : value;
    if (raw === null || raw === undefined) return null; // strictly skip null/undefined
    const val = Number(raw);
    if (!Number.isFinite(val)) return null; // skip NaN/Infinity
    const isMin = !!(minPoint && payload?.date === minPoint.date && Number(payload?.price) === Number(minPoint.price));
    const r = isMin ? 6 : 2;
    const fill = isMin ? "#ef4444" : "#3b82f6";
    const stroke = isMin ? "#ef4444" : "#3b82f6";
    return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={isMin ? 2 : 1} />;
  };

  // ---- Holidays (background shading) ----
  const [holidayRanges, setHolidayRanges] = useState(() => [] as ReturnType<typeof buildHolidayRangesForDomain>);
  const [mmddIsoMap, setMmddIsoMap] = useState({} as Record<string, string>);
  useEffect(() => {
    (async () => {
      try {
        const today = new Date();
        const years = [today.getFullYear(), today.getFullYear() + 1];
        // Build an approximate ISO mapping for domain MM/DD (year rollover after 'today')
        const domainIsoSet = new Set<string>();
        const localMap: Record<string, string> = {};
        for (const mmdd of domainMMDD) {
          const [mmStr, ddStr] = String(mmdd).split("/");
          let year = today.getFullYear();
          const candidate = new Date(year, Number(mmStr) - 1, Number(ddStr));
          const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          if (candidate < todayMid) year += 1; // rollover
          const iso = `${year}-${String(mmStr).padStart(2, "0")}-${String(ddStr).padStart(2, "0")}`;
          domainIsoSet.add(iso);
          localMap[String(mmdd)] = iso;
        }
        setMmddIsoMap(localMap);

        // weekend shading computed immediately
        const weekendRanges = (() => {
          const out: { startMMDD: string; endMMDD: string; label: string }[] = [];
          let runStart: string | null = null;
          let prevIdx = -1;
          for (let i = 0; i < domainMMDD.length; i++) {
            const mmdd = domainMMDD[i];
            const iso = localMap[mmdd];
            if (!iso) continue;
            const [y, m, d] = iso.split("-").map((s) => Number(s));
            const dow = new Date(y, m - 1, d).getDay();
            const isWeekend = (dow === 0 || dow === 6);
            if (isWeekend) {
              if (runStart == null) { runStart = mmdd; prevIdx = i; }
              else if (i !== prevIdx + 1) { out.push({ startMMDD: runStart, endMMDD: domainMMDD[prevIdx], label: "주말" }); runStart = mmdd; }
              prevIdx = i;
            } else if (runStart != null) {
              out.push({ startMMDD: runStart, endMMDD: domainMMDD[prevIdx], label: "주말" });
              runStart = null;
            }
          }
        if (runStart != null) out.push({ startMMDD: runStart, endMMDD: domainMMDD[prevIdx], label: "주말" });
          return out;
        })();
        setHolidayRanges(weekendRanges as any);

        // fetch public holidays and merge
        let mmddRanges: ReturnType<typeof buildHolidayRangesForDomain> = [];
        try {
          const r = await fetch(`/api/kr-holidays?years=${years.join(',')}`);
          if (r.ok) {
            const json = await r.json();
            const customRanges: HolidayRangeIso[] = Array.isArray(json?.ranges) ? json.ranges : [];
            mmddRanges = buildHolidayRangesForDomain({ domainMMDD, years, customIsoRanges: customRanges, domainIsoSet });
          }
        } catch {}
        setHolidayRanges([...(weekendRanges as any), ...mmddRanges]);
      } catch {}
    })();
  }, [JSON.stringify(domainMMDD)]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onMouseMove={(state: any) => {
            if (!state || locked) return;
            const { activeLabel, activePayload, chartX, chartY } = state;
            if (!activeLabel || !activePayload || !activePayload.length) return;
            const price = Number(activePayload[0]?.value);
            if (Number.isNaN(price)) return;
            lastHoverRef.current = {
              label: String(activeLabel),
              price,
              x: chartX,
              y: chartY,
            };
          }}
          onClick={() => {
            if (!locked) {
              if (lastHoverRef.current) {
                setLockedPoint(lastHoverRef.current);
                setLocked(true);
              }
            } else {
              setLocked(false);
              setLockedPoint(null);
            }
          }}
          onMouseLeave={() => {
            if (!locked) {
              lastHoverRef.current = null;
            }
          }}
          style={{ cursor: locked ? "default" : "crosshair" }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            stroke="hsl(var(--border))"
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            stroke="hsl(var(--border))"
            tickFormatter={(value) => `₩${(value / 10000).toFixed(0)}만`}
          />
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{ pointerEvents: 'auto' }}
            allowEscapeViewBox={{ x: true, y: true }}
            isAnimationActive={false}
            {...(locked && lockedPoint
              ? {
                  active: true as any,
                  label: lockedPoint.label as any,
                  position: { x: lockedPoint.x, y: lockedPoint.y } as any,
                }
              : {})}
          />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={<CustomDot />} connectNulls />
          {minPoint ? (
            <ReferenceDot x={minPoint.date} y={minPoint.price} r={8} fill="transparent" stroke="#ef4444" strokeWidth={2} />
          ) : null}
          {holidayRanges.map((h, idx) => {
            const startIdx = domainMMDD.indexOf(h.startMMDD);
            const endIdx = domainMMDD.indexOf(h.endMMDD);
            const span = startIdx >= 0 && endIdx >= 0 ? (endIdx - startIdx + 1) : 1;
            const mid = startIdx >= 0 && endIdx >= 0 ? domainMMDD[Math.floor((startIdx + endIdx) / 2)] : h.startMMDD;
            const dy = (idx % 3) * 12; // stagger labels to reduce overlap
            // weekend-only? -> omit label but still shade
            const isWeekendOnly = (() => {
              if (startIdx < 0 || endIdx < 0) return false;
              for (let i = startIdx; i <= endIdx; i++) {
                const iso = mmddIsoMap[domainMMDD[i]];
                if (!iso) return false;
                const [y, m, d] = iso.split("-").map((s) => Number(s));
                const dow = new Date(y, m - 1, d).getDay();
                if (dow !== 0 && dow !== 6) return false; // weekday exists
              }
              return true;
            })();
            const shadeRGBA = "rgba(239, 68, 68, 0.12)"; // unified color for fill & line
            return (
              <>
                {/* Always shade (even single-day) */}
                <ReferenceArea key={`area-${idx}`} x1={h.startMMDD} x2={h.endMMDD} fill={shadeRGBA} ifOverflow="extendDomain" />
                {/* Extra vertical line for single-day to increase visibility */}
                {span <= 1 && !isWeekendOnly ? (
                  <ReferenceLine key={`line-${idx}`} x={h.startMMDD} stroke={shadeRGBA} strokeWidth={2} />
                ) : null}
                {!isWeekendOnly ? (
                  <ReferenceLine key={`label-${idx}`} x={mid} strokeOpacity={0} label={{ value: h.label, position: "insideTop", dy, fill: "hsl(var(--foreground))", fontSize: 10 }} />
                ) : null}
              </>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
