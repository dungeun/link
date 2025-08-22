// 플랫폼 상수 정의 - 전체 애플리케이션에서 통일된 플랫폼 옵션 사용
export const PLATFORM_OPTIONS = [
  { value: "INSTAGRAM", label: "인스타그램", icon: "instagram" },
  { value: "YOUTUBE", label: "유튜브", icon: "youtube" },
  { value: "TIKTOK", label: "틱톡", icon: "tiktok" },
  { value: "BLOG", label: "블로그", icon: "blog" },
  { value: "FACEBOOK", label: "페이스북", icon: "facebook" },
  { value: "X", label: "X (트위터)", icon: "twitter" },
  { value: "NAVERBLOG", label: "네이버 블로그", icon: "naver" },
] as const;

// 타입 정의
export type PlatformType = (typeof PLATFORM_OPTIONS)[number]["value"];

// 헬퍼 함수
export const getPlatformLabel = (value: string): string => {
  const platform = PLATFORM_OPTIONS.find((p) => p.value === value);
  return platform?.label || value;
};

export const getPlatformIcon = (value: string): string => {
  const platform = PLATFORM_OPTIONS.find((p) => p.value === value);
  return platform?.icon || "default";
};

// 캠페인 생성용 플랫폼 옵션 (일부만 사용)
export const CAMPAIGN_CREATION_PLATFORMS = [
  "INSTAGRAM",
  "YOUTUBE",
  "TIKTOK",
  "BLOG",
] as const;

// 필터용 전체 플랫폼 옵션
export const FILTER_PLATFORMS = PLATFORM_OPTIONS.map((p) => p.value);
