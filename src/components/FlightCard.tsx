import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FlightCardProps {
  city: string;
  country: string;
  countryCode: string;
  price: number;
  originalPrice: number;
  discount: number;
  onClick: () => void;
}

export const FlightCard = ({
  city,
  country,
  countryCode,
  price,
  originalPrice,
  discount,
  onClick,
}: FlightCardProps) => {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <img 
            src={`https://flagcdn.com/w40/${countryCode}.png`}
            alt={`${country} 국기`}
            className="w-8 h-6 object-cover rounded flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground truncate">{city}</h3>
            <p className="text-xs text-muted-foreground truncate">{country}</p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 mb-1.5">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary leading-tight">₩{price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground line-through leading-tight">
              ₩{originalPrice.toLocaleString()}
            </span>
          </div>
          <Button size="sm" className="text-xs h-7 px-3">
            예약
          </Button>
        </div>

        <p className="text-xs text-success font-medium">
          최고가 대비 {discount}% 할인된 가격이에요
        </p>
      </CardContent>
    </Card>
  );
};
