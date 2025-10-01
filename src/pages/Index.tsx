import { useState } from "react";
import { FlightCard } from "@/components/FlightCard";
import { FlightDetailDialog } from "@/components/FlightDetailDialog";
import { mockFlights, Flight } from "@/data/mockFlights";
import { Plane } from "lucide-react";

const Index = () => {
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleFlightClick = (flight: Flight) => {
    setSelectedFlight(flight);
    setDialogOpen(true);
  };

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
              <h1 className="text-2xl font-bold text-foreground">FlightTracker</h1>
              <p className="text-sm text-muted-foreground">다음 30일 최저가를 찾아보세요</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">인기 도시 항공권</h2>
          <p className="text-muted-foreground">최대 41% 할인된 가격으로 여행을 떠나보세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockFlights.map((flight) => (
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
