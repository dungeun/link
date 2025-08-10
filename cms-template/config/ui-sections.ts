/**
 * UI 섹션 관리 설정
 * 홈페이지 동적 섹션 구성
 */

export interface UISection {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  order: number;
  config?: any;
}

// 홈페이지 섹션 타입
export const sectionTypes = {
  HERO: 'hero',
  PROMO: 'promo',
  CATEGORY: 'category',
  RECOMMENDED: 'recommended',
  NEW: 'new',
  RANKING: 'ranking',
  QUICKLINKS: 'quicklinks',
  BANNER: 'banner',
  TESTIMONIALS: 'testimonials',
  STATS: 'stats',
} as const;

// 기본 섹션 구성
export const defaultSections: UISection[] = [
  {
    id: 'hero-section',
    name: '히어로 배너',
    type: sectionTypes.HERO,
    enabled: true,
    order: 1,
    config: {
      slides: [
        {
          title: '인플루언서 마케팅의 새로운 기준',
          subtitle: 'REVU와 함께 성공적인 캠페인을 시작하세요',
          image: '/images/hero-1.jpg',
          link: '/campaigns',
          buttonText: '캠페인 시작하기',
        },
      ],
      autoplay: true,
      interval: 5000,
    },
  },
  {
    id: 'promo-section',
    name: '프로모션',
    type: sectionTypes.PROMO,
    enabled: true,
    order: 2,
    config: {
      title: '이번 주 특별 프로모션',
      items: [],
    },
  },
  {
    id: 'category-section',
    name: '카테고리',
    type: sectionTypes.CATEGORY,
    enabled: true,
    order: 3,
    config: {
      title: '카테고리별 캠페인',
      categories: [
        { id: 'beauty', name: '뷰티', icon: '💄', count: 45 },
        { id: 'fashion', name: '패션', icon: '👗', count: 32 },
        { id: 'food', name: '푸드', icon: '🍽️', count: 28 },
        { id: 'travel', name: '여행', icon: '✈️', count: 15 },
        { id: 'tech', name: '테크', icon: '💻', count: 20 },
        { id: 'lifestyle', name: '라이프스타일', icon: '🏠', count: 38 },
      ],
    },
  },
  {
    id: 'recommended-section',
    name: '추천 캠페인',
    type: sectionTypes.RECOMMENDED,
    enabled: true,
    order: 4,
    config: {
      title: '추천 캠페인',
      subtitle: 'AI가 추천하는 맞춤 캠페인',
      limit: 8,
    },
  },
  {
    id: 'new-section',
    name: '신규 캠페인',
    type: sectionTypes.NEW,
    enabled: true,
    order: 5,
    config: {
      title: '신규 캠페인',
      subtitle: '방금 등록된 따끈따끈한 캠페인',
      limit: 6,
    },
  },
  {
    id: 'ranking-section',
    name: '인기 랭킹',
    type: sectionTypes.RANKING,
    enabled: true,
    order: 6,
    config: {
      title: '인기 인플루언서',
      subtitle: '이번 주 가장 인기있는 인플루언서',
      limit: 10,
      period: 'weekly', // daily, weekly, monthly
    },
  },
  {
    id: 'quicklinks-section',
    name: '퀵링크',
    type: sectionTypes.QUICKLINKS,
    enabled: true,
    order: 7,
    config: {
      links: [
        { title: '인플루언서 가이드', href: '/guide/influencer', icon: '📖' },
        { title: '비즈니스 가이드', href: '/guide/business', icon: '💼' },
        { title: '자주 묻는 질문', href: '/faq', icon: '❓' },
        { title: '고객센터', href: '/support', icon: '🎧' },
      ],
    },
  },
  {
    id: 'stats-section',
    name: '통계',
    type: sectionTypes.STATS,
    enabled: false,
    order: 8,
    config: {
      title: 'REVU 플랫폼 현황',
      stats: [
        { label: '등록 인플루언서', value: '10,000+', icon: '👥' },
        { label: '진행중 캠페인', value: '500+', icon: '📢' },
        { label: '누적 리뷰', value: '50,000+', icon: '⭐' },
        { label: '만족도', value: '98%', icon: '😊' },
      ],
    },
  },
];

// 섹션 렌더링 컴포넌트 매핑
export const sectionComponents = {
  [sectionTypes.HERO]: 'HeroSection',
  [sectionTypes.PROMO]: 'PromoSection',
  [sectionTypes.CATEGORY]: 'CategorySection',
  [sectionTypes.RECOMMENDED]: 'RecommendedSection',
  [sectionTypes.NEW]: 'NewCampaignsSection',
  [sectionTypes.RANKING]: 'RankingSection',
  [sectionTypes.QUICKLINKS]: 'QuickLinksSection',
  [sectionTypes.BANNER]: 'BannerSection',
  [sectionTypes.TESTIMONIALS]: 'TestimonialsSection',
  [sectionTypes.STATS]: 'StatsSection',
};

// 섹션 유효성 검사
export function validateSection(section: UISection): boolean {
  if (!section.id || !section.name || !section.type) {
    return false;
  }
  
  if (!Object.values(sectionTypes).includes(section.type as any)) {
    return false;
  }
  
  return true;
}

// 섹션 순서 정렬
export function sortSectionsByOrder(sections: UISection[]): UISection[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

// 활성화된 섹션만 필터링
export function getEnabledSections(sections: UISection[]): UISection[] {
  return sections.filter(section => section.enabled);
}

// 섹션 순서 업데이트
export function updateSectionOrder(sections: UISection[], fromIndex: number, toIndex: number): UISection[] {
  const result = [...sections];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  // 순서 번호 재할당
  return result.map((section, index) => ({
    ...section,
    order: index + 1,
  }));
}