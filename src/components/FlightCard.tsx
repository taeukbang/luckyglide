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
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{flag}</span>
            <div>
              <h3 className="text-xl font-bold text-foreground">{city}</h3>
              <p className="text-sm text-muted-foreground">{country}</p>
            </div>
          </div>
          <Plane className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">₩{price.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground line-through">
              ₩{originalPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="destructive" className="font-semibold">
              {discount}% 할인
            </Badge>
            <Button size="sm" className="font-semibold">
              예약하기
            </Button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">다음 30일 중 최저가</p>
        </div>
      </CardContent>
    </Card>
  );
};
