export function emojiFromCountryCode(alpha2?: string | null) {
  if (!alpha2) return "";
  const code = alpha2.toUpperCase();
  if (code.length !== 2) return "";
  // Regional indicator symbols start at 0x1F1E6 (A)
  const A = 0x1f1e6;
  const chars = Array.from(code).map((c) => String.fromCodePoint(A + (c.charCodeAt(0) - 65)));
  return chars.join("");
}

// 국기 SVG URL 생성(https://flagcdn.com/ 기준, 48px)
export function flagUrlFromCountryCode(alpha2?: string | null, size: 48 | 24 = 24) {
  if (!alpha2) return "";
  const code = alpha2.toLowerCase();
  return `https://flagcdn.com/w${size}/${code}.png`;
}

export function fallbackFlagUrl(alpha2?: string | null) {
  if (!alpha2) return "";
  const code = alpha2.toUpperCase();
  return `https://cdn.jsdelivr.net/npm/country-flag-icons/3x2/${code}.svg`;
}

export interface CountryMeta { countryKo: string; countryCode: string }

// Minimal mapping for destinations used in this app (extend as needed)
export const codeToCountry: Record<string, CountryMeta> = {
  // 일본
  TYO: { countryKo: "일본", countryCode: "JP" }, OSA: { countryKo: "일본", countryCode: "JP" }, FUK: { countryKo: "일본", countryCode: "JP" }, SPK: { countryKo: "일본", countryCode: "JP" },
  OKA: { countryKo: "일본", countryCode: "JP" }, UKB: { countryKo: "일본", countryCode: "JP" }, NGO: { countryKo: "일본", countryCode: "JP" }, KMJ: { countryKo: "일본", countryCode: "JP" },
  KKJ: { countryKo: "일본", countryCode: "JP" }, TAK: { countryKo: "일본", countryCode: "JP" }, OIT: { countryKo: "일본", countryCode: "JP" }, MYJ: { countryKo: "일본", countryCode: "JP" },
  HIJ: { countryKo: "일본", countryCode: "JP" }, YGJ: { countryKo: "일본", countryCode: "JP" },

  // 중국
  BJS: { countryKo: "중국", countryCode: "CN" }, PVG: { countryKo: "중국", countryCode: "CN" }, TAO: { countryKo: "중국", countryCode: "CN" }, CTU: { countryKo: "중국", countryCode: "CN" },
  HKG: { countryKo: "홍콩", countryCode: "HK" }, SHA: { countryKo: "중국", countryCode: "CN" }, WUH: { countryKo: "중국", countryCode: "CN" }, CSX: { countryKo: "중국", countryCode: "CN" },

  // 동남아/아시아
  DAD: { countryKo: "베트남", countryCode: "VN" }, SGN: { countryKo: "베트남", countryCode: "VN" }, HAN: { countryKo: "베트남", countryCode: "VN" }, CXR: { countryKo: "베트남", countryCode: "VN" },
  BKK: { countryKo: "태국", countryCode: "TH" }, CNX: { countryKo: "태국", countryCode: "TH" }, HKT: { countryKo: "태국", countryCode: "TH" },
  CEB: { countryKo: "필리핀", countryCode: "PH" }, MNL: { countryKo: "필리핀", countryCode: "PH" }, CXR: { countryKo: "베트남", countryCode: "VN" },
  SIN: { countryKo: "싱가포르", countryCode: "SG" },
  BKI: { countryKo: "말레이시아", countryCode: "MY" }, KUL: { countryKo: "말레이시아", countryCode: "MY" },
  TPE: { countryKo: "대만", countryCode: "TW" }, TSA: { countryKo: "대만", countryCode: "TW" },
  MFM: { countryKo: "마카오", countryCode: "MO" },
  ULN: { countryKo: "몽골", countryCode: "MN" },
  PNH: { countryKo: "캄보디아", countryCode: "KH" },
  ALA: { countryKo: "카자흐스탄", countryCode: "KZ" },
  MLE: { countryKo: "몰디브", countryCode: "MV" },

  // 미주 (미국/캐나다)
  LAX: { countryKo: "미국", countryCode: "US" }, NYC: { countryKo: "미국", countryCode: "US" }, SFO: { countryKo: "미국", countryCode: "US" }, LAS: { countryKo: "미국", countryCode: "US" },
  DFW: { countryKo: "미국", countryCode: "US" }, HNL: { countryKo: "미국", countryCode: "US" }, IAD: { countryKo: "미국", countryCode: "US" },
  YVR: { countryKo: "캐나다", countryCode: "CA" }, YTO: { countryKo: "캐나다", countryCode: "CA" }, YYC: { countryKo: "캐나다", countryCode: "CA" },

  // 유럽
  FRA: { countryKo: "독일", countryCode: "DE" }, PAR: { countryKo: "프랑스", countryCode: "FR" }, LON: { countryKo: "영국", countryCode: "GB" }, ROM: { countryKo: "이탈리아", countryCode: "IT" },
  BCN: { countryKo: "스페인", countryCode: "ES" }, PRG: { countryKo: "체코", countryCode: "CZ" }, AMS: { countryKo: "네덜란드", countryCode: "NL" }, IST: { countryKo: "튀르키예", countryCode: "TR" },
  HEL: { countryKo: "핀란드", countryCode: "FI" }, ZRH: { countryKo: "스위스", countryCode: "CH" }, WAW: { countryKo: "폴란드", countryCode: "PL" }, LIS: { countryKo: "포르투갈", countryCode: "PT" },
  MXP: { countryKo: "이탈리아", countryCode: "IT" }, BUD: { countryKo: "헝가리", countryCode: "HU" }, ZAG: { countryKo: "크로아티아", countryCode: "HR" }, DBV: { countryKo: "크로아티아", countryCode: "HR" },
  VCE: { countryKo: "이탈리아", countryCode: "IT" }, VIE: { countryKo: "오스트리아", countryCode: "AT" },

  // 대양주
  SYD: { countryKo: "호주", countryCode: "AU" }, MEL: { countryKo: "호주", countryCode: "AU" }, GUM: { countryKo: "미국", countryCode: "US" }, SPN: { countryKo: "미국", countryCode: "US" },

  // 중동
  AUH: { countryKo: "아랍에미리트", countryCode: "AE" }, TLV: { countryKo: "이스라엘", countryCode: "IL" }, DOH: { countryKo: "카타르", countryCode: "QA" }, DXB: { countryKo: "아랍에미리트", countryCode: "AE" },

  // 중남미
  GRU: { countryKo: "브라질", countryCode: "BR" }, CUN: { countryKo: "멕시코", countryCode: "MX" }, SCL: { countryKo: "칠레", countryCode: "CL" }, HAV: { countryKo: "쿠바", countryCode: "CU" },

  // 아프리카
  NBO: { countryKo: "케냐", countryCode: "KE" }, CPT: { countryKo: "남아프리카공화국", countryCode: "ZA" }, CAI: { countryKo: "이집트", countryCode: "EG" }, MRU: { countryKo: "모리셔스", countryCode: "MU" },
  
  // 추가 확장: 일본(세부)
  ISG: { countryKo: "일본", countryCode: "JP" }, MMY: { countryKo: "일본", countryCode: "JP" }, SDJ: { countryKo: "일본", countryCode: "JP" }, FSZ: { countryKo: "일본", countryCode: "JP" },
  KOJ: { countryKo: "일본", countryCode: "JP" }, KMI: { countryKo: "일본", countryCode: "JP" }, OKJ: { countryKo: "일본", countryCode: "JP" }, NGS: { countryKo: "일본", countryCode: "JP" },
  AKJ: { countryKo: "일본", countryCode: "JP" }, AOJ: { countryKo: "일본", countryCode: "JP" }, HKD: { countryKo: "일본", countryCode: "JP" }, OBO: { countryKo: "일본", countryCode: "JP" },
  KMQ: { countryKo: "일본", countryCode: "JP" }, TOY: { countryKo: "일본", countryCode: "JP" }, KIJ: { countryKo: "일본", countryCode: "JP" }, KCZ: { countryKo: "일본", countryCode: "JP" },

  // 추가 확장: 중국 본토/특별행정구/대만(세부)
  CAN: { countryKo: "중국", countryCode: "CN" }, SZX: { countryKo: "중국", countryCode: "CN" }, HGH: { countryKo: "중국", countryCode: "CN" }, XIY: { countryKo: "중국", countryCode: "CN" },
  XMN: { countryKo: "중국", countryCode: "CN" }, DLC: { countryKo: "중국", countryCode: "CN" }, SHE: { countryKo: "중국", countryCode: "CN" }, HRB: { countryKo: "중국", countryCode: "CN" },
  NKG: { countryKo: "중국", countryCode: "CN" }, KMG: { countryKo: "중국", countryCode: "CN" }, CKG: { countryKo: "중국", countryCode: "CN" }, TSN: { countryKo: "중국", countryCode: "CN" },
  CGO: { countryKo: "중국", countryCode: "CN" }, NGB: { countryKo: "중국", countryCode: "CN" }, FOC: { countryKo: "중국", countryCode: "CN" }, WNZ: { countryKo: "중국", countryCode: "CN" },
  NNG: { countryKo: "중국", countryCode: "CN" }, KHH: { countryKo: "대만", countryCode: "TW" }, RMQ: { countryKo: "대만", countryCode: "TW" }, TNN: { countryKo: "대만", countryCode: "TW" },

  // 추가 확장: 동남아/남아시아
  USM: { countryKo: "태국", countryCode: "TH" }, KBV: { countryKo: "태국", countryCode: "TH" }, CEI: { countryKo: "태국", countryCode: "TH" }, UTP: { countryKo: "태국", countryCode: "TH" },
  PQC: { countryKo: "베트남", countryCode: "VN" }, DLI: { countryKo: "베트남", countryCode: "VN" }, HUI: { countryKo: "베트남", countryCode: "VN" }, HPH: { countryKo: "베트남", countryCode: "VN" },
  KLO: { countryKo: "필리핀", countryCode: "PH" }, MPH: { countryKo: "필리핀", countryCode: "PH" }, CRK: { countryKo: "필리핀", countryCode: "PH" }, TAG: { countryKo: "필리핀", countryCode: "PH" },
  PPS: { countryKo: "필리핀", countryCode: "PH" }, LGK: { countryKo: "말레이시아", countryCode: "MY" }, PEN: { countryKo: "말레이시아", countryCode: "MY" }, JHB: { countryKo: "말레이시아", countryCode: "MY" },
  KCH: { countryKo: "말레이시아", countryCode: "MY" }, DPS: { countryKo: "인도네시아", countryCode: "ID" }, CGK: { countryKo: "인도네시아", countryCode: "ID" }, LOP: { countryKo: "인도네시아", countryCode: "ID" },
  LBJ: { countryKo: "인도네시아", countryCode: "ID" }, SUB: { countryKo: "인도네시아", countryCode: "ID" }, JOG: { countryKo: "인도네시아", countryCode: "ID" },
  VTE: { countryKo: "라오스", countryCode: "LA" }, LPQ: { countryKo: "라오스", countryCode: "LA" }, RGN: { countryKo: "미얀마", countryCode: "MM" },
  DEL: { countryKo: "인도", countryCode: "IN" }, BOM: { countryKo: "인도", countryCode: "IN" }, MAA: { countryKo: "인도", countryCode: "IN" }, BLR: { countryKo: "인도", countryCode: "IN" },
  HYD: { countryKo: "인도", countryCode: "IN" }, COK: { countryKo: "인도", countryCode: "IN" }, TRV: { countryKo: "인도", countryCode: "IN" }, GOI: { countryKo: "인도", countryCode: "IN" },
  CMB: { countryKo: "스리랑카", countryCode: "LK" }, KTM: { countryKo: "네팔", countryCode: "NP" }, DAC: { countryKo: "방글라데시", countryCode: "BD" },

  // 추가 확장: 미주(미국/캐나다)
  SEA: { countryKo: "미국", countryCode: "US" }, CHI: { countryKo: "미국", countryCode: "US" }, ATL: { countryKo: "미국", countryCode: "US" }, BOS: { countryKo: "미국", countryCode: "US" },
  MIA: { countryKo: "미국", countryCode: "US" }, IAH: { countryKo: "미국", countryCode: "US" }, DEN: { countryKo: "미국", countryCode: "US" }, SAN: { countryKo: "미국", countryCode: "US" },
  PDX: { countryKo: "미국", countryCode: "US" }, PHL: { countryKo: "미국", countryCode: "US" }, PHX: { countryKo: "미국", countryCode: "US" }, MCO: { countryKo: "미국", countryCode: "US" },
  YMQ: { countryKo: "캐나다", countryCode: "CA" }, YOW: { countryKo: "캐나다", countryCode: "CA" }, YEG: { countryKo: "캐나다", countryCode: "CA" }, YWG: { countryKo: "캐나다", countryCode: "CA" },
  YQB: { countryKo: "캐나다", countryCode: "CA" },

  // 추가 확장: 유럽(세부)
  MAD: { countryKo: "스페인", countryCode: "ES" }, MUC: { countryKo: "독일", countryCode: "DE" }, BER: { countryKo: "독일", countryCode: "DE" }, ATH: { countryKo: "그리스", countryCode: "GR" },
  NCE: { countryKo: "프랑스", countryCode: "FR" }, CPH: { countryKo: "덴마크", countryCode: "DK" }, ARN: { countryKo: "스웨덴", countryCode: "SE" }, OSL: { countryKo: "노르웨이", countryCode: "NO" },
  BRU: { countryKo: "벨기에", countryCode: "BE" }, GVA: { countryKo: "스위스", countryCode: "CH" }, DUS: { countryKo: "독일", countryCode: "DE" }, HAM: { countryKo: "독일", countryCode: "DE" },
  STR: { countryKo: "독일", countryCode: "DE" }, KRK: { countryKo: "폴란드", countryCode: "PL" }, DUB: { countryKo: "아일랜드", countryCode: "IE" }, MAN: { countryKo: "영국", countryCode: "GB" },
  EDI: { countryKo: "영국", countryCode: "GB" }, BHX: { countryKo: "영국", countryCode: "GB" }, OPO: { countryKo: "포르투갈", countryCode: "PT" }, AGP: { countryKo: "스페인", countryCode: "ES" },
  PMI: { countryKo: "스페인", countryCode: "ES" }, NAP: { countryKo: "이탈리아", countryCode: "IT" }, FLR: { countryKo: "이탈리아", countryCode: "IT" }, AYT: { countryKo: "튀르키예", countryCode: "TR" },
  JTR: { countryKo: "그리스", countryCode: "GR" }, JMK: { countryKo: "그리스", countryCode: "GR" },

  // 추가 확장: 대양주(세부)
  BNE: { countryKo: "호주", countryCode: "AU" }, OOL: { countryKo: "호주", countryCode: "AU" }, PER: { countryKo: "호주", countryCode: "AU" }, ADL: { countryKo: "호주", countryCode: "AU" },
  AKL: { countryKo: "뉴질랜드", countryCode: "NZ" }, CHC: { countryKo: "뉴질랜드", countryCode: "NZ" }, CNS: { countryKo: "호주", countryCode: "AU" },

  // 추가 확장: 중동(세부)
  RUH: { countryKo: "사우디아라비아", countryCode: "SA" }, JED: { countryKo: "사우디아라비아", countryCode: "SA" }, MCT: { countryKo: "오만", countryCode: "OM" }, BAH: { countryKo: "바레인", countryCode: "BH" },
  KWI: { countryKo: "쿠웨이트", countryCode: "KW" }, IKA: { countryKo: "이란", countryCode: "IR" }, AMM: { countryKo: "요르단", countryCode: "JO" },

  // 추가 확장: 중남미(세부)
  MEX: { countryKo: "멕시코", countryCode: "MX" }, LIM: { countryKo: "페루", countryCode: "PE" }, GIG: { countryKo: "브라질", countryCode: "BR" }, EZE: { countryKo: "아르헨티나", countryCode: "AR" },
  BOG: { countryKo: "콜롬비아", countryCode: "CO" }, PTY: { countryKo: "파나마", countryCode: "PA" },

  // 추가 확장: 아프리카(세부)
  JNB: { countryKo: "남아프리카공화국", countryCode: "ZA" }, RAK: { countryKo: "모로코", countryCode: "MA" }, CMN: { countryKo: "모로코", countryCode: "MA" }, ZNZ: { countryKo: "탄자니아", countryCode: "TZ" },
  ADD: { countryKo: "에티오피아", countryCode: "ET" }, SEZ: { countryKo: "세이셸", countryCode: "SC" },
};


