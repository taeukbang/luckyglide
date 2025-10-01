import { useEffect, useMemo, useState } from "react";
import { FlightCard } from "@/components/FlightCard";
import { FlightDetailDialog } from "@/components/FlightDetailDialog";
// import { mockFlights, Flight } from "@/data/mockFlights";
// import { Plane } from "lucide-react";
import { codeToCountry, emojiFromCountryCode } from "@/lib/flags";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// 달력 제거: 출발/도착일 직접 입력으로 대체
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type LatestItem = {
  code: string;
  city: string;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  price: number;
  originalPrice?: number | null;
  departureDate: string;
  returnDate: string;
  airline: string;
  collectedAt: string;
  tripDays?: number | null;
  meta?: any;
};

const Index = () => {
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<string>("모두");
  const [inviteCodeOpen, setInviteCodeOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [items, setItems] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  // tripDuration state mirrored to dialog to trigger reload from parent
  const [dialogTripDays, setDialogTripDays] = useState<number>(3);
  // 코드->국가/국기 런타임 맵 (/api/destinations 로드)
  const [destMap, setDestMap] = useState<Record<string, { country: string | null; countryCode: string | null }>>({});

  const handleFlightClick = (flight: any) => {
    // 카드의 여행일수(meta.tripDays)를 상세 그래프 초기 로드에 사용
    const initialDays = (flight as any)?.meta?.tripDays;
    setDialogTripDays(typeof initialDays === 'number' && initialDays > 0 ? initialDays : 3);
    setSelectedFlight(flight);
    setDialogOpen(true);
  };

  const handleInviteCodeSubmit = () => {
    if (inviteCode === "LuckyGlide1") {
      setIsAuthenticated(true);
      setInviteCodeOpen(false);
    }
  };

  const continents = ["모두", "아시아", "미주", "유럽", "대양주", "중동", "중남미", "아프리카"];
  const tripDayOptions = ["여정 길이 상관없음", "3일", "4일", "5일", "6일", "7일"];
  const sortOptions = [
    { key: "priceAsc", label: "가격 낮은 순" },
    { key: "discountDesc", label: "최고가 대비 할인율 높은 순" },
    { key: "earliestDep", label: "출발일 빠른 순" },
  ];
  const [sortKey, setSortKey] = useState<string>(sortOptions[0].key);
  const [directOnly, setDirectOnly] = useState<boolean>(false);
  const [tripDaysSel, setTripDaysSel] = useState<string>(tripDayOptions[0]);
  // 새 필터: 도시 검색어, 일정(출발일) 고정
  const [cityQuery, setCityQuery] = useState<string>("");
  const [fixedDepIso, setFixedDepIso] = useState<string | null>(null);
  const [fixedRetIso, setFixedRetIso] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  useEffect(() => {
    const controller = new AbortController();

    const chunkArray = <T,>(arr: T[], size: number) => {
      const out: T[][] = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    const progressiveLoad = async () => {
      try {
        setLoading(true);
        setError(null);

        // DB 캐시 기반 빠른 로딩: /api/latest (region/transfer 필터 지원)
        const qs = new URLSearchParams();
        qs.set('from', 'ICN');
        if (selectedContinent && selectedContinent !== '모두') qs.set('region', selectedContinent);
        qs.set('transfer', directOnly ? '0' : '-1');
        if (tripDaysSel !== '여정 길이 상관없음') {
          const td = parseInt(tripDaysSel, 10);
          if (!Number.isNaN(td)) qs.set('tripDays', String(td));
        }
        if (fixedDepIso) qs.set('dep', fixedDepIso);
        if (fixedRetIso) qs.set('ret', fixedRetIso);
        const res = await fetch(`/api/latest?${qs.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = (data.items || []).map((r: any) => ({
          code: r.code,
          city: r.city,
          region: r.region ?? null,
          country: (r.country ?? null) as string | null,
          countryCode: (r.countryCode ?? null) as string | null,
          price: (r.price !== null && r.price !== undefined) ? Number(r.price) : null as any,
          originalPrice: (r.originalPrice !== null && r.originalPrice !== undefined) ? Number(r.originalPrice) : null,
          departureDate: r.departureDate ?? null as any,
          returnDate: r.returnDate ?? null as any,
          airline: r.airline ?? null as any,
          collectedAt: r.collectedAt ?? '',
          tripDays: (r.tripDays !== null && r.tripDays !== undefined) ? Number(r.tripDays) : null,
          meta: r.meta ?? null,
        })) as LatestItem[];
        setItems(list);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message ?? "load error");
      } finally {
        setLoading(false);
      }
    };

    progressiveLoad();
    return () => controller.abort();
  }, [selectedContinent, directOnly, tripDaysSel, fixedDepIso, fixedRetIso]);

  // /api/destinations을 초기 1회 로드하여 보조 맵 구성
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch('/api/destinations');
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, { country: string | null; countryCode: string | null }> = {};
        for (const d of (data?.destinations ?? [])) {
          map[d.code] = { country: d.country ?? null, countryCode: d.countryCode ?? null };
        }
        if (!aborted) setDestMap(map);
      } catch {}
    })();
    return () => { aborted = true; };
  }, []);

  const filteredFlights = useMemo(() => {
    const regionSet = new Set<string>([selectedContinent]);
    // 숫자 보장: Supabase numeric → string 방지
    const normalized = items.map((it) => {
      const priceNum = it.price !== null && it.price !== undefined && it.price !== "" ? Number(it.price) : null as any;
      const originalPriceNum = it.originalPrice !== null && it.originalPrice !== undefined && it.originalPrice !== "" ? Number(it.originalPrice) : null as any;
      return { ...it, price: priceNum, originalPrice: originalPriceNum } as LatestItem;
    });
    // 정렬
    // 도시 검색어 필터(한글 도시명 포함 부분 일치)
    const byQuery = cityQuery.trim()
      ? normalized.filter(it => it.city?.toLowerCase().includes(cityQuery.trim().toLowerCase()))
      : normalized;

    const sorted = [...byQuery].sort((a, b) => {
      if (sortKey === "discountDesc") {
        const aDiscount = (typeof a.price === 'number' && typeof a.originalPrice === 'number' && a.originalPrice > 0)
          ? Math.abs(100 - Math.round((Number(a.price) / Number(a.originalPrice)) * 100)) : -Infinity;
        const bDiscount = (typeof b.price === 'number' && typeof b.originalPrice === 'number' && b.originalPrice > 0)
          ? Math.abs(100 - Math.round((Number(b.price) / Number(b.originalPrice)) * 100)) : -Infinity;
        return (bDiscount - aDiscount);
      }
      if (sortKey === "earliestDep") {
        const ad = a.departureDate ? Date.parse(a.departureDate) : Infinity;
        const bd = b.departureDate ? Date.parse(b.departureDate) : Infinity;
        return ad - bd;
      }
      // 기본: 가격 오름차순
      return (a.price ?? Infinity) - (b.price ?? Infinity);
    });
    return sorted
      .filter((it) => (selectedContinent === "모두" ? true : regionSet.has(it.region ?? "")))
      .map((it, idx) => {
        const price = it.price !== null && it.price !== undefined ? Number(it.price) : null as any;
        const original = (it.originalPrice !== null && it.originalPrice !== undefined && it.originalPrice !== "") ? Number(it.originalPrice) : null as any;
        const discount = (typeof price === 'number' && typeof original === 'number' && original > price)
          ? Math.max(0, 100 - Math.round((price / original) * 100))
          : null;
        const travelDates = it.departureDate && it.returnDate ? `${it.departureDate}~${it.returnDate}` : "";
        const m = destMap[it.code];
        const countryFinal = it.country ?? m?.country ?? codeToCountry[it.code]?.countryKo ?? "";
        const countryCodeFinal = (it as any).countryCode ?? m?.countryCode ?? codeToCountry[it.code]?.countryCode ?? (null as any);
        return ({
          code: it.code,
          id: `${it.code}-${idx}`,
          city: it.city,
          country: countryFinal,
          countryCode: countryCodeFinal,
          price: price as any,
          originalPrice: original as any,
          discount,
          travelDates,
          meta: { ...(it as any).meta, code: it.code, tripDays: it.tripDays ?? undefined },
          priceHistory: [] as any,
          continent: it.region ?? "",
        collectedAt: it.collectedAt,
        });
      });
  }, [items, selectedContinent, sortKey, cityQuery, destMap]);

  useEffect(() => {
    if (!dialogOpen || !selectedFlight?.code) return;
    const controller = new AbortController();
    const loadHistory = async (tripDays: number) => {
      try {
        setChartLoading(true);
        // 다이얼로그 오픈 시 DB 최신값으로 상단 정보(collectedAt 포함) 동기화
        try {
          const qs = new URLSearchParams();
          qs.set('from', 'ICN');
          qs.set('codes', selectedFlight.code);
          qs.set('transfer', directOnly ? '0' : '-1');
          const latestRes = await fetch(`/api/latest?${qs.toString()}`, { signal: controller.signal });
          if (latestRes.ok) {
            const data = await latestRes.json();
            const item = (data.items || [])[0];
            if (item) {
              setSelectedFlight((prev: any) => prev ? {
                ...prev,
                // 카드 메타 동일 유지, 상단 표기 값만 최신 반영
                price: (item.price !== null && item.price !== undefined) ? Number(item.price) : (null as any),
                originalPrice: (item.originalPrice !== null && item.originalPrice !== undefined) ? Number(item.originalPrice) : null,
                travelDates: item.departureDate && item.returnDate ? `${item.departureDate}~${item.returnDate}` : prev.travelDates,
                meta: { ...(prev.meta||{}), tripDays: (item.tripDays !== null && item.tripDays !== undefined) ? Number(item.tripDays) : (prev.meta?.tripDays) },
                collectedAt: item.collectedAt ?? prev.collectedAt,
              } : prev);
            }
          }
        } catch {}
        // 기존 실시간 API 호출은 유지하되, DB 기반 엔드포인트로 대체 (주석 처리)
        // const res = await fetch('/api/calendar-window', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'ICN', to: selectedFlight.code, tripDays, days: 14 }), signal: controller.signal });
        const res = await fetch('/api/calendar-window-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'ICN', to: selectedFlight.code, tripDays, days: 180, transfer: directOnly ? 0 : -1 }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const hist = (data.items || []).map((d: any) => ({ date: d.date, price: Number(d.price) }));
        // 1) 상세 그래프 데이터 갱신
        setSelectedFlight((prev: any) => prev ? { ...prev, priceHistory: hist } : prev);
        // 카드 가격은 /api/latest-live 기준 유지(그래프는 비교용)
      } catch (e) {
      } finally {
        setChartLoading(false);
      }
    };
    loadHistory(dialogTripDays);
    return () => controller.abort();
  }, [dialogOpen, selectedFlight?.code, dialogTripDays]);

  const [refreshingCodes, setRefreshingCodes] = useState<Set<string>>(new Set());
  const [justRefreshedCodes, setJustRefreshedCodes] = useState<Set<string>>(new Set());
  const handleRefresh = async (code: string) => {
    try {
      setRefreshingCodes(prev => new Set(prev).add(code));
      // 서버에 해당 목적지만 스캔 요청 → DB 최신값 갱신 (transfer 차원 반영)
      const res = await fetch(`/api/scan?from=${encodeURIComponent('ICN')}&to=${encodeURIComponent(code)}&transfer=${encodeURIComponent(directOnly ? 0 : -1)}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // 스캔 완료 후 최신값 재조회 (단일 코드)
      const qs = new URLSearchParams();
      qs.set('from', 'ICN');
      qs.set('codes', code);
      qs.set('transfer', directOnly ? '0' : '-1');
      const latestRes = await fetch(`/api/latest?${qs.toString()}`);
      if (latestRes.ok) {
        const data = await latestRes.json();
        const item: any = (data.items || [])[0];
        if (item) {
          setItems((prev) => prev.map((p) => p.code === code ? ({
            ...p,
            price: (item.price !== null && item.price !== undefined) ? Number(item.price) : (null as any),
            originalPrice: (item.originalPrice !== null && item.originalPrice !== undefined) ? Number(item.originalPrice) : null,
            departureDate: item.departureDate ?? null as any,
            returnDate: item.returnDate ?? null as any,
            airline: item.airline ?? null as any,
            collectedAt: item.collectedAt ?? '',
            tripDays: (item.tripDays !== null && item.tripDays !== undefined) ? Number(item.tripDays) : null,
          }) : p));
          // 상세 다이얼로그가 해당 목적지를 보고 있다면, 그래프 데이터도 새로 불러오고 수집시점 동기화
          setSelectedFlight((prev: any) => {
            if (!prev || prev.code !== code) return prev;
            return {
              ...prev,
              collectedAt: item.collectedAt ?? '',
            };
          });
          if (dialogOpen && selectedFlight?.code === code) {
            // 현재 선택된 체류일수 기준으로 그래프 재조회
            try {
              setChartLoading(true);
              // 기존 실시간 API 호출은 유지하되, DB 기반으로 대체 (주석)
              // const res2 = await fetch('/api/calendar-window', {
              const res2 = await fetch('/api/calendar-window-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: 'ICN', to: code, tripDays: dialogTripDays, days: 180 }),
              });
              if (res2.ok) {
                const data2 = await res2.json();
                const hist = (data2.items || []).map((d: any) => ({ date: d.date, price: Number(d.price) }));
                setSelectedFlight((prev: any) => prev ? { ...prev, priceHistory: hist } : prev);
              }
            } finally {
              setChartLoading(false);
            }
          }
          // 반짝 효과 트리거 (코드별)
          setJustRefreshedCodes(prev => {
            const s = new Set(prev);
            s.add(code);
            return s;
          });
          setTimeout(() => {
            setJustRefreshedCodes(prev => {
              const s = new Set(prev);
              s.delete(code);
              return s;
            });
          }, 1000);
        }
      }
    } catch (e) {
    } finally {
      setRefreshingCodes(prev => {
        const s = new Set(prev);
        s.delete(code);
        return s;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={inviteCodeOpen} onOpenChange={setInviteCodeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>초대코드를 입력해주세요</DialogTitle>
            <DialogDescription>
              LuckyGlide를 이용하시려면 초대코드가 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="초대코드 입력"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInviteCodeSubmit();
                }
              }}
            />
            <Button onClick={handleInviteCodeSubmit}>확인</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg">
              <img src="/logo.svg" alt="LuckyGlide" className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">LuckyGlide</h1>
              <p className="text-sm text-muted-foreground">떠나기 좋은 날짜를 알려드려요</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* 1행: 도시 검색 + 고급 필터 토글 */}
        <div className="mb-3 flex gap-2 items-center">
          <Input className="w-full sm:w-[300px]" placeholder="도시명으로 검색" value={cityQuery} onChange={(e)=>setCityQuery(e.target.value)} />
          <Button variant="outline" className="whitespace-nowrap" onClick={()=>setShowAdvanced(v=>!v)}>
            {showAdvanced ? '검색 조건 접기' : '검색 조건 추가하기'}
          </Button>
        </div>

        {/* 2행: 고급 조건(정렬/여정 길이/일정/직항) */}
        {showAdvanced && (
        <div className="mb-4 space-y-3">
          {/* 정렬 방식 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="w-full sm:w-20 text-sm text-muted-foreground">정렬 방식</span>
            <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="정렬 방식" />
            </SelectTrigger>
            <SelectContent>
                {sortOptions.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

          {/* 여정 길이 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="w-full sm:w-20 text-sm text-muted-foreground">여정 길이</span>
            <Select value={tripDaysSel} onValueChange={setTripDaysSel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="여정 길이" />
              </SelectTrigger>
              <SelectContent>
                {tripDayOptions.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 여정 일정 */}
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">여정 일정</span>
            <div className="flex items-center gap-1 w-full">
              <Input className="flex-1 min-w-[120px]" placeholder="출발일 YYYY-MM-DD" value={fixedDepIso ?? ''} onChange={(e)=>setFixedDepIso(e.target.value || null)} />
              <span className="px-1 text-muted-foreground">~</span>
              <Input className="flex-1 min-w-[120px]" placeholder="도착일 YYYY-MM-DD" value={fixedRetIso ?? ''} onChange={(e)=>setFixedRetIso(e.target.value || null)} />
            </div>
          </div>

          {/* 직항 여부 */}
          <div className="flex flex-row items-center gap-2">
            <span className="w-20 text-sm text-muted-foreground">직항 여부</span>
            <Checkbox checked={directOnly} onCheckedChange={(v:any) => setDirectOnly(Boolean(v))} />
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              city={flight.city}
              country={flight.country}
              countryCode={flight.countryCode}
              price={flight.price}
              originalPrice={flight.originalPrice}
              discount={flight.discount}
              travelDates={flight.travelDates}
              collectedAt={(flight as any).collectedAt}
              meta={flight.meta}
              onClick={() => handleFlightClick(flight)}
              onShowChart={() => handleFlightClick(flight)}
              // 새로고침 기능은 유지하되 UI는 숨김 처리됨
              onRefresh={() => handleRefresh(flight.code)}
              refreshLoading={refreshingCodes.has(flight.code)}
              justRefreshed={justRefreshedCodes.has(flight.code)}
            />
          ))}
        </div>
      </main>

      {/* Disclaimer */}
      <footer className="container mx-auto px-4 py-6">
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>할인율은 해당 기간 중 최고가 대비 할인율을 의미합니다.</li>
          <li>가격은 1인 기준입니다.</li>
          <li>항공권 가격은 실시간으로 변동됩니다. 예약 사이트 이동 시 항공권이 없거나, 수집 시점 대비 가격이 바뀌어 있을 수 있습니다.</li>
        </ul>
      </footer>

      {/* Flight Detail Dialog */}
      {selectedFlight && (
        <FlightDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          city={selectedFlight.city}
          country={selectedFlight.country}
          countryCode={selectedFlight.countryCode}
          code={selectedFlight.meta?.code}
          priceData={selectedFlight.priceHistory}
          tripDays={dialogTripDays}
          onTripDaysChange={(n)=> {
            // 트립 기간 변경 시 즉시 차트 리로드 트리거
            setDialogTripDays(n);
          }}
          collectedAt={(selectedFlight as any).collectedAt}
          onRefresh={() => handleRefresh(selectedFlight.code)}
          refreshLoading={refreshingCodes.has(selectedFlight.code)}
          justRefreshed={justRefreshedCodes.has(selectedFlight.code)}
        />
      )}
    </div>
  );
};

export default Index;
