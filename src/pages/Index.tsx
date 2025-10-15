import { useEffect, useMemo, useState } from "react";
import { FlightCard } from "@/components/FlightCard";
import { FlightDetailDialog } from "@/components/FlightDetailDialog";
// import { mockFlights, Flight } from "@/data/mockFlights";
import { Plane } from "lucide-react";
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
import { Button } from "@/components/ui/button";

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
};

const Index = () => {
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<string>("모두");
  const [inviteCodeOpen, setInviteCodeOpen] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [items, setItems] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  // tripDuration state mirrored to dialog to trigger reload from parent
  const [dialogTripDays, setDialogTripDays] = useState<number>(3);

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
  const sortOptions = [
    { key: "priceAsc", label: "가격 낮은 순" },
    { key: "discountDesc", label: "최고가 대비 할인율 높은 순" },
  ];
  const [sortKey, setSortKey] = useState<string>(sortOptions[0].key);
  
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

        // A) 대상 도시 목록 로드
        const resDest = await fetch(`/api/destinations`, { signal: controller.signal });
        if (!resDest.ok) throw new Error(`HTTP ${resDest.status}`);
        const dataDest = await resDest.json();
        let targets: { code: string; nameKo: string; region: string }[] = dataDest.destinations || [];

        // 대륙 필터 적용
        if (selectedContinent && selectedContinent !== "모두") {
          targets = targets.filter((d) => d.region === selectedContinent);
        }

        // B) 플레이스홀더 먼저 렌더링
        const baseItems: LatestItem[] = targets.map((t) => ({
          code: t.code,
          city: t.nameKo,
          region: t.region,
          country: null as any,
          countryCode: null as any,
          price: null as any,
          originalPrice: null,
          departureDate: null as any,
          returnDate: null as any,
          airline: null as any,
          collectedAt: "",
          tripDays: null,
        }));
        setItems(baseItems);

        // C) 작은 동시성 풀(3)로 코드별 로딩, 응답 즉시 해당 카드만 갱신
        const codes = targets.map((t) => t.code);

        const fetchOne = async (code: string) => {
          const url = `/api/latest-live?from=ICN&codes=${encodeURIComponent(code)}&days=14&minTripDays=3&maxTripDays=7`;
          const ctrl = new AbortController();
          const id = setTimeout(() => ctrl.abort(), 12000);
          try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const item: LatestItem | undefined = (data.items || [])[0];
            if (!item) return;
            setItems((prev) => prev.map((it) => it.code === item.code ? ({ ...it, ...item }) as LatestItem : it));
          } catch (e) {
            // 실패 시 다음 작업으로 진행
          } finally {
            clearTimeout(id);
          }
        };

        const POOL = 3;
        let idx = 0;
        await Promise.all(
          Array.from({ length: Math.min(POOL, codes.length) }).map(async () => {
            while (idx < codes.length) {
              const my = idx++;
              await fetchOne(codes[my]);
            }
          })
        );
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message ?? "load error");
      } finally {
        setLoading(false);
      }
    };

    progressiveLoad();
    return () => controller.abort();
  }, [selectedContinent]);

  const filteredFlights = useMemo(() => {
    const regionSet = new Set<string>([selectedContinent]);
    // 숫자 보장: Supabase numeric → string 방지
    const normalized = items.map((it) => {
      const priceNum = it.price !== null && it.price !== undefined && it.price !== "" ? Number(it.price) : null as any;
      const originalPriceNum = it.originalPrice !== null && it.originalPrice !== undefined && it.originalPrice !== "" ? Number(it.originalPrice) : null as any;
      return { ...it, price: priceNum, originalPrice: originalPriceNum } as LatestItem;
    });
    // 정렬
    const sorted = [...normalized].sort((a, b) => {
      if (sortKey === "discountDesc") {
        const aDiscount = (typeof a.price === 'number' && typeof a.originalPrice === 'number' && a.originalPrice > 0)
          ? Math.abs(100 - Math.round((Number(a.price) / Number(a.originalPrice)) * 100)) : -Infinity;
        const bDiscount = (typeof b.price === 'number' && typeof b.originalPrice === 'number' && b.originalPrice > 0)
          ? Math.abs(100 - Math.round((Number(b.price) / Number(b.originalPrice)) * 100)) : -Infinity;
        return (bDiscount - aDiscount);
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
        return ({
          code: it.code,
          id: `${it.code}-${idx}`,
          city: it.city,
          country: (codeToCountry[it.code]?.countryKo) ?? (it.region ?? ""),
          countryCode: (codeToCountry[it.code]?.countryCode) ?? undefined,
          price: price as any,
          originalPrice: original as any,
          discount,
          travelDates,
          meta: { code: it.code, tripDays: it.tripDays ?? undefined },
          priceHistory: [] as any,
          continent: it.region ?? "",
        });
      });
  }, [items, selectedContinent, sortKey]);

  useEffect(() => {
    if (!dialogOpen || !selectedFlight?.code) return;
    const controller = new AbortController();
    const loadHistory = async (tripDays: number) => {
      try {
        setChartLoading(true);
        const res = await fetch('/api/calendar-window', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'ICN', to: selectedFlight.code, tripDays, days: 14 }),
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
            <div className="p-2 bg-primary rounded-lg">
              <Plane className="h-6 w-6 text-primary-foreground" />
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
        <div className="mb-6 flex gap-3 flex-col sm:flex-row">
          <Select value={selectedContinent} onValueChange={setSelectedContinent}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="대륙 선택" />
            </SelectTrigger>
            <SelectContent>
              {continents.map((continent) => (
                <SelectItem key={continent} value={continent}>
                  {continent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue placeholder="정렬" />
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
              meta={{ code: flight.code, tripDays: (flight as any).meta?.tripDays }}
              onClick={() => handleFlightClick(flight)}
              onShowChart={() => handleFlightClick(flight)}
            />
          ))}
        </div>
      </main>

      {/* Disclaimer */}
      <footer className="container mx-auto px-4 py-6">
        <p className="text-xs text-muted-foreground">
          할인율은 해당 기간 중 최고가 대비 할인율을 의미합니다.
        </p>
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
          onTripDaysChange={(n)=> setDialogTripDays(n)}
        />
      )}
    </div>
  );
};

export default Index;
