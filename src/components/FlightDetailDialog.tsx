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
import { buildMrtBookingUrl } from "@/lib/utils";
import { emojiFromCountryCode, flagUrlFromCountryCode, fallbackFlagUrl } from "@/lib/flags";

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-9 rounded border border-border overflow-hidden flex items-center justify-center bg-muted">
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
            <div>
              <DialogTitle className="text-2xl">{city}</DialogTitle>
              <DialogDescription className="text-base">{country}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">최저가</p>
              <p className="text-xl font-bold text-success">₩{minPrice.toLocaleString()}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">평균가</p>
              <p className="text-xl font-bold text-foreground">₩{avgPrice.toLocaleString()}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">최고가</p>
              <p className="text-xl font-bold text-destructive">₩{maxPrice.toLocaleString()}</p>
            </div>
          </div>

          {collectedAt ? (
            <div className="text-xs text-muted-foreground">가격 수집 시점: {(() => {
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">여행 기간</label>
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

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>선택한 기간: {tripDuration}일</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-lg">날짜별 가격 추이</h4>
            <PriceChart data={priceData} />
          </div>

          <div className="flex gap-3 pt-4">
            <a
              className="flex-1"
              href={(() => {
                // 1) 최저가 날짜 선택
                const best = (priceData || []).reduce<{date?: string; price?: number}>((acc, cur) => {
                  if (!acc.date || (typeof acc.price === 'number' ? cur.price < acc.price! : true)) return { date: cur.date, price: cur.price };
                  return acc;
                }, {});
                if (!best.date || !code) return "#";
                // 2) MM/DD -> YYYY-MM-DD 변환
                const now = new Date();
                const yyyy = now.getFullYear();
                const toIso = (mmdd: string) => {
                  const [mm, dd] = mmdd.split("/");
                  return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
                };
                const depIso = toIso(best.date);
                // 3) 복귀일 = 출발일 + (tripDays-1) 그대로 사용 (스캔 표기와 일치)
                const addDays = (iso: string, days: number) => {
                  const d = new Date(iso);
                  d.setDate(d.getDate() + days);
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const da = String(d.getDate()).padStart(2, "0");
                  return `${y}-${m}-${da}`;
                };
                const days = parseInt(tripDuration, 10) || 3;
                const retIso = addDays(depIso, days - 1);
                return buildMrtBookingUrl({ from: "ICN", fromNameKo: "인천", to: code, toNameKo: city, depdt: depIso, rtndt: retIso });
              })()}
              target="_blank"
              rel="noreferrer"
            >
              <Button className="w-full" size="lg">최저가 예약하기</Button>
            </a>
            <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
