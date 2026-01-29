import { emojiFromCountryCode, flagUrlFromCountryCode, fallbackFlagUrl, codeToCountry } from "@/lib/flags";
import { Card, CardContent } from "@/components/ui/card";
import { buildMrtBookingUrl, weekdayKo, applyMrtDeepLinkIfNeeded, resolveBookingUrlWithPartner } from "@/lib/utils";
import { gaEvent } from "@/lib/ga";
import { Button } from "@/components/ui/button";
import { Sparkline } from "./Sparkline";
import { useEffect, useState } from "react";
import { getAirlineName } from "@/lib/airlines";

interface FlightCardProps {
  city: string;
  country: string;
  countryCode?: string; // optional for API data without flag
  price?: number | null;
  originalPrice?: number | null;
  discount?: number | null;
  travelDates: string;
  collectedAt?: string | null;
  airline?: string | null;
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
  airline,
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
  const formatTravelDatesWithWeekday = (range: string) => {
    if (!range) return range;
    const hasTilde = range.includes("~");
    const hasHyphen = !hasTilde && range.includes("-");
    const sep = hasTilde ? "~" : hasHyphen ? "-" : "~";
    const [aRaw, bRaw] = range.split(sep);
    const normalize = (s?: string) => (s || "").trim();
    const a = normalize(aRaw);
    const b = normalize(bRaw);
    const fmt = (token: string) => {
      if (!token) return token;
      // ISO YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
        const d = new Date(token);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}(${weekdayKo(d)})`;
      }
      // M/D or MM/DD
      if (/^\d{1,2}\/\d{1,2}$/.test(token)) {
        const [mmStr, ddStr] = token.split("/");
        const today = new Date();
        let year = today.getFullYear();
        const candidate = new Date(year, Number(mmStr) - 1, Number(ddStr));
        // 연말 롤오버 케이스 보정: 과거면 다음 해로
        if (candidate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          year += 1;
        }
        const d = new Date(year, Number(mmStr) - 1, Number(ddStr));
        return `${Number(mmStr)}/${Number(ddStr)}(${weekdayKo(d)})`;
      }
      return token;
    };
    const left = fmt(a);
    const right = fmt(b || a);
    return `${left}${sep}${right}`;
  };
  const resolvedAirline = airline ?? meta?.airline ?? null;
  const displayAirline = getAirlineName(resolvedAirline) ?? resolvedAirline;
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200 ${justRefreshed ? 'lg-flash-outline' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
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
                  좋은 가격
                </span>
              ) : null}
              <div className="text-2xl font-bold text-gray-900 leading-tight">
                {typeof price === 'number' ? `${price.toLocaleString()}` : '가격 정보 없음.'}
              </div>
              <span className="text-sm text-gray-500">원</span>
            </div>
            <span className="text-xs text-gray-500 leading-tight mt-1">
              {formatTravelDatesWithWeekday(travelDates)}{meta?.tripDays ? `, ${meta.tripDays}일` : ""}
            </span>
            {formatCollected(collectedAt) ? (
              <span className="text-[10px] text-gray-400 leading-tight mt-0.5">수집 {formatCollected(collectedAt)}</span>
            ) : null}
          {displayAirline ? (
            <span className="text-[11px] text-gray-500 leading-tight mt-0.5">
              최저가 항공사: {displayAirline}
            </span>
          ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* 그래프 보기 버튼 주석처리 */}
            {/* <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={(e)=>{ e.stopPropagation(); setOpenSpark(v=>!v); }}
            >
              {openSpark ? '그래프 닫기' : '그래프 보기'}
            </Button> */}
          </div>
          <div className="flex items-center gap-2">
            {/* 새로고침 기능 유지하되, UI는 숨김 처리 */}
            <Button size="sm" className="text-xs h-7 px-3 hidden" variant="outline" onClick={(e)=>{ e.stopPropagation(); onRefresh?.(); }} disabled={!!refreshLoading}>
              {refreshLoading ? '새로고침 중…' : '새로고침'}
            </Button>
            <Button size="sm" className="text-xs h-7 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200" onClick={(e)=>{ e.stopPropagation(); onShowChart?.(); }}>
              일자별 가격 그래프
            </Button>
            <a
              href="#"
              target="_blank"
              onClick={async (e)=>{
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
                e.preventDefault();
                // 팝업 차단 방지: 클릭 이벤트 내에서 즉시 빈 창 열기
                const newWindow = window.open("about:blank", "_blank", "noopener");
                if (!newWindow) {
                  console.warn('[예약하기] 팝업이 차단되었습니다.');
                  return;
                }
                
                try {
                  const finalUrl = await resolveBookingUrlWithPartner({
                    from: "ICN",
                    to: meta?.code ?? "",
                    toNameKo: city ?? "",
                    depdt: depIso,
                    rtndt: retIso,
                    nonstop: Boolean(nonstop),
                  });
                  if (finalUrl) {
                    console.log('[예약하기] URL 열기:', finalUrl.substring(0, 100));
                    newWindow.location.href = finalUrl;
                  } else {
                    console.error('[예약 URL 오류] finalUrl이 null입니다.');
                    newWindow.close();
                  }
                } catch (error) {
                  console.error('[예약 URL 오류]', error);
                  // 에러 발생 시에도 기본 예약 URL 사용
                  try {
                    const fallbackUrl = buildMrtBookingUrl(
                      { from: "ICN", to: meta?.code ?? "", toNameKo: city ?? "", depdt: depIso, rtndt: retIso },
                      { nonstop: Boolean(nonstop) }
                    );
                    if (fallbackUrl) {
                      newWindow.location.href = fallbackUrl;
                    } else {
                      newWindow.close();
                    }
                  } catch (fallbackError) {
                    console.error('[Fallback URL 오류]', fallbackError);
                    newWindow.close();
                  }
                }
              }}
            >
              <Button size="sm" className="text-xs h-7 px-3 bg-gray-900 hover:bg-gray-800 text-white">
                예약하기
              </Button>
            </a>
          </div>
        </div>
        {openSpark && (
          <div className="pt-2">
            <div className="bg-gray-50 rounded-md h-14 flex items-center justify-center overflow-hidden border border-gray-200">
              {sparkLoading ? (
                <span className="text-xs text-gray-500">로딩 중…</span>
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
