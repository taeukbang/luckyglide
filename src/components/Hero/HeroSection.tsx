import { Plane } from "lucide-react";

interface HeroSectionProps {
  onContinentClick?: (continent: string) => void;
}

const popularRegions = [
  { name: "아시아", emoji: "🌏", gradient: "from-blue-500 to-cyan-400" },
  { name: "유럽", emoji: "🏰", gradient: "from-purple-500 to-pink-400" },
  { name: "미주", emoji: "🗽", gradient: "from-green-500 to-teal-400" },
  { name: "대양주", emoji: "🏝️", gradient: "from-yellow-500 to-orange-400" },
];

export function HeroSection({ onContinentClick }: HeroSectionProps) {
  return (
    <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* 아이콘 */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <Plane className="w-8 h-8 text-white" />
          </div>
          
          {/* 메인 타이틀 */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            떠나기 좋은 날을 찾아드립니다
          </h1>
          
          {/* 서브타이틀 */}
          <p className="text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
            실시간 최저가 항공권을 비교하고 특가 알림을 받아보세요
          </p>
          
          {/* 인기 지역 빠른 선택 */}
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <span className="text-sm font-medium opacity-80 mr-2">인기 지역:</span>
            {popularRegions.map((region) => (
              <button
                key={region.name}
                onClick={() => onContinentClick?.(region.name)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-105 border border-white/20 text-sm font-medium"
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
