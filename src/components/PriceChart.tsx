import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { buildMrtBookingUrl, addDaysIsoKST } from "@/lib/utils";

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
    if (!active || !payload || !payload.length) return null;
    const price = Number(payload[0]?.value);
    const dep = parseMMDD(label);
    const arr = new Date(dep);
    const len = Math.max(1, Number(tripDays) || 1);
    arr.setDate(arr.getDate() + (len - 1));
    const yyyy = new Date().getFullYear();
    const toIso = (d: Date) => {
      const y = yyyy;
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${da}`;
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
            <a href={bookingUrl} target="_blank" rel="noreferrer" style={{
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

  const minPoint = (data && data.length)
    ? data.reduce((acc, cur) => (cur.price < acc.price ? cur : acc))
    : null as any;

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isMin = !!(minPoint && payload?.date === minPoint.date && Number(payload?.price) === Number(minPoint.price));
    const r = isMin ? 6 : 2;
    const fill = isMin ? "hsl(var(--destructive))" : "hsl(var(--primary))";
    const stroke = isMin ? "hsl(var(--destructive))" : "hsl(var(--primary))";
    return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={isMin ? 2 : 1} />;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto' }} />
          <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={<CustomDot />} />
          {minPoint ? (
            <ReferenceDot x={minPoint.date} y={minPoint.price} r={8} fill="transparent" stroke="hsl(var(--destructive))" strokeWidth={2} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
