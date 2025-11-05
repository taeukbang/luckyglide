import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface FilterSidebarProps {
  regions: string[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  directOnly: boolean;
  onDirectChange: (direct: boolean) => void;
  tripDays: string;
  onTripDaysChange: (days: string) => void;
  tripDayOptions: string[];
}

export function FilterSidebar({
  regions,
  selectedRegion,
  onRegionChange,
  directOnly,
  onDirectChange,
  tripDays,
  onTripDaysChange,
  tripDayOptions,
}: FilterSidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 sticky top-4 h-fit bg-card rounded-lg border border-border p-4 space-y-6">
      {/* 지역 필터 */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">지역</h3>
        <RadioGroup value={selectedRegion} onValueChange={onRegionChange}>
          {regions.map((region) => (
            <div key={region} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={region} id={`region-${region}`} />
              <Label
                htmlFor={`region-${region}`}
                className="text-sm cursor-pointer flex-1"
              >
                {region}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* 직항 여부 */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">항공편</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="direct-only"
            checked={directOnly}
            onCheckedChange={(checked) => onDirectChange(Boolean(checked))}
          />
          <Label htmlFor="direct-only" className="text-sm cursor-pointer">
            직항만 보기
          </Label>
        </div>
      </div>

      <Separator />

      {/* 여정 길이 */}
      <div>
        <h3 className="font-semibold text-sm mb-3 text-foreground">여정 길이</h3>
        <RadioGroup value={tripDays} onValueChange={onTripDaysChange}>
          {tripDayOptions.map((option) => (
            <div key={option} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={option} id={`trip-${option}`} />
              <Label
                htmlFor={`trip-${option}`}
                className="text-sm cursor-pointer flex-1"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </aside>
  );
}
