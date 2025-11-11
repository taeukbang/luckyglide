import { Search } from "lucide-react";
// NOTE: Title uses PNG logo placed under public/logo.png

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
      <div className="container mx-auto px-4 py-4">
        {/* 왼쪽 정렬 */}
        <div>
          {/* 메인 타이틀 - PNG 로고 + 서비스명 */}
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            <img src="/logo.png" alt="LuckyGlide" className="h-[1em] w-[1em] align-text-bottom" />
            <span>LuckyGlide</span>
          </h1>
          
          {/* 서브타이틀 - 회색, 문구 축약 */}
          <p className="text-sm text-gray-600 mb-4">
            일정과 가격을 먼저 보고 여행지를 골라보세요.
          </p>
          
          {/* 인기 지역 - 미니멀 칩 */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-sm text-gray-500">지역</span>
            {popularRegions.map((region) => (
              <button
                key={region.name}
                onClick={() => onContinentClick?.(region.name)}
                className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-md border border-gray-200 transition-colors whitespace-nowrap"
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
