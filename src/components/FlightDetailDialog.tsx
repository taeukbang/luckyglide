import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriceChart } from "./PriceChart";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";

interface FlightDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: string;
  country: string;
  countryCode: string;
  priceData: {
    date: string;
    price: number;
  }[];
}

export const FlightDetailDialog = ({
  open,
  onOpenChange,
  city,
  country,
  countryCode,
  priceData,
}: FlightDetailDialogProps) => {
  const [tripDuration, setTripDuration] = useState("3");

  const minPrice = Math.min(...priceData.map(d => d.price));
  const maxPrice = Math.max(...priceData.map(d => d.price));
  const avgPrice = Math.round(priceData.reduce((sum, d) => sum + d.price, 0) / priceData.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <img 
              src={`https://flagcdn.com/w80/${countryCode}.png`}
              alt={`${country} 국기`}
              className="w-12 h-9 object-cover rounded"
            />
            <div>
              <DialogTitle className="text-2xl">{city}</DialogTitle>
              <DialogDescription className="text-base">{country}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">최저가</p>
              <p className="text-xl font-bold text-success">₩{minPrice.toLocaleString()}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">평균가</p>
              <p className="text-xl font-bold text-foreground">₩{avgPrice.toLocaleString()}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">최고가</p>
              <p className="text-xl font-bold text-destructive">₩{maxPrice.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">여행 기간</label>
              </div>
              <Select value={tripDuration} onValueChange={setTripDuration}>
                <SelectTrigger className="w-[180px]">
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

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>선택한 기간: {tripDuration}일</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-lg">날짜별 가격 추이</h4>
            <PriceChart data={priceData} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1" size="lg">
              최저가 예약하기
            </Button>
            <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
