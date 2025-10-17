import React from "react";

type Point = { date: string; price: number };

export function Sparkline({ data, width = 280, height = 56, stroke = "hsl(var(--primary))" }: { data: Point[]; width?: number; height?: number; stroke?: string }) {
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const xs = data.map((_, i) => i);
  const ys = data.map(p => p.price);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (i: number) => pad + (w * i) / (xs.length - 1);
  const scaleY = (v: number) => pad + h - (h * (v - minY)) / Math.max(1, maxY - minY);
  const d = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.price)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}


