export interface CityItem { nameKo: string; code: string; region: string }

// 최소 구동을 위한 서버리스용 목적지 목록 (원본은 server/cities.ts)
export const DESTINATIONS_MIN: CityItem[] = [
  { nameKo: "도쿄", code: "TYO", region: "아시아" },
  { nameKo: "오사카", code: "OSA", region: "아시아" },
  { nameKo: "후쿠오카", code: "FUK", region: "아시아" },
  { nameKo: "삿포로", code: "SPK", region: "아시아" },
  { nameKo: "오키나와", code: "OKA", region: "아시아" },
  { nameKo: "홍콩", code: "HKG", region: "아시아" },
  { nameKo: "싱가포르", code: "SIN", region: "아시아" },
  { nameKo: "타이베이", code: "TPE", region: "아시아" },
  { nameKo: "방콕", code: "BKK", region: "아시아" },
  { nameKo: "다낭", code: "DAD", region: "아시아" },
  { nameKo: "뉴욕", code: "NYC", region: "미주" },
  { nameKo: "로스앤젤레스", code: "LAX", region: "미주" },
  { nameKo: "파리", code: "PAR", region: "유럽" },
  { nameKo: "런던", code: "LON", region: "유럽" },
];


