import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 간소화된 번역 함수 - 캐시 제거하여 실시간 번역 보장
async function getTranslation(key: string, language: string = 'ko'): Promise<string> {
  try {
    const translation = await prisma.languagePack.findUnique({
      where: { key },
      select: {
        ko: true,
        en: true,
        jp: true
      }
    });
    
    if (!translation) {
      return key;
    }
    
    // 언어별 필드 접근
    switch (language) {
      case 'ko':
        return translation.ko || key;
      case 'en':
        return translation.en || translation.ko || key;
      case 'jp':
        return translation.jp || translation.ko || key;
      default:
        return translation.ko || key;
    }
  } catch (error) {
    console.error(`Translation error for key ${key}:`, error);
    return key;
  }
}

// GET /api/ui-config - 공개 UI 설정 조회 (모든 사용자 접근 가능)
export async function GET(request: NextRequest) {
  try {
    // 언어 파라미터 추출
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'ko';
    
    // 데이터베이스에서 메뉴에 표시할 카테고리 조회
    let categoryMenus: any[] = [];
    try {
      const categories = await prisma.category.findMany({
        where: {
          showInMenu: true,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          menuOrder: true
        },
        orderBy: { menuOrder: 'asc' }
      });

      categoryMenus = categories.map((cat, index) => ({
        id: `cat-${cat.id}`,
        name: cat.name,
        categoryId: cat.slug,
        icon: cat.icon || '',
        href: `/category/${cat.slug}`,
        order: cat.menuOrder || index + 1,
        visible: true
      }));
    } catch (error) {
      console.warn('Failed to fetch category menus:', error);
      // 기본 카테고리 메뉴 유지
    }

    // Admin UI에서 관리하는 헤더 메뉴 가져오기
    let adminHeaderMenus = [];
    try {
      const adminMenus = await prisma.uISection.findMany({
        where: {
          type: 'header',
          visible: true
        },
        orderBy: { order: 'asc' }
      });

      for (const menu of adminMenus) {
        const content = typeof menu.content === 'string' 
          ? JSON.parse(menu.content) 
          : menu.content || {};
        
        // 번역 키가 있으면 번역하고, 없으면 그대로 사용
        let label = content.label || menu.sectionId || 'Unknown';
        let displayText = label;
        
        // 언어팩 키인 경우 번역 가져오기
        if (label.includes('.') && !label.includes('http')) {
          const translation = await getTranslation(label, language);
          displayText = translation !== label ? translation : (content.name || label);
        } else if (content.name) {
          // name 필드가 있으면 그것을 사용
          displayText = content.name;
        }

        const adminMenu = {
          id: `admin-${menu.id}`,
          label: displayText,  // 번역된 텍스트 사용
          languageKey: label,   // 원본 언어 키 보존  
          href: content.href || '#',
          order: menu.order || 999,
          visible: menu.visible,
          // 카테고리 메뉴인 경우 실제 이름 추가
          displayName: content.name || displayText
        };

        adminHeaderMenus.push(adminMenu);
      }
    } catch (error) {
      console.warn('[UI Config] Failed to fetch admin header menus:', error);
    }

    // 카테고리 메뉴는 이제 Admin UI에서 관리하므로 자동 추가 제거
    // Admin UI에서 관리하는 메뉴만 사용
    const allHeaderMenus = adminHeaderMenus.sort((a, b) => a.order - b.order);

    // 로그 출력 줄임 (무한루프 방지)

    // 기본 설정 먼저 준비 (번역 적용)
    const defaultConfig = {
        header: {
          logo: {
            text: 'LinkPick',
            imageUrl: null
          },
          menus: allHeaderMenus,
          ctaButton: {
            text: await getTranslation('header.cta.start', language),
            href: '/register',
            visible: true
          }
        },
        footer: {
          columns: [
            {
              id: 'column-1',
              title: 'footer.service.title',
              order: 1,
              links: [
                { id: 'link-1', label: 'footer.service.find_influencers', href: '/influencers', order: 1, visible: true },
                { id: 'link-2', label: 'footer.service.create_campaign', href: '/campaigns/create', order: 2, visible: true },
              ]
            },
            {
              id: 'column-2',
              title: 'footer.company.title',
              order: 2,
              links: [
                { id: 'link-3', label: 'footer.company.about', href: '/about', order: 1, visible: true },
                { id: 'link-4', label: 'footer.company.contact', href: '/contact', order: 2, visible: true },
              ]
            },
            {
              id: 'column-3',
              title: 'footer.legal.title',
              order: 3,
              links: [
                { id: 'link-5', label: 'footer.legal.terms', href: '/terms', order: 1, visible: true },
                { id: 'link-6', label: 'footer.legal.privacy', href: '/privacy', order: 2, visible: true },
              ]
            }
          ],
          social: [
            { platform: 'twitter', url: 'https://twitter.com/linkpick', visible: true },
            { platform: 'facebook', url: 'https://facebook.com/linkpick', visible: true },
            { platform: 'instagram', url: 'https://instagram.com/linkpick', visible: true }
          ],
          copyright: 'footer.copyright'
        },
        mainPage: {
          heroSlides: [
            {
              id: 'slide-1',
              type: 'blue' as const,
              tag: await getTranslation('hero.slide1.tag', language),
              title: await getTranslation('hero.slide1.title', language),
              subtitle: await getTranslation('hero.slide1.subtitle', language),
              bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
              order: 1,
              visible: true,
            },
            {
              id: 'slide-2',
              type: 'dark' as const,
              title: await getTranslation('hero.slide2.title', language),
              subtitle: await getTranslation('hero.slide2.subtitle', language),
              bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
              order: 2,
              visible: true,
            },
            {
              id: 'slide-3',
              type: 'green' as const,
              title: await getTranslation('hero.slide3.title', language),
              subtitle: await getTranslation('hero.slide3.subtitle', language),
              bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
              order: 3,
              visible: true,
            },
            {
              id: 'slide-4',
              type: 'pink' as const,
              tag: await getTranslation('hero.slide4.tag', language),
              title: await getTranslation('hero.slide4.title', language),
              subtitle: await getTranslation('hero.slide4.subtitle', language),
              bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600',
              order: 4,
              visible: true,
            },
            {
              id: 'slide-5',
              type: 'blue' as const,
              title: await getTranslation('hero.slide5.title', language),
              subtitle: await getTranslation('hero.slide5.subtitle', language),
              bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
              order: 5,
              visible: true,
            },
            {
              id: 'slide-6',
              type: 'dark' as const,
              tag: await getTranslation('hero.slide6.tag', language),
              title: await getTranslation('hero.slide6.title', language),
              subtitle: await getTranslation('hero.slide6.subtitle', language),
              bgColor: 'bg-gradient-to-br from-gray-700 to-gray-900',
              order: 6,
              visible: true,
            },
          ],
          categoryMenus: categoryMenus.length > 0 ? categoryMenus : [
            { id: 'cat-1', name: await getTranslation('category.beauty', language), categoryId: 'beauty', icon: '💄', href: '/category/beauty', order: 1, visible: true },
            { id: 'cat-2', name: await getTranslation('category.fashion', language), categoryId: 'fashion', icon: '👗', href: '/category/fashion', order: 2, visible: true },
            { id: 'cat-3', name: await getTranslation('category.food', language), categoryId: 'food', icon: '🍔', href: '/category/food', badge: await getTranslation('badge.hot', language), order: 3, visible: true },
            { id: 'cat-4', name: await getTranslation('category.travel', language), categoryId: 'travel', icon: '✈️', href: '/category/travel', order: 4, visible: true },
            { id: 'cat-5', name: await getTranslation('category.tech', language), categoryId: 'tech', icon: '💻', href: '/category/tech', order: 5, visible: true },
            { id: 'cat-6', name: await getTranslation('category.fitness', language), categoryId: 'fitness', icon: '💪', href: '/category/fitness', order: 6, visible: true },
            { id: 'cat-7', name: await getTranslation('category.lifestyle', language), categoryId: 'lifestyle', icon: '🌱', href: '/category/lifestyle', order: 7, visible: true },
            { id: 'cat-8', name: await getTranslation('category.pet', language), categoryId: 'pet', icon: '🐕', href: '/category/pet', order: 8, visible: true },
          ],
          quickLinks: [
            { id: 'quick-1', title: await getTranslation('quicklink.events', language), icon: '🎁', link: '/events', order: 1, visible: true },
            { id: 'quick-2', title: await getTranslation('quicklink.coupons', language), icon: '🎟️', link: '/coupons', order: 2, visible: true },
            { id: 'quick-3', title: await getTranslation('quicklink.ranking', language), icon: '🏆', link: '/ranking', order: 3, visible: true },
          ],
          promoBanner: {
            title: await getTranslation('promo.title', language),
            subtitle: await getTranslation('promo.subtitle', language),
            icon: '📦',
            visible: true,
          },
          sectionOrder: [
            { id: 'hero', type: 'hero', order: 1, visible: true },
            { id: 'category', type: 'category', order: 2, visible: true },
            { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
            { id: 'promo', type: 'promo', order: 4, visible: true },
            { id: 'ranking', type: 'ranking', order: 5, visible: true },
            { id: 'recommended', type: 'recommended', order: 6, visible: true }
          ]
        }
      };

    // 데이터베이스에서 UI 설정 조회 시도 - Admin 메뉴 병합 필요
    try {
      const uiConfig = await prisma.siteConfig.findFirst({
        where: { key: 'ui-config' },
      });

      if (uiConfig) {
        const savedConfig = JSON.parse(uiConfig.value);
        
        // 저장된 설정의 헤더 메뉴를 Admin 메뉴로 교체
        if (savedConfig.header) {
          savedConfig.header.menus = allHeaderMenus;
        }
        
        return NextResponse.json({ config: savedConfig });
      }
    } catch (dbError) {
      console.warn('[UI Config] Database connection failed, using default config:', dbError);
    }

    // 기본 설정 반환
    return NextResponse.json({ config: defaultConfig });
  } catch (error) {
    console.error('[UI Config] UI config 조회 오류:', error);
    console.log('[UI Config] Falling back to error handling with admin menus...');
    
    // Fallback to default config - try to load admin menus even in error case
    let fallbackAdminMenus: any[] = [];
    try {
      const adminMenus = await prisma.uISection.findMany({
        where: {
          type: 'header',
          visible: true
        },
        orderBy: { order: 'asc' }
      });

      fallbackAdminMenus = adminMenus.map(menu => {
        const content = typeof menu.content === 'string' 
          ? JSON.parse(menu.content) 
          : menu.content || {};
        
        return {
          id: `fallback-admin-${menu.id}`,
          label: content.label || menu.sectionId || 'Unknown',
          href: content.href || '#',
          order: menu.order || 999,
          visible: menu.visible
        };
      });
    } catch (dbError) {
      console.warn('Fallback admin menu loading also failed:', dbError);
    }
    
    const defaultConfig = {
      header: {
        logo: {
          text: 'LinkPick',
          imageUrl: null
        },
        menus: fallbackAdminMenus.length > 0 ? fallbackAdminMenus : [
          { id: 'fallback-1', label: 'header.menu.campaigns', href: '/campaigns', order: 1, visible: true },
          { id: 'fallback-2', label: 'header.menu.community', href: '/community', order: 2, visible: true },
        ],
        ctaButton: {
          text: 'header.cta.start',
          href: '/register',
          visible: true
        }
      },
      footer: {
        columns: [
          {
            id: 'column-1',
            title: 'footer.service.title',
            order: 1,
            links: [
              { id: 'link-1', label: 'footer.service.find_influencers', href: '/influencers', order: 1, visible: true },
              { id: 'link-2', label: 'footer.service.create_campaign', href: '/campaigns/create', order: 2, visible: true },
            ]
          },
          {
            id: 'column-2',
            title: 'footer.company.title',
            order: 2,
            links: [
              { id: 'link-3', label: 'footer.company.about', href: '/about', order: 1, visible: true },
              { id: 'link-4', label: 'footer.company.contact', href: '/contact', order: 2, visible: true },
            ]
          },
          {
            id: 'column-3',
            title: 'footer.legal.title',
            order: 3,
            links: [
              { id: 'link-5', label: 'footer.legal.terms', href: '/terms', order: 1, visible: true },
              { id: 'link-6', label: 'footer.legal.privacy', href: '/privacy', order: 2, visible: true },
            ]
          }
        ],
        social: [
          { platform: 'twitter', url: 'https://twitter.com/linkpick', visible: true },
          { platform: 'facebook', url: 'https://facebook.com/linkpick', visible: true },
          { platform: 'instagram', url: 'https://instagram.com/linkpick', visible: true }
        ],
        copyright: 'footer.copyright'
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
          { id: 'cat-3', name: 'category.food', categoryId: 'food', icon: '', badge: 'badge.hot', order: 3, visible: true },
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
        sectionOrder: [
          { id: 'hero', type: 'hero', order: 1, visible: true },
          { id: 'category', type: 'category', order: 2, visible: true },
          { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
          { id: 'promo', type: 'promo', order: 4, visible: true },
          { id: 'ranking', type: 'ranking', order: 5, visible: true },
          { id: 'recommended', type: 'recommended', order: 6, visible: true }
        ]
      }
    };
    
    console.log('[UI Config] Returning fallback default config');
    console.log(`[UI Config] Fallback config header menus: ${defaultConfig.header.menus.length}`);
    return NextResponse.json({ config: defaultConfig });
  }
}

// POST /api/ui-config - UI 설정 업데이트 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      // 간단한 검증 - 실제로는 authService 사용
      const { authService } = await import('@/lib/auth/services');
      const tokenData = await authService.validateToken(token);
      
      if (!tokenData || !tokenData.userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const user = await prisma.user.findUnique({
        where: { id: tokenData.userId },
        select: { type: true }
      });
      
      if (!user || user.type !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { config } = body;
    
    if (!config) {
      return NextResponse.json(
        { error: 'Config data required' },
        { status: 400 }
      );
    }
    
    // UI 설정 저장 또는 업데이트
    await prisma.siteConfig.upsert({
      where: { key: 'ui-config' },
      update: {
        value: JSON.stringify(config),
        updatedAt: new Date()
      },
      create: {
        key: 'ui-config',
        value: JSON.stringify(config)
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'UI configuration updated successfully'
    });
  } catch (error) {
    console.error('UI config update error:', error);
    return NextResponse.json(
      { error: 'Failed to update UI configuration' },
      { status: 500 }
    );
  }
}
