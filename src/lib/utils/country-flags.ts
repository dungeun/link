// 국가별 국기 이모지 반환 함수
export function getCountryFlag(nationality: string): string {
  const countryFlags: Record<string, string> = {
    대한민국: "🇰🇷",
    한국: "🇰🇷",
    미국: "🇺🇸",
    일본: "🇯🇵",
    중국: "🇨🇳",
    캐나다: "🇨🇦",
    호주: "🇦🇺",
    영국: "🇬🇧",
    독일: "🇩🇪",
    프랑스: "🇫🇷",
    이탈리아: "🇮🇹",
    스페인: "🇪🇸",
    러시아: "🇷🇺",
    브라질: "🇧🇷",
    인도: "🇮🇳",
    태국: "🇹🇭",
    베트남: "🇻🇳",
    싱가포르: "🇸🇬",
    말레이시아: "🇲🇾",
    인도네시아: "🇮🇩",
    필리핀: "🇵🇭",
    뉴질랜드: "🇳🇿",
    멕시코: "🇲🇽",
    아르헨티나: "🇦🇷",
    네덜란드: "🇳🇱",
    벨기에: "🇧🇪",
    스위스: "🇨🇭",
    스웨덴: "🇸🇪",
    노르웨이: "🇳🇴",
    덴마크: "🇩🇰",
    핀란드: "🇫🇮",
    폴란드: "🇵🇱",
    체코: "🇨🇿",
    오스트리아: "🇦🇹",
    터키: "🇹🇷",
    이집트: "🇪🇬",
    사우디아라비아: "🇸🇦",
    남아프리카공화국: "🇿🇦",
  };

  return countryFlags[nationality] || "🌍"; // 기본값으로 지구 이모지
}

// 국가명을 표준화하는 함수
export function normalizeCountryName(nationality: string): string {
  const normalizedNames: Record<string, string> = {
    korea: "대한민국",
    "south korea": "대한민국",
    usa: "미국",
    "united states": "미국",
    america: "미국",
    japan: "일본",
    china: "중국",
    canada: "캐나다",
    australia: "호주",
    uk: "영국",
    "united kingdom": "영국",
    england: "영국",
    germany: "독일",
    france: "프랑스",
  };

  const lowerCase = nationality.toLowerCase();
  return normalizedNames[lowerCase] || nationality;
}
