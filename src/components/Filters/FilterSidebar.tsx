import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface FilterSidebarProps {
  regions: string[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  tripDays: string;
  onTripDaysChange: (days: string) => void;
  tripDayOptions: string[];
  isMobile?: boolean;
}

export function FilterSidebar({
  regions,
  selectedRegion,
  onRegionChange,
  tripDays,
  onTripDaysChange,
  tripDayOptions,
  isMobile = false,
}: FilterSidebarProps) {
  return (
    <aside className={isMobile ? "" : "w-64 flex-shrink-0 sticky top-4 h-fit bg-white rounded-lg border border-gray-200 p-4 space-y-6"}>
      {/* 지역 필터 */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-gray-900">지역</h3>
        <RadioGroup value={selectedRegion} onValueChange={onRegionChange}>
          <div className={isMobile ? "grid grid-cols-3 gap-2" : ""}>
            {regions.map((region) => (
              <div key={region} className={`flex items-center space-x-2 ${isMobile ? "" : "mb-2"}`}>
                <RadioGroupItem value={region} id={`region-${isMobile ? "mobile-" : ""}${region}`} />
                <Label
                  htmlFor={`region-${isMobile ? "mobile-" : ""}${region}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {region}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {!isMobile && <Separator />}

      {/* 여정 길이 */}
      <div className={isMobile ? "pt-4 border-t border-gray-200" : ""}>
        <h3 className="font-semibold text-sm mb-3 text-gray-900">여정 길이</h3>
        <RadioGroup value={tripDays} onValueChange={onTripDaysChange}>
          <div className={isMobile ? "grid grid-cols-2 gap-2" : ""}>
            {tripDayOptions.map((option) => (
              <div key={option} className={`flex items-center space-x-2 ${isMobile ? "" : "mb-2"}`}>
                <RadioGroupItem value={option} id={`trip-${isMobile ? "mobile-" : ""}${option}`} />
                <Label
                  htmlFor={`trip-${isMobile ? "mobile-" : ""}${option}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </aside>
  );
}
