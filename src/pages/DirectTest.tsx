import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PriceChart } from "@/components/PriceChart";

type WindowItem = { date: string; price: number };

const DirectTest = () => {
  const [from, setFrom] = useState("ICN");
  const [to, setTo] = useState("FUK");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [days, setDays] = useState(14);
  const [tripDays, setTripDays] = useState(4);
  const [airlines, setAirlines] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WindowItem[]>([]);

  const handleFetch = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems([]);
      const body = {
        from,
        to,
        startDate,
        days: Math.max(1, Number(days)),
        tripDays: Math.max(1, Number(tripDays)),
        transfer: 0, // 직항만
        international: true,
        airlines: airlines && airlines.trim() ? airlines.split(',').map(s => s.trim()) : ["All"],
      } as any;
      const res = await fetch(`/api/calendar-window`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arr: WindowItem[] = (data?.items || []).map((it: any) => ({ date: String(it.date), price: Number(it.price) }));
      setItems(arr);
    } catch (e: any) {
      setError(e?.message ?? 'fetch error');
    } finally {
      setLoading(false);
    }
  };

  const minPrice = useMemo(() => {
    if (!items.length) return null as any;
    return items.reduce((acc, cur) => (cur.price < acc.price ? cur : acc));
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">Direct Flight Test</h1>
          <p className="text-sm text-muted-foreground">직항(transfer=0) 조건으로 MRT 캘린더 API 테스트</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">출발(From)</label>
            <Input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">도착(To)</label>
            <Input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">시작일(Start Date)</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">스캔일수(Days)</label>
            <Input type="number" min={1} max={60} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">체류일(Trip Days)</label>
            <Input type="number" min={1} max={30} value={tripDays} onChange={(e) => setTripDays(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Airlines (쉼표로 구분, 기본 All)</label>
            <Input placeholder="All 또는 KE,OZ 등" value={airlines} onChange={(e) => setAirlines(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleFetch} disabled={loading}>
            {loading ? '불러오는 중...' : '직항으로 조회'}
          </Button>
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">결과 수: {items.length}</div>
          {minPrice ? (
            <div className="text-sm">최저가: {minPrice.date} ₩{Number(minPrice.price).toLocaleString()}</div>
          ) : null}
          <PriceChart data={items} tripDays={tripDays} />
        </div>
      </main>
    </div>
  );
};

export default DirectTest;



