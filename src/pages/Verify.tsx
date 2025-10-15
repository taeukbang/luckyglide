import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriceChart } from "@/components/PriceChart";
import { buildMrtBookingUrl } from "@/lib/utils";

// 카드 목록에서 사용하는 목적지 목록 API 타입과 동일하게 맞춤
type Destination = { code: string; nameKo: string; region: string };

// Index 페이지의 LatestItem과 호환되는 최소 필드만 정의
type LatestItemLite = {
  code: string;
  city: string;
  region: string | null;
  price: number | null;
  originalPrice?: number | null;
  departureDate: string | null;
  returnDate: string | null;
  tripDays?: number | null;
};

export default function Verify() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [tripDays, setTripDays] = useState<number>(3);
  const [daysRange, setDaysRange] = useState<number>(30);

  // 카드/리스트 기준 최저가 (실시간 latest-live에서 한 도시만 조회)
  const [cardInfo, setCardInfo] = useState<LatestItemLite | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  // 그래프(달력 창) 데이터 및 최저가
  const [chartData, setChartData] = useState<{ date: string; price: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // 마이리얼트립 실시간 캘린더(한 번 더 보수 검증용)
  const [liveCalendarMin, setLiveCalendarMin] = useState<{ date: string; price: number } | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  // 목적지 목록 로드
  useEffect(() => {
    let aborted = false;
    (async () => {
      const res = await fetch("/api/destinations");
      if (!res.ok) return;
      const data = await res.json();
      if (aborted) return;
      const arr: Destination[] = data.destinations || [];
      setDestinations(arr);
      if (!selectedCode && arr.length) setSelectedCode(arr[0].code);
    })();
    return () => {
      aborted = true;
    };
  }, []);

  // 카드/리스트 기준 최저가 로드 (latest-live에서 대상 코드만 조회)
  const reloadCardInfo = async () => {
    if (!selectedCode) return;
    try {
      setCardLoading(true);
      const url = `/api/latest-live?from=ICN&codes=${encodeURIComponent(selectedCode)}&days=${Math.max(7, daysRange)}&minTripDays=${tripDays}&maxTripDays=${tripDays}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const item = (data.items || [])[0] as LatestItemLite | undefined;
      setCardInfo(item ?? null);
    } catch (e) {
      setCardInfo(null);
    } finally {
      setCardLoading(false);
    }
  };

  // 달력 창 데이터 로드(프론트 내부 API)
  const reloadChartData = async () => {
    if (!selectedCode) return;
    try {
      setChartLoading(true);
      const res = await fetch("/api/calendar-window", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "ICN", to: selectedCode, days: daysRange, tripDays }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChartData((data.items || []).map((d: any) => ({ date: d.date, price: Number(d.price) })));
    } catch (e) {
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  // MyRealTrip 캘린더 최저가 직접 산출(보수 검증)
  const reloadLiveCalendar = async () => {
    if (!selectedCode) return;
    try {
      setLiveLoading(true);
      const base = new Date();
      base.setDate(base.getDate() + 1);
      // date: 출발일(MM/DD)
      let min: { date: string; price: number } | null = null;
      for (let i = 0; i < daysRange; i++) {
        const dep = new Date(base);
        dep.setDate(dep.getDate() + i);
        const y = dep.getFullYear();
        const m = String(dep.getMonth() + 1).padStart(2, "0");
        const d = String(dep.getDate()).padStart(2, "0");
        const depStr = `${y}-${m}-${d}`;
        // 정확한 복귀일 = 출발일 + (tripDays - 1)
        const ret = new Date(depStr);
        ret.setDate(ret.getDate() + Math.max(1, tripDays) - 1);
        const ry = ret.getFullYear();
        const rm = String(ret.getMonth() + 1).padStart(2, "0");
        const rd = String(ret.getDate()).padStart(2, "0");
        const retStr = `${ry}-${rm}-${rd}`;
        const r = await fetch("https://api3.myrealtrip.com/pds/api/v1/flight/price/calendar", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ from: "ICN", to: selectedCode, departureDate: depStr, period: tripDays, transfer: -1, international: true, airlines: ["All"] }),
        });
        if (!r.ok) continue;
        const data = await r.json();
        const arr = (data?.flightCalendarInfoResults || []);
        // 체류일 정확 매칭: 복귀일(retStr)과 동일한 항목만 사용
        const exact = arr.find((e: any) => String(e?.date) === retStr);
        if (!exact) continue;
        const p = Number(exact.price);
        if (!Number.isFinite(p)) continue;
        const depLabel = `${m}/${d}`; // 출발일 표기(MM/DD)
        if (!min || p < min.price) min = { date: depLabel, price: p };
      }
      setLiveCalendarMin(min);
    } catch (e) {
      setLiveCalendarMin(null);
    } finally {
      setLiveLoading(false);
    }
  };

  const chartStats = useMemo(() => {
    if (!chartData.length) return { min: null as any, max: null as any, avg: null as any };
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((s, v) => s + v, 0) / prices.length);
    return { min, max, avg };
  }, [chartData]);

  const bestChartEntry = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((acc, cur) => (acc && acc.price <= cur.price ? acc : cur));
  }, [chartData]);

  const bestCardPrice = typeof cardInfo?.price === "number" ? cardInfo.price : null;

  useEffect(() => {
    if (!selectedCode) return;
    reloadCardInfo();
    reloadChartData();
    reloadLiveCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode, tripDays, daysRange]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4">가격 검증</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-sm text-muted-foreground">도시</label>
          <Select value={selectedCode} onValueChange={setSelectedCode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="도시 선택" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d.code} value={d.code}>{d.nameKo} ({d.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">여행일수</label>
          <Select value={String(tripDays)} onValueChange={(v)=> setTripDays(parseInt(v,10))}>
            <SelectTrigger className="w-full">
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
        <div>
          <label className="text-sm text-muted-foreground">스캔 기간(일)</label>
          <Input type="number" min={7} max={60} value={daysRange} onChange={(e)=> setDaysRange(Math.max(7, Math.min(60, parseInt(e.target.value||"30", 10))))} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold">카드/리스트 기준 최저가</h3>
            <p className="text-sm text-muted-foreground">/api/latest-live</p>
            <div className="text-2xl font-bold">{cardLoading ? "로딩 중" : (typeof bestCardPrice === "number" ? `₩${bestCardPrice.toLocaleString()}` : "N/A")}</div>
            <div className="text-sm text-muted-foreground">출발: {cardInfo?.departureDate || "-"} · 복귀: {cardInfo?.returnDate || "-"} · {cardInfo?.tripDays ? `${cardInfo.tripDays}일` : ""}</div>
            <div className="pt-2">
              <Button size="sm" onClick={reloadCardInfo}>다시 불러오기</Button>
            </div>
            {cardInfo?.departureDate && cardInfo?.returnDate && (
              <a
                href={buildMrtBookingUrl({ from: "ICN", fromNameKo: "인천", to: selectedCode, toNameKo: destinations.find(d=>d.code===selectedCode)?.nameKo || selectedCode, depdt: cardInfo.departureDate, rtndt: cardInfo.returnDate })}
                target="_blank" rel="noreferrer"
              >
                <Button size="sm" className="mt-2 w-full">예약(카드 최저가)</Button>
              </a>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">그래프(창) 최저가</h3>
                <p className="text-sm text-muted-foreground">/api/calendar-window</p>
              </div>
              <Button size="sm" onClick={reloadChartData} disabled={chartLoading}>{chartLoading ? "로딩…" : "새로고침"}</Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary rounded p-3 text-center">
                <div className="text-xs text-muted-foreground">최저</div>
                <div className="text-lg font-bold">{chartStats.min ? `₩${chartStats.min.toLocaleString()}` : "-"}</div>
              </div>
              <div className="bg-secondary rounded p-3 text-center">
                <div className="text-xs text-muted-foreground">평균</div>
                <div className="text-lg font-bold">{chartStats.avg ? `₩${chartStats.avg.toLocaleString()}` : "-"}</div>
              </div>
              <div className="bg-secondary rounded p-3 text-center">
                <div className="text-xs text-muted-foreground">최고</div>
                <div className="text-lg font-bold">{chartStats.max ? `₩${chartStats.max.toLocaleString()}` : "-"}</div>
              </div>
            </div>
            <PriceChart data={chartData} />
            {bestChartEntry && (
              <a
                href={(() => {
                  const now = new Date();
                  const yyyy = now.getFullYear();
                  const [mm, dd] = String(bestChartEntry.date).split("/");
                  const depIso = `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
                  const addDays = (iso: string, days: number) => {
                    const d0 = new Date(iso);
                    d0.setDate(d0.getDate() + days);
                    const y = d0.getFullYear();
                    const m = String(d0.getMonth() + 1).padStart(2, "0");
                    const da = String(d0.getDate()).padStart(2, "0");
                    return `${y}-${m}-${da}`;
                  };
                  const retIso = addDays(depIso, Math.max(1, tripDays) - 1);
                  return buildMrtBookingUrl({ from: "ICN", fromNameKo: "인천", to: selectedCode, toNameKo: destinations.find(d=>d.code===selectedCode)?.nameKo || selectedCode, depdt: depIso, rtndt: retIso });
                })()}
                target="_blank" rel="noreferrer"
              >
                <Button size="sm" className="w-full">예약(그래프 최저가)</Button>
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">MRT 캘린더 직접 최저가</h3>
                <p className="text-sm text-muted-foreground">api3.myrealtrip.com</p>
              </div>
              <Button size="sm" onClick={reloadLiveCalendar} disabled={liveLoading}>{liveLoading ? "로딩…" : "다시 조회"}</Button>
            </div>
            <div className="text-2xl font-bold">{liveLoading ? "로딩 중" : (liveCalendarMin ? `₩${liveCalendarMin.price.toLocaleString()}` : "N/A")}</div>
            <div className="text-sm text-muted-foreground">날짜: {liveCalendarMin?.date || "-"}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
