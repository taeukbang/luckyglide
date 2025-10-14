export interface CityItem {
  nameKo: string;
  code: string; // IATA city/airport code
  region: string;
}

// 이미지 내 도시를 가능한 IATA 도시/공항 코드로 매핑
export const DESTINATIONS: CityItem[] = [
  // 일본(아시아로 편입)
  { nameKo: "도쿄", code: "TYO", region: "아시아" },
  { nameKo: "오사카", code: "OSA", region: "아시아" },
  { nameKo: "후쿠오카", code: "FUK", region: "아시아" },
  { nameKo: "삿포로", code: "SPK", region: "아시아" },
  { nameKo: "오키나와", code: "OKA", region: "아시아" },
  { nameKo: "오사카/고베", code: "UKB", region: "아시아" },
  { nameKo: "나고야", code: "NGO", region: "아시아" },
  { nameKo: "구마모تو", code: "KMJ", region: "아시아" },
  { nameKo: "기타큐슈", code: "KKJ", region: "아시아" },
  { nameKo: "다카마쓰", code: "TAK", region: "아시아" },
  { nameKo: "오이타", code: "OIT", region: "아시아" },
  { nameKo: "마쓰야마", code: "MYJ", region: "아시아" },
  { nameKo: "히로시마", code: "HIJ", region: "아시아" },
  { nameKo: "요나고", code: "YGJ", region: "아시아" },

  // 아시아
  { nameKo: "다낭", code: "DAD", region: "아시아" },
  { nameKo: "방콕/수완나품", code: "BKK", region: "아시아" },
  { nameKo: "세부", code: "CEB", region: "아시아" },
  { nameKo: "싱가포르", code: "SIN", region: "아시아" },
  { nameKo: "코타키나발루", code: "BKI", region: "아시아" },
  { nameKo: "나트랑/깜란", code: "CXR", region: "아시아" },
  { nameKo: "홍콩", code: "HKG", region: "아시아" },
  { nameKo: "호치민", code: "SGN", region: "아시아" },
  { nameKo: "대만/타오위안", code: "TPE", region: "아시아" },
  { nameKo: "치앙마이", code: "CNX", region: "아시아" },
  { nameKo: "울란바토르", code: "ULN", region: "아시아" },
  { nameKo: "하노이", code: "HAN", region: "아시아" },
  { nameKo: "푸켓", code: "HKT", region: "아시아" },
  { nameKo: "마닐라", code: "MNL", region: "아시아" },
  { nameKo: "대만/송산", code: "TSA", region: "아시아" },
  { nameKo: "마카오", code: "MFM", region: "아시아" },
  { nameKo: "프놈펜", code: "PNH", region: "아시아" },
  { nameKo: "알마티", code: "ALA", region: "아시아" },
  { nameKo: "쿠알라룸푸르", code: "KUL", region: "아시아" },
  { nameKo: "몰디브/말레", code: "MLE", region: "아시아" },

  // 미주
  { nameKo: "하와이/호놀룰루", code: "HNL", region: "미주" },
  { nameKo: "로스앤젤레스", code: "LAX", region: "미주" },
  { nameKo: "뉴욕", code: "NYC", region: "미주" },
  { nameKo: "샌프란시스코", code: "SFO", region: "미주" },
  { nameKo: "라스베이거스", code: "LAS", region: "미주" },
  { nameKo: "댈러스", code: "DFW", region: "미주" },
  { nameKo: "밴쿠버", code: "YVR", region: "미주" },
  { nameKo: "토론토", code: "YTO", region: "미주" },
  { nameKo: "워싱턴/덜레스", code: "IAD", region: "미주" },
  { nameKo: "캘거리", code: "YYC", region: "미주" },

  // 유럽
  { nameKo: "파리", code: "PAR", region: "유럽" },
  { nameKo: "런던", code: "LON", region: "유럽" },
  { nameKo: "로마", code: "ROM", region: "유럽" },
  { nameKo: "바르셀로나", code: "BCN", region: "유럽" },
  { nameKo: "프랑크푸르트", code: "FRA", region: "유럽" },
  { nameKo: "프라하", code: "PRG", region: "유럽" },
  { nameKo: "암스테르담", code: "AMS", region: "유럽" },
  { nameKo: "이스탄불", code: "IST", region: "유럽" },
  { nameKo: "헬싱키", code: "HEL", region: "유럽" },
  { nameKo: "취리히", code: "ZRH", region: "유럽" },
  { nameKo: "바르샤바", code: "WAW", region: "유럽" },
  { nameKo: "리스본", code: "LIS", region: "유럽" },
  { nameKo: "밀라노/말펜사", code: "MXP", region: "유럽" },
  { nameKo: "부다페스트", code: "BUD", region: "유럽" },
  { nameKo: "자그레브", code: "ZAG", region: "유럽" },
  { nameKo: "두브로브니크", code: "DBV", region: "유럽" },
  { nameKo: "베니스", code: "VCE", region: "유럽" },
  { nameKo: "비엔나", code: "VIE", region: "유럽" },

  // 대양주
  { nameKo: "괌", code: "GUM", region: "대양주" },
  { nameKo: "사이판", code: "SPN", region: "대양주" },
  { nameKo: "시드니", code: "SYD", region: "대양주" },
  { nameKo: "멜버른", code: "MEL", region: "대양주" },

  // 중동
  { nameKo: "아부다비", code: "AUH", region: "중동" },
  { nameKo: "텔아비브", code: "TLV", region: "중동" },
  { nameKo: "도하", code: "DOH", region: "중동" },
  { nameKo: "두바이", code: "DXB", region: "중동" },

  // 중남미
  { nameKo: "상파울로", code: "GRU", region: "중남미" },
  { nameKo: "칸쿤", code: "CUN", region: "중남미" },
  { nameKo: "산티아고", code: "SCL", region: "중남미" },
  { nameKo: "하바나", code: "HAV", region: "중남미" },

  // 아프리카
  { nameKo: "나이로비", code: "NBO", region: "아프리카" },
  { nameKo: "케이프타운", code: "CPT", region: "아프리카" },
  { nameKo: "카이로", code: "CAI", region: "아프리카" },
  { nameKo: "모리셔스", code: "MRU", region: "아프리카" },

  // 중국(아시아로 편입)
  { nameKo: "북경", code: "BJS", region: "아시아" },
  { nameKo: "상해/푸동", code: "PVG", region: "아시아" },
  { nameKo: "청도", code: "TAO", region: "아시아" },
  { nameKo: "청두", code: "CTU", region: "아시아" },
];


