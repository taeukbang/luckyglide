import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriceChart } from "./PriceChart";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { buildMrtBookingUrl, addDaysIsoKST, applyMrtDeepLinkIfNeeded, resolveBookingUrlWithPartner } from "@/lib/utils";
import { gaEvent } from "@/lib/ga";
import { emojiFromCountryCode, flagUrlFromCountryCode, fallbackFlagUrl } from "@/lib/flags";
import { getAirlineName } from "@/lib/airlines";

interface FlightDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: string;
  country: string;
  countryCode: string;
  code?: string; // IATA city/airport code for booking
  priceData: {
    date: string;
    price: number;
  }[];
  tripDays?: number;
  onTripDaysChange?: (n: number) => void;
  collectedAt?: string | null;
  onRefresh?: () => void;
  refreshLoading?: boolean;
  justRefreshed?: boolean;
  nonstop?: boolean;
  airline?: string | null;
}

export const FlightDetailDialog = ({
  open,
  onOpenChange,
  city,
  country,
  countryCode,
  code,
  priceData,
  tripDays = 3,
  onTripDaysChange,
  collectedAt,
  onRefresh,
  refreshLoading,
  justRefreshed,
  nonstop,
  airline,
}: FlightDetailDialogProps) => {
  const [tripDuration, setTripDuration] = useState(String(tripDays));
  // 부모 tripDays가 바뀌면 내부 선택값도 동기화 (카드의 여행일수 반영)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (String(tripDays) !== tripDuration) {
    setTripDuration(String(tripDays));
  }

  const minPrice = priceData.length ? Math.min(...priceData.map(d => d.price)) : 0;
  const maxPrice = priceData.length ? Math.max(...priceData.map(d => d.price)) : 0;
  const avgPrice = priceData.length ? Math.round(priceData.reduce((sum, d) => sum + d.price, 0) / priceData.length) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-3xl max-h-[90vh] overflow-y-auto ${justRefreshed ? 'lg-flash-outline' : ''}`}>
        <DialogHeader>
          <div className="flex items-start gap-3 mb-2 text-left">
            <div className="w-12 h-9 rounded border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
              {countryCode ? (
                <img
                  src={flagUrlFromCountryCode(countryCode, 24) || fallbackFlagUrl(countryCode)}
                  alt={country}
                  width={24}
                  height={24}
                  className="object-contain"
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
            <div className="text-left">
              <DialogTitle className="text-2xl text-left text-gray-900">{city}</DialogTitle>
              <DialogDescription className="text-base text-left text-gray-600">{country}</DialogDescription>
              {airline ? (
                <p className="text-xs text-gray-500 mt-1">최저가 항공사: {getAirlineName(airline) ?? airline}</p>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 가격 정보: 모바일 3열, 데스크톱 3열 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">최저가</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 break-words">{minPrice.toLocaleString()}<span className="text-xs text-gray-500 ml-0.5">원</span></p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">평균가</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 break-words">{avgPrice.toLocaleString()}<span className="text-xs text-gray-500 ml-0.5">원</span></p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">최고가</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 break-words">{maxPrice.toLocaleString()}<span className="text-xs text-gray-500 ml-0.5">원</span></p>
            </div>
          </div>

          {collectedAt ? (
            <div className="text-xs text-gray-500">가격 수집 시점: {(() => {
              try {
                const d = new Date(collectedAt);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const da = String(d.getDate()).padStart(2, '0');
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                return `${y}-${m}-${da} ${hh}:${mm}`;
              } catch { return collectedAt; }
            })()}</div>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-900">여행 기간</label>
            </div>
            <Select
              value={tripDuration}
              onValueChange={(v) => {
                setTripDuration(v);
                const n = parseInt(v, 10);
                if (!Number.isNaN(n)) onTripDaysChange?.(n);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3일</SelectItem>
                <SelectItem value="4">4일</SelectItem>
                <SelectItem value="5">5일</SelectItem>
                <SelectItem value="6">6일</SelectItem>
                <SelectItem value="7">7일</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-lg text-blue-600">날짜별 가격 추이</h4>
            {/* 기간 변경 시 강제 리마운트로 그래프 갱신 보장 + hover 예약 버튼 */}
            <PriceChart
              key={`chart-${tripDuration}`}
              data={priceData}
              tripDays={parseInt(String(tripDuration), 10) || (tripDays || 3)}
              bookingFromCode="ICN"
              bookingToCode={code}
              bookingToNameKo={city}
              nonstop={!!nonstop}
            />
          </div>

          <div className="flex gap-2 pt-4">
            {/* 새로고침 기능 유지하되, UI는 숨김 처리 */}
            <Button variant="outline" className="hidden" onClick={onRefresh} disabled={!!refreshLoading}>
              {refreshLoading ? '새로고침 중…' : '새로고침'}
            </Button>
            <a
              className="flex-1"
              href="#"
              target="_blank"
              onClick={async (e)=>{
                // 동일 로직으로 dep/ret 추출해 이벤트 보냄
                const best = (priceData || []).reduce<{date?: string; price?: number}>((acc, cur) => {
                  if (!acc.date || (typeof acc.price === 'number' ? cur.price < acc.price! : true)) return { date: cur.date, price: cur.price };
                  return acc;
                }, {});
                if (!best.date || !code) return;
                const now = new Date();
                const yyyy = now.getFullYear();
                const toIso = (mmdd: string) => {
                  const [mm, dd] = mmdd.split("/");
                  const month = parseInt(mm, 10);
                  const day = parseInt(dd, 10);
                  let year = yyyy;
                  const candidate = new Date(year, month - 1, day);
                  if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
                    year += 1;
                  }
                  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                };
                const depIso = toIso(best.date);
                const days = parseInt(tripDuration, 10) || 3;
                const retIso = addDaysIsoKST(depIso, days - 1);
                gaEvent('click_detail', { code, city, depdt: depIso, rtndt: retIso, nonstop: Boolean(nonstop), price: best.price, tripDays: days });
                e.preventDefault();
                
                try {
                  // 로딩 페이지를 먼저 열기 (팝업 차단 방지)
                  const loadingUrl = `/booking-loading.html?url=${encodeURIComponent('about:blank')}`;
                  const newWindow = window.open(loadingUrl, "_blank", "noopener");
                  if (!newWindow) {
                    console.warn('[예약하기] 팝업이 차단되었습니다.');
                    return;
                  }
                  
                  // URL 준비
                  const finalUrl = await resolveBookingUrlWithPartner({
                    from: "ICN",
                    to: code,
                    toNameKo: city,
                    depdt: depIso,
                    rtndt: retIso,
                    nonstop: Boolean(nonstop),
                  });
                  
                  if (finalUrl) {
                    // 로딩 페이지에서 실제 URL로 리다이렉트
                    newWindow.location.href = `/booking-loading.html?url=${encodeURIComponent(finalUrl)}`;
                  } else {
                    newWindow.close();
                  }
                } catch (error) {
                  console.error('[예약 URL 오류]', error);
                  // 에러 발생 시에도 기본 예약 URL 사용
                  try {
                    const fallbackUrl = buildMrtBookingUrl(
                      { from: "ICN", to: code, toNameKo: city, depdt: depIso, rtndt: retIso },
                      { nonstop: Boolean(nonstop) }
                    );
                    if (fallbackUrl) {
                      const newWindow = window.open(`/booking-loading.html?url=${encodeURIComponent(fallbackUrl)}`, "_blank", "noopener");
                      if (!newWindow) {
                        // 팝업 차단 시 현재 창에서 이동
                        window.location.href = fallbackUrl;
                      }
                    }
                  } catch (fallbackError) {
                    console.error('[Fallback URL 오류]', fallbackError);
                  }
                }
              }}
            >
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4" size="lg">최저가 예약하기</Button>
            </a>
            <Button variant="outline" size="lg" className="border-gray-200 text-gray-700 hover:bg-gray-50 px-6" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
