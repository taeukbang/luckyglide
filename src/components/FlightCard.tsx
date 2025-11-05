import { emojiFromCountryCode, flagUrlFromCountryCode, fallbackFlagUrl, codeToCountry } from "@/lib/flags";
import { Card, CardContent } from "@/components/ui/card";
import { buildMrtBookingUrl } from "@/lib/utils";
import { gaEvent } from "@/lib/ga";
import { Button } from "@/components/ui/button";
import { Sparkline } from "./Sparkline";
import { useEffect, useState } from "react";

interface FlightCardProps {
  city: string;
  country: string;
  countryCode?: string; // optional for API data without flag
  price?: number | null;
  originalPrice?: number | null;
  discount?: number | null;
  travelDates: string;
  collectedAt?: string | null;
  meta?: {
    code?: string;
    tripDays?: number;
  };
  nonstop?: boolean;
  onClick: () => void;
  onShowChart?: () => void;
  onRefresh?: () => void;
  refreshLoading?: boolean;
  justRefreshed?: boolean;
}

export const FlightCard = ({
  city,
  country,
  countryCode,
  price,
  originalPrice,
  discount,
  travelDates,
  collectedAt,
  onClick,
  meta,
  onShowChart,
  onRefresh,
  refreshLoading,
  justRefreshed,
  nonstop,
}: FlightCardProps) => {
  const [openSpark, setOpenSpark] = useState(false);
  const [sparkData, setSparkData] = useState<{ date: string; price: number }[]>([]);
  const [sparkLoading, setSparkLoading] = useState(false);
  useEffect(() => {
    if (!openSpark || !meta?.code) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        setSparkLoading(true);
        setSparkData([]);
        const res = await fetch('/api/calendar-window-db', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'ICN', to: meta.code, tripDays: meta?.tripDays || 3, days: 180 }), signal: ctrl.signal });
        const data = await res.json();
        const arr = (data.items || []).map((d: any) => ({ date: d.date, price: Number(d.price) }));
        const n = 60;
        const step = Math.max(1, Math.ceil(arr.length / n));
        const sampled = arr.filter((_, i) => i % step === 0);
        setSparkData(sampled);
      } catch {}
      finally { setSparkLoading(false); }
    })();
    return () => ctrl.abort();
  }, [openSpark, meta?.code, meta?.tripDays]);
  const formatCollected = (iso?: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${y}-${m}-${da} ${hh}:${mm}`;
    } catch {
      return null;
    }
  };
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200 ${justRefreshed ? 'lg-flash-outline' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted">
              {(() => {
                const resolvedCode = countryCode || (meta?.code ? codeToCountry[meta.code]?.countryCode : undefined);
                const resolvedName = country || (meta?.code ? codeToCountry[meta.code]?.countryKo : undefined) || "";
                return resolvedCode ? (
                <img
                  src={flagUrlFromCountryCode(resolvedCode, 24) || fallbackFlagUrl(resolvedCode)}
                  alt={resolvedName}
                  width={24}
                  height={24}
                  className="object-contain"
                  loading="lazy"
                  onError={(e)=>{
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = fallbackFlagUrl(resolvedCode) || "";
                  }}
                />
                ) : (
                  <span className="text-lg">{emojiFromCountryCode(resolvedCode)}</span>
                );
              })()}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">{city}</h3>
              {(() => {
                const resolvedName = country || (meta?.code ? codeToCountry[meta.code]?.countryKo : undefined) || "";
                return (
                  <p className="text-xs text-gray-500 truncate">{resolvedName}</p>
                );
              })()}
            </div>
          </div>
          
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-baseline gap-1.5">
              {meta && (meta as any).isGood ? (
                <span className="text-[10px] font-semibold text-red-500 self-start mt-0.5">
                  특가
                </span>
              ) : null}
              <div className="text-2xl font-bold text-gray-900 leading-tight">
                {typeof price === 'number' ? `${price.toLocaleString()}` : '가격 정보 없음.'}
              </div>
              <span className="text-sm text-gray-500">원</span>
            </div>
            <span className="text-xs text-gray-500 leading-tight mt-1">
              {travelDates}{meta?.tripDays ? `, ${meta.tripDays}일` : ""}
            </span>
            {formatCollected(collectedAt) ? (
              <span className="text-[10px] text-gray-400 leading-tight mt-0.5">수집 {formatCollected(collectedAt)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={(e)=>{ e.stopPropagation(); setOpenSpark(v=>!v); }}
            >
              {openSpark ? '그래프 닫기' : '그래프 보기'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* 새로고침 기능 유지하되, UI는 숨김 처리 */}
            <Button size="sm" className="text-xs h-7 px-3 hidden" variant="outline" onClick={(e)=>{ e.stopPropagation(); onRefresh?.(); }} disabled={!!refreshLoading}>
              {refreshLoading ? '새로고침 중…' : '새로고침'}
            </Button>
            <a
              href={(() => {
                const [depIso, retIsoRaw] = travelDates.split("~");
                // 링크는 카드에 표시된 스캔값(출발/복귀일)을 그대로 사용
                const retIso = retIsoRaw?.trim() || depIso;
                const url = buildMrtBookingUrl({ from: "ICN", fromNameKo: "인천", to: meta?.code ?? "", toNameKo: city ?? "", depdt: depIso, rtndt: retIso }, { nonstop: Boolean(nonstop) });
                return url;
              })()}
              target="_blank"
              rel="noreferrer"
              onClick={(e)=>{
                const [depIso, retIsoRaw] = travelDates.split("~");
                const retIso = retIsoRaw?.trim() || depIso;
                gaEvent('click_card', {
                  code: meta?.code,
                  city,
                  depdt: depIso,
                  rtndt: retIso,
                  nonstop: Boolean(nonstop),
                  price: price ?? undefined,
                  tripDays: meta?.tripDays,
                });
              }}
            >
              <Button size="sm" className="text-xs h-7 px-3 bg-gray-900 hover:bg-gray-800 text-white">
                예약하기
              </Button>
            </a>
            <Button size="sm" className="text-xs h-7 px-3 text-gray-600 hover:bg-gray-100" variant="ghost" onClick={(e)=>{ e.stopPropagation(); onShowChart?.(); }}>
              가격 변동
            </Button>
          </div>
        </div>
        {openSpark && (
          <div className="pt-2">
            <div className="bg-muted rounded-md h-14 flex items-center justify-center overflow-hidden">
              {sparkLoading ? (
                <span className="text-xs text-muted-foreground">로딩 중…</span>
              ) : (
                <Sparkline data={sparkData} width="100%" height={56} />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
