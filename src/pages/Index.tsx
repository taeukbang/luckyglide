import { useState } from "react";
import { FlightCard } from "@/components/FlightCard";
import { FlightDetailDialog } from "@/components/FlightDetailDialog";
import { mockFlights, Flight } from "@/data/mockFlights";
import { Plane } from "lucide-react";
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

const Index = () => {
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<string>("아시아");
  const [inviteCodeOpen, setInviteCodeOpen] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleFlightClick = (flight: Flight) => {
    setSelectedFlight(flight);
    setDialogOpen(true);
  };

  const handleInviteCodeSubmit = () => {
    if (inviteCode === "LuckyGlide1") {
      setIsAuthenticated(true);
      setInviteCodeOpen(false);
    }
  };

  const continents = ["국내", "아시아", "미주", "유럽", "대양주", "중동", "중남미", "아프리카"];
  
  const filteredFlights = mockFlights.filter(
    (flight) => flight.continent === selectedContinent
  );

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
        <div className="mb-6">
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
              onClick={() => handleFlightClick(flight)}
            />
          ))}
        </div>
      </main>

      {/* Flight Detail Dialog */}
      {selectedFlight && (
        <FlightDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          city={selectedFlight.city}
          country={selectedFlight.country}
          countryCode={selectedFlight.countryCode}
          priceData={selectedFlight.priceHistory}
        />
      )}
    </div>
  );
};

export default Index;
