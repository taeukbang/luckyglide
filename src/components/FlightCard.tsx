import { emojiFromCountryCode, flagUrlFromCountryCode, fallbackFlagUrl } from "@/lib/flags";
import { Card, CardContent } from "@/components/ui/card";
import { buildMrtBookingUrl } from "@/lib/utils";
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
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${justRefreshed ? 'lg-flash-outline' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full border border-border overflow-hidden flex items-center justify-center bg-muted">
              {countryCode ? (
                <img
                  src={flagUrlFromCountryCode(countryCode, 24) || fallbackFlagUrl(countryCode)}
                  alt={country}
                  width={24}
                  height={24}
                  className="object-contain"
                  loading="lazy"
                  onError={(e)=>{
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = fallbackFlagUrl(countryCode) || "";
                  }}
                />
              ) : (
                <span className="text-lg">{emojiFromCountryCode(countryCode)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">{city}</h3>
              <p className="text-xs text-muted-foreground truncate">{country}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-primary leading-tight">
                {typeof price === 'number' ? `₩${price.toLocaleString()}` : '로딩 중'}
              </span>
              {meta && (meta as any).isInsaneDeal ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">초특가</span>
              ) : meta && (meta as any).isHotDeal ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">핫딜</span>
              ) : meta && (meta as any).isGood ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">좋은가격</span>
              ) : null}
              {typeof price === 'number' && typeof originalPrice === 'number' && originalPrice > price ? (
                <span className="text-xs text-destructive font-medium">(-{Math.max(0, 100 - Math.round((price / originalPrice) * 100))}%)</span>
              ) : null}
            </div>
            <span className="text-xs text-muted-foreground leading-tight">
              ({travelDates}{meta?.tripDays ? `, ${meta.tripDays}일` : ""})
            </span>
            {formatCollected(collectedAt) ? (
              <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">수집 {formatCollected(collectedAt)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
              onClick={(e)=>{ e.stopPropagation(); setOpenSpark(v=>!v); }}
            >
              {openSpark ? '그래프 닫기' : '⬇️ 그래프 보기'}
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
                const url = buildMrtBookingUrl({ from: "ICN", fromNameKo: "인천", to: meta?.code ?? "", toNameKo: city ?? "", depdt: depIso, rtndt: retIso }, { nonstop: true });
                return url;
              })()}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" className="text-xs h-7 px-3">
                예약
              </Button>
            </a>
            <Button size="sm" className="text-xs h-7 px-3 bg-green-100 text-green-700 hover:bg-green-200" variant="default" onClick={(e)=>{ e.stopPropagation(); onShowChart?.(); }}>
              가격 변동 확인
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
