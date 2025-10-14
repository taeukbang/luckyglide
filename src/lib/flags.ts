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

export interface CountryMeta { countryKo: string; countryCode: string }

// Minimal mapping for destinations used in this app (extend as needed)
export const codeToCountry: Record<string, CountryMeta> = {
  // 일본
  TYO: { countryKo: "일본", countryCode: "JP" }, OSA: { countryKo: "일본", countryCode: "JP" }, FUK: { countryKo: "일본", countryCode: "JP" }, SPK: { countryKo: "일본", countryCode: "JP" },
  OKA: { countryKo: "일본", countryCode: "JP" }, UKB: { countryKo: "일본", countryCode: "JP" }, NGO: { countryKo: "일본", countryCode: "JP" }, KMJ: { countryKo: "일본", countryCode: "JP" },
  KKJ: { countryKo: "일본", countryCode: "JP" }, TAK: { countryKo: "일본", countryCode: "JP" }, OIT: { countryKo: "일본", countryCode: "JP" }, MYJ: { countryKo: "일본", countryCode: "JP" },
  HIJ: { countryKo: "일본", countryCode: "JP" }, YGJ: { countryKo: "일본", countryCode: "JP" },

  // 중국
  BJS: { countryKo: "중국", countryCode: "CN" }, PVG: { countryKo: "중국", countryCode: "CN" }, TAO: { countryKo: "중국", countryCode: "CN" }, CTU: { countryKo: "중국", countryCode: "CN" }, HKG: { countryKo: "홍콩", countryCode: "HK" },

  // 동남아/아시아
  DAD: { countryKo: "베트남", countryCode: "VN" }, SGN: { countryKo: "베트남", countryCode: "VN" }, HAN: { countryKo: "베트남", countryCode: "VN" },
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
};


