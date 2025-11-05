import { Card, CardContent } from "@/components/ui/card";

export function FlightCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* 국기 아이콘 스켈레톤 */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
          
          {/* 가격 스켈레톤 */}
          <div className="flex flex-col items-end space-y-1 flex-shrink-0">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
            <div className="h-2 bg-gray-200 rounded animate-pulse w-16" />
          </div>
        </div>
        
        {/* 버튼들 스켈레톤 */}
        <div className="flex items-center justify-between gap-2">
          <div className="h-7 bg-gray-200 rounded animate-pulse w-24" />
          <div className="flex gap-2">
            <div className="h-7 bg-gray-200 rounded animate-pulse w-16" />
            <div className="h-7 bg-gray-200 rounded animate-pulse w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
