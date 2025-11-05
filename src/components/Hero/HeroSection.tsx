import { Search } from "lucide-react";

interface HeroSectionProps {
  onContinentClick?: (continent: string) => void;
}

const popularRegions = [
  { name: "아시아", emoji: "🌏" },
  { name: "유럽", emoji: "🏰" },
  { name: "미주", emoji: "🗽" },
  { name: "대양주", emoji: "🏝️" },
];

export function HeroSection({ onContinentClick }: HeroSectionProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 메인 타이틀 - 미니멀 */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            항공권 최저가 검색
          </h1>
          
          {/* 서브타이틀 - 회색 */}
          <p className="text-base text-gray-600 mb-6">
            실시간 최저가를 비교하고 저렴한 항공권을 예약하세요
          </p>
          
          {/* 인기 지역 - 미니멀 칩 */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">인기 지역</span>
            {popularRegions.map((region) => (
              <button
                key={region.name}
                onClick={() => onContinentClick?.(region.name)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-md border border-gray-200 transition-colors"
              >
                <span className="mr-1">{region.emoji}</span>
                {region.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
