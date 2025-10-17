import React from "react";

type Point = { date: string; price: number };

export function Sparkline({ data, width = "100%", height = 56, stroke = "hsl(var(--primary))", minColor = "hsl(var(--destructive))", bg = "hsl(var(--muted))", showEdgeLabels = true, labelColor = "hsl(var(--muted-foreground))" }: { data: Point[]; width?: number | string; height?: number; stroke?: string; minColor?: string; bg?: string; showEdgeLabels?: boolean; labelColor?: string }) {
  const pad = 1;
  // 내부 좌표 계산용 가상 너비 (viewBox 기준)
  const vbw = 600;
  const vbh = typeof height === 'number' ? height : 56;
  const w = vbw - pad * 2;
  const h = vbh - pad * 2;
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const xs = data.map((_, i) => i);
  const ys = data.map(p => p.price);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (i: number) => pad + (w * i) / (xs.length - 1);
  const scaleY = (v: number) => pad + h - (h * (v - minY)) / Math.max(1, maxY - minY);
  const d = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.price)}`).join(" ");
  const minIdx = ys.indexOf(minY);
  const minPoint = { x: scaleX(minIdx), y: scaleY(minY) };
  // YYYY/MM/DD 라벨 생성: MM/DD 시퀀스가 연말을 넘을 때 해를 +1
  const baseYear = new Date().getFullYear();
  let yr = baseYear;
  let prevMonth: number | null = null;
  const ymd = data.map((p) => {
    const [mmStr, ddStr] = String(p.date).split("/");
    const mm = Number(mmStr || 1);
    const dd = Number(ddStr || 1);
    if (prevMonth !== null && mm < prevMonth) yr += 1;
    prevMonth = mm;
    const YYYY = yr;
    const MM = String(mm).padStart(2, "0");
    const DD = String(dd).padStart(2, "0");
    return `${YYYY}/${MM}/${DD}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${vbw} ${vbh}`}>
      <rect x={0} y={0} width={vbw} height={vbh} fill={bg} rx={6} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
      {/* 최저가 포인트 표시 */}
      <circle cx={minPoint.x} cy={minPoint.y} r={3.5} fill={minColor} />
      {showEdgeLabels && (
        <>
          <text x={pad + 2} y={vbh - 2} fontSize={14} fill={labelColor} textAnchor="start">
            {ymd[0]}
          </text>
          <text x={vbw - pad - 2} y={vbh - 2} fontSize={14} fill={labelColor} textAnchor="end">
            {ymd[ymd.length - 1]}
          </text>
        </>
      )}
    </svg>
  );
}


