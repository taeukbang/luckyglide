import { Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FlightCardProps {
  city: string;
  country: string;
  flag: string;
  price: number;
  originalPrice: number;
  discount: number;
  onClick: () => void;
}

export const FlightCard = ({
  city,
  country,
  flag,
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
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-2xl flex-shrink-0">{flag}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-foreground truncate">{city}</h3>
              <p className="text-xs text-muted-foreground truncate">{country}</p>
            </div>
          </div>
          <Badge variant="destructive" className="text-xs font-semibold flex-shrink-0">
            {discount}%
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary leading-tight">₩{price.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground line-through">
              ₩{originalPrice.toLocaleString()}
            </span>
          </div>
          <Button size="sm" className="text-xs h-8 px-3">
            예약
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
