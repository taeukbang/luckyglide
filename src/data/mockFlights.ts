export interface Flight {
  id: string;
  city: string;
  country: string;
  flag: string;
  price: number;
  originalPrice: number;
  discount: number;
  priceHistory: {
    date: string;
    price: number;
  }[];
}

const generatePriceHistory = (basePrice: number) => {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const variance = Math.random() * 0.3 - 0.15; // -15% to +15%
    const price = Math.round(basePrice * (1 + variance) / 1000) * 1000;
    
    dates.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      price: price,
    });
  }
  
  return dates;
};

export const mockFlights: Flight[] = [
  {
    id: "1",
    city: "도쿄",
    country: "일본",
    flag: "🇯🇵",
    price: 245000,
    originalPrice: 380000,
    discount: 36,
    priceHistory: generatePriceHistory(245000),
  },
  {
    id: "2",
    city: "오사카",
    country: "일본",
    flag: "🇯🇵",
    price: 198000,
    originalPrice: 320000,
    discount: 38,
    priceHistory: generatePriceHistory(198000),
  },
  {
    id: "3",
    city: "방콕",
    country: "태국",
    flag: "🇹🇭",
    price: 285000,
    originalPrice: 450000,
    discount: 37,
    priceHistory: generatePriceHistory(285000),
  },
  {
    id: "4",
    city: "다낭",
    country: "베트남",
    flag: "🇻🇳",
    price: 165000,
    originalPrice: 280000,
    discount: 41,
    priceHistory: generatePriceHistory(165000),
  },
  {
    id: "5",
    city: "타이베이",
    country: "대만",
    flag: "🇹🇼",
    price: 189000,
    originalPrice: 310000,
    discount: 39,
    priceHistory: generatePriceHistory(189000),
  },
  {
    id: "6",
    city: "홍콩",
    country: "중국",
    flag: "🇭🇰",
    price: 278000,
    originalPrice: 420000,
    discount: 34,
    priceHistory: generatePriceHistory(278000),
  },
  {
    id: "7",
    city: "싱가포르",
    country: "싱가포르",
    flag: "🇸🇬",
    price: 345000,
    originalPrice: 520000,
    discount: 34,
    priceHistory: generatePriceHistory(345000),
  },
  {
    id: "8",
    city: "세부",
    country: "필리핀",
    flag: "🇵🇭",
    price: 225000,
    originalPrice: 380000,
    discount: 41,
    priceHistory: generatePriceHistory(225000),
  },
];
