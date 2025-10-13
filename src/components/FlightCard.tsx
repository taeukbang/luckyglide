import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FlightCardProps {
  city: string;
  country: string;
  countryCode: string;
  price: number;
  originalPrice: number;
  discount: number;
  travelDates: string;
  onClick: () => void;
}

export const FlightCard = ({
  city,
  country,
  countryCode,
  price,
  originalPrice,
  discount,
  travelDates,
  onClick,
}: FlightCardProps) => {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <img 
              src={`https://flagcdn.com/w40/${countryCode}.png`}
              alt={`${country} 국기`}
              className="w-9 h-9 object-cover rounded-full flex-shrink-0 border border-border"
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">{city}</h3>
              <p className="text-xs text-muted-foreground truncate">{country}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-primary leading-tight">₩{price.toLocaleString()}</span>
              <span className="text-xs text-destructive font-medium">(-{discount}%)</span>
            </div>
            <span className="text-xs text-muted-foreground leading-tight">
              ₩{originalPrice.toLocaleString()} ({travelDates}, 8일)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button size="sm" className="text-xs h-7 px-3">
            예약
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
