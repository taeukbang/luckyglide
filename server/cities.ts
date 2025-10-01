export interface CityItem {
  nameKo: string;
  code: string; // IATA city/airport code
  region: string; // 대륙/권역
  country?: string; // 국가명(ko)
  countryCode?: string; // ISO-3166 alpha-2
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
  
  // 추가: 인기/수도 확장 (아시아 - 일본 제외)
  { nameKo: "코사무이", code: "USM", region: "아시아" },
  { nameKo: "끄라비", code: "KBV", region: "아시아" },
  { nameKo: "치앙라이", code: "CEI", region: "아시아" },
  { nameKo: "파타야/우타파오", code: "UTP", region: "아시아" },
  { nameKo: "푸꾸옥", code: "PQC", region: "아시아" },
  { nameKo: "달랏", code: "DLI", region: "아시아" },
  { nameKo: "후에", code: "HUI", region: "아시아" },
  { nameKo: "하이퐁", code: "HPH", region: "아시아" },
  { nameKo: "보라카이/칼리보", code: "KLO", region: "아시아" },
  { nameKo: "보라카이/카틱란", code: "MPH", region: "아시아" },
  { nameKo: "클락", code: "CRK", region: "아시아" },
  { nameKo: "보홀", code: "TAG", region: "아시아" },
  { nameKo: "푸에르토프린세사", code: "PPS", region: "아시아" },
  { nameKo: "랑카위", code: "LGK", region: "아시아" },
  { nameKo: "페낭", code: "PEN", region: "아시아" },
  { nameKo: "조호르바루", code: "JHB", region: "아시아" },
  { nameKo: "쿠칭", code: "KCH", region: "아시아" },
  { nameKo: "발리/덴파사르", code: "DPS", region: "아시아" },
  { nameKo: "자카르타", code: "CGK", region: "아시아" },
  { nameKo: "롬복", code: "LOP", region: "아시아" },
  { nameKo: "라부안바조", code: "LBJ", region: "아시아" },
  { nameKo: "수라바야", code: "SUB", region: "아시아" },
  { nameKo: "욕야카르타", code: "JOG", region: "아시아" },
  { nameKo: "가오슝", code: "KHH", region: "아시아" },
  { nameKo: "타이중", code: "RMQ", region: "아시아" },
  { nameKo: "타이난", code: "TNN", region: "아시아" },
  { nameKo: "씨엠립", code: "REP", region: "아시아" },
  { nameKo: "비엔티안", code: "VTE", region: "아시아" },
  { nameKo: "루앙프라방", code: "LPQ", region: "아시아" },
  { nameKo: "양곤", code: "RGN", region: "아시아" },
  { nameKo: "아스타나", code: "NQZ", region: "아시아" },

  // 추가: 중국(아시아)
  { nameKo: "광저우", code: "CAN", region: "아시아" },
  { nameKo: "선전", code: "SZX", region: "아시아" },
  { nameKo: "항저우", code: "HGH", region: "아시아" },
  { nameKo: "시안", code: "XIY", region: "아시아" },
  { nameKo: "샤먼", code: "XMN", region: "아시아" },
  { nameKo: "다롄", code: "DLC", region: "아시아" },
  { nameKo: "선양", code: "SHE", region: "아시아" },
  { nameKo: "하얼빈", code: "HRB", region: "아시아" },
  { nameKo: "난징", code: "NKG", region: "아시아" },
  { nameKo: "쿤밍", code: "KMG", region: "아시아" },
  { nameKo: "우한", code: "WUH", region: "아시아" },
  { nameKo: "충칭", code: "CKG", region: "아시아" },
  { nameKo: "톈진", code: "TSN", region: "아시아" },
  { nameKo: "창사", code: "CSX", region: "아시아" },
  { nameKo: "정저우", code: "CGO", region: "아시아" },
  { nameKo: "닝보", code: "NGB", region: "아시아" },
  { nameKo: "푸저우", code: "FOC", region: "아시아" },
  { nameKo: "원저우", code: "WNZ", region: "아시아" },
  { nameKo: "난닝", code: "NNG", region: "아시아" },

  // 추가: 일본
  { nameKo: "이시가키", code: "ISG", region: "아시아" },
  { nameKo: "미야코", code: "MMY", region: "아시아" },
  { nameKo: "센다이", code: "SDJ", region: "아시아" },
  { nameKo: "시즈오카", code: "FSZ", region: "아시아" },
  { nameKo: "가고시마", code: "KOJ", region: "아시아" },
  { nameKo: "미야자키", code: "KMI", region: "아시아" },
  { nameKo: "오카야마", code: "OKJ", region: "아시아" },
  { nameKo: "나가사키", code: "NGS", region: "아시아" },
  { nameKo: "아사히카와", code: "AKJ", region: "아시아" },
  { nameKo: "아오모리", code: "AOJ", region: "아시아" },
  { nameKo: "하코다테", code: "HKD", region: "아시아" },
  { nameKo: "오비히로", code: "OBO", region: "아시아" },
  { nameKo: "고마츠", code: "KMQ", region: "아시아" },
  { nameKo: "도야마", code: "TOY", region: "아시아" },
  { nameKo: "니가타", code: "KIJ", region: "아시아" },
  { nameKo: "고치", code: "KCZ", region: "아시아" },

  // 추가: 미주(미국/캐나다)
  { nameKo: "시애틀", code: "SEA", region: "미주" },
  { nameKo: "시카고", code: "CHI", region: "미주" },
  { nameKo: "애틀랜타", code: "ATL", region: "미주" },
  { nameKo: "보스턴", code: "BOS", region: "미주" },
  { nameKo: "마이애미", code: "MIA", region: "미주" },
  { nameKo: "휴스턴", code: "IAH", region: "미주" },
  { nameKo: "덴버", code: "DEN", region: "미주" },
  { nameKo: "샌디에이고", code: "SAN", region: "미주" },
  { nameKo: "포틀랜드", code: "PDX", region: "미주" },
  { nameKo: "필라델피아", code: "PHL", region: "미주" },
  { nameKo: "피닉스", code: "PHX", region: "미주" },
  { nameKo: "올랜도", code: "MCO", region: "미주" },
  { nameKo: "몬트리올", code: "YMQ", region: "미주" },
  { nameKo: "오타와", code: "YOW", region: "미주" },
  { nameKo: "에드먼턴", code: "YEG", region: "미주" },
  { nameKo: "위니펙", code: "YWG", region: "미주" },
  { nameKo: "퀘벡시티", code: "YQB", region: "미주" },

  // 추가: 유럽
  { nameKo: "마드리드", code: "MAD", region: "유럽" },
  { nameKo: "뮌헨", code: "MUC", region: "유럽" },
  { nameKo: "베를린", code: "BER", region: "유럽" },
  { nameKo: "아테네", code: "ATH", region: "유럽" },
  { nameKo: "니스", code: "NCE", region: "유럽" },
  { nameKo: "코펜하겐", code: "CPH", region: "유럽" },
  { nameKo: "스톡홀름", code: "ARN", region: "유럽" },
  { nameKo: "오슬로", code: "OSL", region: "유럽" },
  { nameKo: "브뤼셀", code: "BRU", region: "유럽" },
  { nameKo: "제네바", code: "GVA", region: "유럽" },
  { nameKo: "뒤셀도르프", code: "DUS", region: "유럽" },
  { nameKo: "함부르크", code: "HAM", region: "유럽" },
  { nameKo: "슈투트가르트", code: "STR", region: "유럽" },
  { nameKo: "크라쿠프", code: "KRK", region: "유럽" },
  { nameKo: "더블린", code: "DUB", region: "유럽" },
  { nameKo: "맨체스터", code: "MAN", region: "유럽" },
  { nameKo: "에든버러", code: "EDI", region: "유럽" },
  { nameKo: "버밍엄", code: "BHX", region: "유럽" },
  { nameKo: "포르투", code: "OPO", region: "유럽" },
  { nameKo: "말라가", code: "AGP", region: "유럽" },
  { nameKo: "팔마데마요르카", code: "PMI", region: "유럽" },
  { nameKo: "나폴리", code: "NAP", region: "유럽" },
  { nameKo: "피렌체", code: "FLR", region: "유럽" },
  { nameKo: "안탈리아", code: "AYT", region: "유럽" },
  { nameKo: "산토리니", code: "JTR", region: "유럽" },
  { nameKo: "미코노스", code: "JMK", region: "유럽" },

  // 추가: 대양주
  { nameKo: "브리즈번", code: "BNE", region: "대양주" },
  { nameKo: "골드코스트", code: "OOL", region: "대양주" },
  { nameKo: "퍼스", code: "PER", region: "대양주" },
  { nameKo: "애들레이드", code: "ADL", region: "대양주" },
  { nameKo: "오클랜드", code: "AKL", region: "대양주" },
  { nameKo: "크라이스트처치", code: "CHC", region: "대양주" },
  { nameKo: "케언즈", code: "CNS", region: "대양주" },

  // 추가: 중동
  { nameKo: "리야드", code: "RUH", region: "중동" },
  { nameKo: "제다", code: "JED", region: "중동" },
  { nameKo: "무스카트", code: "MCT", region: "중동" },
  { nameKo: "바레인", code: "BAH", region: "중동" },
  { nameKo: "쿠웨이트", code: "KWI", region: "중동" },
  { nameKo: "테헤란", code: "IKA", region: "중동" },
  { nameKo: "암만", code: "AMM", region: "중동" },

  // 추가: 남아시아(지역값: 아시아)
  { nameKo: "델리", code: "DEL", region: "아시아" },
  { nameKo: "뭄바이", code: "BOM", region: "아시아" },
  { nameKo: "첸나이", code: "MAA", region: "아시아" },
  { nameKo: "벵갈루루", code: "BLR", region: "아시아" },
  { nameKo: "하이데라바드", code: "HYD", region: "아시아" },
  { nameKo: "코치", code: "COK", region: "아시아" },
  { nameKo: "트리반드룸", code: "TRV", region: "아시아" },
  { nameKo: "고아", code: "GOI", region: "아시아" },
  { nameKo: "콜롬보", code: "CMB", region: "아시아" },
  { nameKo: "카트만두", code: "KTM", region: "아시아" },
  { nameKo: "다카", code: "DAC", region: "아시아" },

  // 추가: 중남미
  { nameKo: "멕시코시티", code: "MEX", region: "중남미" },
  { nameKo: "리마", code: "LIM", region: "중남미" },
  { nameKo: "리우데자네이루", code: "GIG", region: "중남미" },
  { nameKo: "부에노스아이레스", code: "EZE", region: "중남미" },
  { nameKo: "보고타", code: "BOG", region: "중남미" },
  { nameKo: "파나마시티", code: "PTY", region: "중남미" },

  // 추가: 아프리카
  { nameKo: "요하네스버그", code: "JNB", region: "아프리카" },
  { nameKo: "마라케시", code: "RAK", region: "아프리카" },
  { nameKo: "카사블랑카", code: "CMN", region: "아프리카" },
  { nameKo: "잔지바르", code: "ZNZ", region: "아프리카" },
  { nameKo: "아디스아바바", code: "ADD", region: "아프리카" },
  { nameKo: "마헤/세이셸", code: "SEZ", region: "아프리카" },
];

// 간단 국가 매핑(코드 기준) – 필요한 만큼 확장
const CODE_TO_COUNTRY: Record<string, { country: string; countryCode: string }> = {
  // 일본
  TYO:{country:"일본",countryCode:"JP"}, OSA:{country:"일본",countryCode:"JP"}, FUK:{country:"일본",countryCode:"JP"}, SPK:{country:"일본",countryCode:"JP"},
  OKA:{country:"일본",countryCode:"JP"}, UKB:{country:"일본",countryCode:"JP"}, NGO:{country:"일본",countryCode:"JP"}, KMJ:{country:"일본",countryCode:"JP"},
  KKJ:{country:"일본",countryCode:"JP"}, TAK:{country:"일본",countryCode:"JP"}, OIT:{country:"일본",countryCode:"JP"}, MYJ:{country:"일본",countryCode:"JP"},
  HIJ:{country:"일본",countryCode:"JP"}, YGJ:{country:"일본",countryCode:"JP"}, ISG:{country:"일본",countryCode:"JP"}, MMY:{country:"일본",countryCode:"JP"},
  SDJ:{country:"일본",countryCode:"JP"}, FSZ:{country:"일본",countryCode:"JP"}, KOJ:{country:"일본",countryCode:"JP"}, KMI:{country:"일본",countryCode:"JP"},
  OKJ:{country:"일본",countryCode:"JP"}, NGS:{country:"일본",countryCode:"JP"}, AKJ:{country:"일본",countryCode:"JP"}, AOJ:{country:"일본",countryCode:"JP"},
  HKD:{country:"일본",countryCode:"JP"}, OBO:{country:"일본",countryCode:"JP"}, KMQ:{country:"일본",countryCode:"JP"}, TOY:{country:"일본",countryCode:"JP"},
  KIJ:{country:"일본",countryCode:"JP"}, KCZ:{country:"일본",countryCode:"JP"},

  // 중국/홍콩/대만
  BJS:{country:"중국",countryCode:"CN"}, PVG:{country:"중국",countryCode:"CN"}, TAO:{country:"중국",countryCode:"CN"}, CTU:{country:"중국",countryCode:"CN"},
  CAN:{country:"중국",countryCode:"CN"}, SZX:{country:"중국",countryCode:"CN"}, HGH:{country:"중국",countryCode:"CN"}, XIY:{country:"중국",countryCode:"CN"},
  XMN:{country:"중국",countryCode:"CN"}, DLC:{country:"중국",countryCode:"CN"}, SHE:{country:"중국",countryCode:"CN"}, HRB:{country:"중국",countryCode:"CN"},
  NKG:{country:"중국",countryCode:"CN"}, KMG:{country:"중국",countryCode:"CN"}, CKG:{country:"중국",countryCode:"CN"}, TSN:{country:"중국",countryCode:"CN"},
  CGO:{country:"중국",countryCode:"CN"}, NGB:{country:"중국",countryCode:"CN"}, FOC:{country:"중국",countryCode:"CN"}, WNZ:{country:"중국",countryCode:"CN"},
  NNG:{country:"중국",countryCode:"CN"}, WUH:{country:"중국",countryCode:"CN"}, CSX:{country:"중국",countryCode:"CN"}, HKG:{country:"홍콩",countryCode:"HK"},
  TPE:{country:"대만",countryCode:"TW"}, TSA:{country:"대만",countryCode:"TW"}, KHH:{country:"대만",countryCode:"TW"}, RMQ:{country:"대만",countryCode:"TW"}, TNN:{country:"대만",countryCode:"TW"},

  // 베트남/태국/필리핀/말레이시아/싱가포르/인도네시아/라오스/미얀마/캄보디아/카자흐스탄/몽골
  DAD:{country:"베트남",countryCode:"VN"}, SGN:{country:"베트남",countryCode:"VN"}, HAN:{country:"베트남",countryCode:"VN"}, CXR:{country:"베트남",countryCode:"VN"},
  PQC:{country:"베트남",countryCode:"VN"}, DLI:{country:"베트남",countryCode:"VN"}, HUI:{country:"베트남",countryCode:"VN"}, HPH:{country:"베트남",countryCode:"VN"},
  BKK:{country:"태국",countryCode:"TH"}, CNX:{country:"태국",countryCode:"TH"}, HKT:{country:"태국",countryCode:"TH"}, USM:{country:"태국",countryCode:"TH"}, KBV:{country:"태국",countryCode:"TH"}, CEI:{country:"태국",countryCode:"TH"}, UTP:{country:"태국",countryCode:"TH"},
  CEB:{country:"필리핀",countryCode:"PH"}, MNL:{country:"필리핀",countryCode:"PH"}, KLO:{country:"필리핀",countryCode:"PH"}, MPH:{country:"필리핀",countryCode:"PH"}, CRK:{country:"필리핀",countryCode:"PH"}, TAG:{country:"필리핀",countryCode:"PH"}, PPS:{country:"필리핀",countryCode:"PH"},
  KUL:{country:"말레이시아",countryCode:"MY"}, BKI:{country:"말레이시아",countryCode:"MY"}, LGK:{country:"말레이시아",countryCode:"MY"}, PEN:{country:"말레이시아",countryCode:"MY"}, JHB:{country:"말레이시아",countryCode:"MY"}, KCH:{country:"말레이시아",countryCode:"MY"},
  SIN:{country:"싱가포르",countryCode:"SG"},
  DPS:{country:"인도네시아",countryCode:"ID"}, CGK:{country:"인도네시아",countryCode:"ID"}, LOP:{country:"인도네시아",countryCode:"ID"}, LBJ:{country:"인도네시아",countryCode:"ID"}, SUB:{country:"인도네시아",countryCode:"ID"}, JOG:{country:"인도네시아",countryCode:"ID"},
  VTE:{country:"라오스",countryCode:"LA"}, LPQ:{country:"라오스",countryCode:"LA"}, RGN:{country:"미얀마",countryCode:"MM"}, PNH:{country:"캄보디아",countryCode:"KH"},
  ALA:{country:"카자흐스탄",countryCode:"KZ"}, ULN:{country:"몽골",countryCode:"MN"}, MLE:{country:"몰디브",countryCode:"MV"},

  // 인도/남아시아 일부
  DEL:{country:"인도",countryCode:"IN"}, BOM:{country:"인도",countryCode:"IN"}, MAA:{country:"인도",countryCode:"IN"}, BLR:{country:"인도",countryCode:"IN"}, HYD:{country:"인도",countryCode:"IN"}, COK:{country:"인도",countryCode:"IN"}, TRV:{country:"인도",countryCode:"IN"}, GOI:{country:"인도",countryCode:"IN"},
  CMB:{country:"스리랑카",countryCode:"LK"}, KTM:{country:"네팔",countryCode:"NP"}, DAC:{country:"방글라데시",countryCode:"BD"},

  // 미국/캐나다
  HNL:{country:"미국",countryCode:"US"}, LAX:{country:"미국",countryCode:"US"}, NYC:{country:"미국",countryCode:"US"}, SFO:{country:"미국",countryCode:"US"}, LAS:{country:"미국",countryCode:"US"}, DFW:{country:"미국",countryCode:"US"}, IAD:{country:"미국",countryCode:"US"},
  SEA:{country:"미국",countryCode:"US"}, CHI:{country:"미국",countryCode:"US"}, ATL:{country:"미국",countryCode:"US"}, BOS:{country:"미국",countryCode:"US"}, MIA:{country:"미국",countryCode:"US"}, IAH:{country:"미국",countryCode:"US"}, DEN:{country:"미국",countryCode:"US"}, SAN:{country:"미국",countryCode:"US"}, PDX:{country:"미국",countryCode:"US"}, PHL:{country:"미국",countryCode:"US"}, PHX:{country:"미국",countryCode:"US"}, MCO:{country:"미국",countryCode:"US"},
  YVR:{country:"캐나다",countryCode:"CA"}, YTO:{country:"캐나다",countryCode:"CA"}, YYC:{country:"캐나다",countryCode:"CA"}, YMQ:{country:"캐나다",countryCode:"CA"}, YOW:{country:"캐나다",countryCode:"CA"}, YEG:{country:"캐나다",countryCode:"CA"}, YWG:{country:"캐나다",countryCode:"CA"}, YQB:{country:"캐나다",countryCode:"CA"},

  // 유럽(대표)
  FRA:{country:"독일",countryCode:"DE"}, PAR:{country:"프랑스",countryCode:"FR"}, LON:{country:"영국",countryCode:"GB"}, ROM:{country:"이탈리아",countryCode:"IT"},
  BCN:{country:"스페인",countryCode:"ES"}, PRG:{country:"체코",countryCode:"CZ"}, AMS:{country:"네덜란드",countryCode:"NL"}, IST:{country:"튀르키예",countryCode:"TR"},
  HEL:{country:"핀란드",countryCode:"FI"}, ZRH:{country:"스위스",countryCode:"CH"}, WAW:{country:"폴란드",countryCode:"PL"}, LIS:{country:"포르투갈",countryCode:"PT"},
  MXP:{country:"이탈리아",countryCode:"IT"}, BUD:{country:"헝가리",countryCode:"HU"}, ZAG:{country:"크로아티아",countryCode:"HR"}, DBV:{country:"크로아티아",countryCode:"HR"},
  VCE:{country:"이탈리아",countryCode:"IT"}, VIE:{country:"오스트리아",countryCode:"AT"}, BER:{country:"독일",countryCode:"DE"}, ATH:{country:"그리스",countryCode:"GR"}, NCE:{country:"프랑스",countryCode:"FR"}, CPH:{country:"덴마크",countryCode:"DK"}, ARN:{country:"스웨덴",countryCode:"SE"}, OSL:{country:"노르웨이",countryCode:"NO"}, BRU:{country:"벨기에",countryCode:"BE"}, GVA:{country:"스위스",countryCode:"CH"}, DUS:{country:"독일",countryCode:"DE"}, HAM:{country:"독일",countryCode:"DE"}, STR:{country:"독일",countryCode:"DE"}, KRK:{country:"폴란드",countryCode:"PL"}, DUB:{country:"아일랜드",countryCode:"IE"}, MAN:{country:"영국",countryCode:"GB"}, EDI:{country:"영국",countryCode:"GB"}, BHX:{country:"영국",countryCode:"GB"}, OPO:{country:"포르투갈",countryCode:"PT"}, AGP:{country:"스페인",countryCode:"ES"}, PMI:{country:"스페인",countryCode:"ES"}, NAP:{country:"이탈리아",countryCode:"IT"}, FLR:{country:"이탈리아",countryCode:"IT"}, AYT:{country:"튀르키예",countryCode:"TR"}, JTR:{country:"그리스",countryCode:"GR"}, JMK:{country:"그리스",countryCode:"GR"},

  // 대양주/중동/아프리카/중남미(대표)
  SYD:{country:"호주",countryCode:"AU"}, MEL:{country:"호주",countryCode:"AU"}, BNE:{country:"호주",countryCode:"AU"}, OOL:{country:"호주",countryCode:"AU"}, PER:{country:"호주",countryCode:"AU"}, ADL:{country:"호주",countryCode:"AU"}, AKL:{country:"뉴질랜드",countryCode:"NZ"}, CHC:{country:"뉴질랜드",countryCode:"NZ"}, CNS:{country:"호주",countryCode:"AU"},
  GUM:{country:"미국",countryCode:"US"}, SPN:{country:"미국",countryCode:"US"},
  AUH:{country:"아랍에미리트",countryCode:"AE"}, TLV:{country:"이스라엘",countryCode:"IL"}, DOH:{country:"카타르",countryCode:"QA"}, DXB:{country:"아랍에미리트",countryCode:"AE"}, RUH:{country:"사우디아라비아",countryCode:"SA"}, JED:{country:"사우디아라비아",countryCode:"SA"}, MCT:{country:"오만",countryCode:"OM"}, BAH:{country:"바레인",countryCode:"BH"}, KWI:{country:"쿠웨이트",countryCode:"KW"}, IKA:{country:"이란",countryCode:"IR"}, AMM:{country:"요르단",countryCode:"JO"},
  NBO:{country:"케냐",countryCode:"KE"}, CPT:{country:"남아프리카공화국",countryCode:"ZA"}, CAI:{country:"이집트",countryCode:"EG"}, MRU:{country:"모리셔스",countryCode:"MU"}, JNB:{country:"남아프리카공화국",countryCode:"ZA"}, RAK:{country:"모로코",countryCode:"MA"}, CMN:{country:"모로코",countryCode:"MA"}, ZNZ:{country:"탄자니아",countryCode:"TZ"}, ADD:{country:"에티오피아",countryCode:"ET"}, SEZ:{country:"세이셸",countryCode:"SC"},
  GRU:{country:"브라질",countryCode:"BR"}, CUN:{country:"멕시코",countryCode:"MX"}, SCL:{country:"칠레",countryCode:"CL"}, HAV:{country:"쿠바",countryCode:"CU"}, MEX:{country:"멕시코",countryCode:"MX"}, LIM:{country:"페루",countryCode:"PE"}, GIG:{country:"브라질",countryCode:"BR"}, EZE:{country:"아르헨티나",countryCode:"AR"}, BOG:{country:"콜롬비아",countryCode:"CO"}, PTY:{country:"파나마",countryCode:"PA"},
};

function enrich(c: CityItem): CityItem {
  const m = CODE_TO_COUNTRY[c.code];
  if (m) return { ...c, country: m.country, countryCode: m.countryCode };
  // 이름 기반 간단 추론
  if (c.nameKo.includes("홍콩")) return { ...c, country: "홍콩", countryCode: "HK" };
  if (c.nameKo.includes("대만") || c.nameKo.includes("타이베이") || c.nameKo.includes("송산")) return { ...c, country: "대만", countryCode: "TW" };
  if (c.nameKo.includes("싱가포르")) return { ...c, country: "싱가포르", countryCode: "SG" };
  if (c.nameKo.includes("말레이")) return { ...c, country: "말레이시아", countryCode: "MY" };
  if (c.nameKo.includes("베트남") || ["다낭","호치민","하노이","나트랑"].some(k=>c.nameKo.includes(k))) return { ...c, country: "베트남", countryCode: "VN" };
  if (c.nameKo.includes("태국") || ["방콕","치앙마이","푸켓","코사무이","끄라비"].some(k=>c.nameKo.includes(k))) return { ...c, country: "태국", countryCode: "TH" };
  if (c.nameKo.includes("필리핀") || ["세부","마닐라","보홀","칼리보","카틱란","클락","푸에르토"].some(k=>c.nameKo.includes(k))) return { ...c, country: "필리핀", countryCode: "PH" };
  if (c.region === "일본") return { ...c, country: "일본", countryCode: "JP" };
  if (c.region === "중국") return { ...c, country: "중국", countryCode: "CN" };
  return c;
}

export const ENRICHED_DESTINATIONS: CityItem[] = DESTINATIONS.map(enrich);


