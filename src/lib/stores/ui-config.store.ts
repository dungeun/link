'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/structured-logger';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  order: number;
  visible: boolean;
  children?: MenuItem[];
}

export interface FooterColumn {
  id: string;
  title: string;
  links: MenuItem[];
  order: number;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  order: number;
  visible: boolean;
}

export interface HeroSlide {
  id: string;
  type: 'blue' | 'dark' | 'green' | 'pink';
  tag?: string;
  title: string;
  subtitle: string;
  bgColor: string;
  backgroundImage?: string;
  link?: string;
  order: number;
  visible: boolean;
}

export interface CategoryMenu {
  id: string;
  name: string;
  categoryId: string;
  icon: string; // 이미지 URL
  badge?: string;
  order: number;
  visible: boolean;
}

export interface QuickLink {
  id: string;
  title: string;
  icon: string; // 이미지 URL
  link: string;
  order: number;
  visible: boolean;
}

export interface PromoBanner {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  icon: string;
  link?: string;
  visible: boolean;
}

export interface RankingSection {
  visible: boolean;
  title: string;
  subtitle?: string;
  criteria: 'popular' | 'deadline' | 'reward' | 'participants'; // 인기순, 마감임박, 리워드 높은순, 참여자 많은순
  count: number; // 표시할 개수
  showBadge: boolean; // 순위 뱃지 표시 여부
}

export interface CustomSection {
  id: string;
  title: string;
  subtitle?: string;
  type: 'manual' | 'auto'; // manual: 수동 선택, auto: 자동 필터링
  visible: boolean;
  order: number;
  layout: 'grid' | 'list' | 'carousel'; // 레이아웃 형식
  columns: number; // 컬럼 수 (grid일 때)
  rows: number; // 행 수
  // 자동 필터링 옵션 (type이 'auto'일 때)
  filter?: {
    category?: string;
    platform?: string;
    minBudget?: number;
    maxBudget?: number;
    status?: string;
    sortBy?: 'latest' | 'popular' | 'deadline' | 'budget';
  };
  // 수동 선택 캠페인 (type이 'manual'일 때)
  campaignIds?: string[];
  showMoreButton?: boolean;
  moreButtonText?: string;
  moreButtonLink?: string;
}

export interface SectionOrder {
  id: string;
  type: 'hero' | 'category' | 'quicklinks' | 'promo' | 'ranking' | 'custom' | 'recommended';
  order: number;
  visible: boolean;
}

export interface UIConfig {
  header: {
    logo: {
      text: string;
      imageUrl?: string;
    };
    menus: MenuItem[];
    ctaButton: {
      text: string;
      href: string;
      visible: boolean;
    };
  };
  footer: {
    columns: FooterColumn[];
    social: {
      platform: string;
      url: string;
      visible: boolean;
    }[];
    copyright: string;
  };
  mainPage: {
    heroSlides: HeroSlide[]; // 히어로 배너 슬라이드
    categoryMenus: CategoryMenu[]; // 카테고리 메뉴
    quickLinks: QuickLink[]; // 바로가기 링크 (3단)
    promoBanner: PromoBanner; // 프로모션 배너 (1단)
    rankingSection: RankingSection; // 랭킹 섹션
    customSections: CustomSection[]; // 커스텀 섹션들
    sectionOrder?: SectionOrder[]; // 섹션 순서
  };
}

interface WebsiteSettings {
  siteName?: string;
  siteDescription?: string;
  siteUrl?: string;
  contactEmail?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  [key: string]: unknown;
}

interface UIConfigStore {
  config: UIConfig;
  websiteSettings: WebsiteSettings;
  updateHeaderMenus: (menus: MenuItem[]) => void;
  updateFooterColumns: (columns: FooterColumn[]) => void;
  updateLogo: (logo: UIConfig['header']['logo']) => void;
  updateCTAButton: (cta: UIConfig['header']['ctaButton']) => void;
  updateCopyright: (copyright: string) => void;
  updateMainPageHeroSlides: (slides: HeroSlide[]) => void;
  updateMainPageCategoryMenus: (menus: CategoryMenu[]) => void;
  updateMainPageQuickLinks: (links: QuickLink[]) => void;
  updateMainPagePromoBanner: (banner: PromoBanner) => void;
  updateMainPageRankingSection: (ranking: RankingSection) => void;
  updateMainPageCustomSections: (sections: CustomSection[]) => void;
  addCustomSection: (section: CustomSection) => void;
  updateCustomSection: (id: string, section: Partial<CustomSection>) => void;
  removeCustomSection: (id: string) => void;
  updateSectionOrder: (order: SectionOrder[]) => void;
  updateWebsiteSettings: (settings: WebsiteSettings) => void;
  loadSettingsFromAPI: (language?: string) => Promise<void>;
  resetToDefault: () => void;
  setConfig: (config: UIConfig) => void;
}

const defaultConfig: UIConfig = {
  header: {
    logo: {
      text: 'LinkPick',
    },
    menus: [
      { id: '1', label: 'header.menu.campaigns', href: '/campaigns', order: 1, visible: true },
      { id: '2', label: 'header.menu.influencers', href: '/influencers', order: 2, visible: true },
      { id: '3', label: 'header.menu.community', href: '/community', order: 3, visible: true },
      { id: '4', label: 'header.menu.pricing', href: '/pricing', order: 4, visible: true },
    ],
    ctaButton: {
      text: 'menu.get_started',
      href: '/register',
      visible: true,
    },
  },
  footer: {
    columns: [
      {
        id: '1',
        title: 'footer.service.title',
        order: 1,
        links: [
          { id: '1-1', label: 'footer.service.find_campaigns', href: '/campaigns', order: 1, visible: true },
          { id: '1-2', label: 'footer.service.find_influencers', href: '/influencers', order: 2, visible: true },
          { id: '1-3', label: 'menu.pricing', href: '/pricing', order: 3, visible: true },
        ],
      },
      {
        id: '2',
        title: 'footer.company.title',
        order: 2,
        links: [
          { id: '2-1', label: 'footer.company.about', href: '/about', order: 1, visible: true },
          { id: '2-2', label: 'footer.company.blog', href: '/blog', order: 2, visible: true },
          { id: '2-3', label: 'footer.company.careers', href: '/careers', order: 3, visible: true },
        ],
      },
      {
        id: '3',
        title: 'footer.support.title',
        order: 3,
        links: [
          { id: '3-1', label: 'footer.support.help', href: '/help', order: 1, visible: true },
          { id: '3-2', label: 'footer.support.contact', href: '/contact', order: 2, visible: true },
          { id: '3-3', label: 'footer.support.terms', href: '/terms', order: 3, visible: true },
        ],
      },
    ],
    social: [
      { platform: 'twitter', url: 'https://twitter.com/linkpick', visible: true },
      { platform: 'facebook', url: 'https://facebook.com/linkpick', visible: true },
      { platform: 'instagram', url: 'https://instagram.com/linkpick', visible: true },
    ],
    copyright: 'footer.copyright',
  },
  mainPage: {
    heroSlides: [
      {
        id: 'slide-1',
        type: 'blue' as const,
        tag: 'hero.slide1.tag',
        title: 'hero.slide1.title',
        subtitle: 'hero.slide1.subtitle',
        bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
        order: 1,
        visible: true,
      },
      {
        id: 'slide-2',
        type: 'dark' as const,
        title: 'hero.slide2.title',
        subtitle: 'hero.slide2.subtitle',
        bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
        order: 2,
        visible: true,
      },
      {
        id: 'slide-3',
        type: 'green' as const,
        title: 'hero.slide3.title',
        subtitle: 'hero.slide3.subtitle',
        bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
        order: 3,
        visible: true,
      },
      {
        id: 'slide-4',
        type: 'pink' as const,
        tag: 'hero.slide4.tag',
        title: 'hero.slide4.title',
        subtitle: 'hero.slide4.subtitle',
        bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
        order: 4,
        visible: true,
      },
      {
        id: 'slide-5',
        type: 'blue' as const,
        title: 'hero.slide5.title',
        subtitle: 'hero.slide5.subtitle',
        bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
        order: 5,
        visible: true,
      },
      {
        id: 'slide-6',
        type: 'dark' as const,
        tag: 'hero.slide6.tag',
        title: 'hero.slide6.title',
        subtitle: 'hero.slide6.subtitle',
        bgColor: 'bg-gradient-to-br from-gray-700 to-gray-900',
        order: 6,
        visible: true,
      },
    ],
    categoryMenus: [
      { id: 'cat-1', name: 'category.beauty', categoryId: 'beauty', icon: '', order: 1, visible: true },
      { id: 'cat-2', name: 'category.fashion', categoryId: 'fashion', icon: '', order: 2, visible: true },
      { id: 'cat-3', name: 'category.food', categoryId: 'food', icon: '', badge: 'category.badge.hot', order: 3, visible: true },
      { id: 'cat-4', name: 'category.travel', categoryId: 'travel', icon: '', order: 4, visible: true },
      { id: 'cat-5', name: 'category.tech', categoryId: 'tech', icon: '', order: 5, visible: true },
      { id: 'cat-6', name: 'category.fitness', categoryId: 'fitness', icon: '', order: 6, visible: true },
      { id: 'cat-7', name: 'category.lifestyle', categoryId: 'lifestyle', icon: '', order: 7, visible: true },
      { id: 'cat-8', name: 'category.pet', categoryId: 'pet', icon: '', order: 8, visible: true },
      { id: 'cat-9', name: 'category.parenting', categoryId: 'parenting', icon: '', order: 9, visible: true },
      { id: 'cat-10', name: 'category.game', categoryId: 'game', icon: '', badge: 'category.badge.new', order: 10, visible: true },
      { id: 'cat-11', name: 'category.education', categoryId: 'education', icon: '', order: 11, visible: true },
    ],
    quickLinks: [
      { id: 'quick-1', title: 'quicklink.events', icon: '🎁', link: '/events', order: 1, visible: true },
      { id: 'quick-2', title: 'quicklink.coupons', icon: '🎟️', link: '/coupons', order: 2, visible: true },
      { id: 'quick-3', title: 'quicklink.ranking', icon: '🏆', link: '/ranking', order: 3, visible: true },
    ],
    promoBanner: {
      title: 'promo.title',
      subtitle: 'promo.subtitle',
      icon: '📦',
      visible: true,
    },
    rankingSection: {
      visible: true,
      title: 'ranking.title',
      subtitle: 'ranking.subtitle',
      criteria: 'popular' as const,
      count: 5,
      showBadge: true,
    },
    customSections: [],
    sectionOrder: [
      { id: 'hero', type: 'hero', order: 1, visible: true },
      { id: 'category', type: 'category', order: 2, visible: true },
      { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
      { id: 'promo', type: 'promo', order: 4, visible: true },
      { id: 'ranking', type: 'ranking', order: 5, visible: true },
      { id: 'recommended', type: 'recommended', order: 6, visible: true },
    ],
  },
};

export const useUIConfigStore = create<UIConfigStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      websiteSettings: null,
      updateHeaderMenus: (menus) =>
        set((state) => ({
          config: {
            ...state.config,
            header: {
              ...state.config.header,
              menus,
            },
          },
        })),
      updateFooterColumns: (columns) =>
        set((state) => ({
          config: {
            ...state.config,
            footer: {
              ...state.config.footer,
              columns,
            },
          },
        })),
      updateLogo: (logo) =>
        set((state) => ({
          config: {
            ...state.config,
            header: {
              ...state.config.header,
              logo,
            },
          },
        })),
      updateCTAButton: (ctaButton) =>
        set((state) => ({
          config: {
            ...state.config,
            header: {
              ...state.config.header,
              ctaButton,
            },
          },
        })),
      updateCopyright: (copyright) =>
        set((state) => ({
          config: {
            ...state.config,
            footer: {
              ...state.config.footer,
              copyright,
            },
          },
        })),
      updateMainPageHeroSlides: (slides) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              heroSlides: slides,
            },
          },
        })),
      updateMainPageCategoryMenus: (menus) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              categoryMenus: menus,
            },
          },
        })),
      updateMainPageQuickLinks: (links) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              quickLinks: links,
            },
          },
        })),
      updateMainPagePromoBanner: (banner) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              promoBanner: banner,
            },
          },
        })),
      updateMainPageRankingSection: (ranking) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              rankingSection: ranking,
            },
          },
        })),
      updateMainPageCustomSections: (sections) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: sections,
            },
          },
        })),
      addCustomSection: (section) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: [...(state.config.mainPage?.customSections || []), section],
            },
          },
        })),
      updateCustomSection: (id, sectionUpdate) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: (state.config.mainPage?.customSections || []).map((section) =>
                section.id === id ? { ...section, ...sectionUpdate } : section
              ),
            },
          },
        })),
      removeCustomSection: (id) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              customSections: (state.config.mainPage?.customSections || []).filter(
                (section) => section.id !== id
              ),
            },
          },
        })),
      updateSectionOrder: (order) =>
        set((state) => ({
          config: {
            ...state.config,
            mainPage: {
              ...state.config.mainPage,
              sectionOrder: order,
            },
          },
        })),
      updateWebsiteSettings: (settings) =>
        set({ websiteSettings: settings }),
      loadSettingsFromAPI: async (language?: string) => {
        try {
          // UI config 로드 (공개 API 사용)
          logger.debug('Loading UI config from API', { module: 'UIConfigStore' });
          const langParam = language ? `?lang=${language}` : '';
          const uiConfigResponse = await fetch(`/api/ui-config${langParam}`)
          if (uiConfigResponse.ok) {
            const uiData = await uiConfigResponse.json()
            logger.debug('UI config loaded', { module: 'UIConfigStore', metadata: { config: uiData.config } });
            if (uiData.config) {
              set({ config: uiData.config })
            }
          } else {
            logger.error('Failed to load UI config', new Error(`HTTP ${uiConfigResponse.status}`), { module: 'UIConfigStore' });
          }
          
          // 일반 설정 로드
          const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('auth-token')) : null;
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch('/api/settings', {
            headers,
          })
          if (response.ok) {
            const data = await response.json()
            set({ websiteSettings: data.settings?.website || null })
          }
        } catch (error) {
          logger.error('Failed to load settings', error as Error, { module: 'UIConfigStore' })
        }
      },
      resetToDefault: () => set({ config: defaultConfig }),
      setConfig: (config) => set({ config }),
    }),
    {
      name: 'ui-config-storage',
    }
  )
);