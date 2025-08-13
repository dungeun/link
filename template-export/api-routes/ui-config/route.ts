import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession();
    if (!session || session.user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DB에서 UI 설정 조회
    const uiConfig = await prisma.siteConfig.findUnique({
      where: { key: 'ui-config' }
    });

    if (!uiConfig) {
      // 기본 설정 반환
      const defaultConfig = {
        header: {
          logo: {
            text: 'LinkPick',
            imageUrl: null
          },
          menus: [
            { id: 'menu-1', label: 'header.menu.campaigns', href: '/campaigns', order: 1, visible: true },
            { id: 'menu-2', label: 'header.menu.influencers', href: '/influencers', order: 2, visible: true },
            { id: 'menu-3', label: 'header.menu.community', href: '/community', order: 3, visible: true },
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
              title: 'footer.column.service',
              order: 1,
              links: [
                { id: 'link-1', label: 'footer.link.find_influencers', href: '/influencers', order: 1, visible: true },
                { id: 'link-2', label: 'footer.link.create_campaign', href: '/campaigns/create', order: 2, visible: true },
              ]
            },
            {
              id: 'column-2',
              title: 'footer.column.company',
              order: 2,
              links: [
                { id: 'link-3', label: 'footer.link.about', href: '/about', order: 1, visible: true },
                { id: 'link-4', label: 'footer.link.contact', href: '/contact', order: 2, visible: true },
              ]
            },
            {
              id: 'column-3',
              title: 'footer.column.legal',
              order: 3,
              links: [
                { id: 'link-5', label: 'footer.link.terms', href: '/terms', order: 1, visible: true },
                { id: 'link-6', label: 'footer.link.privacy', href: '/privacy', order: 2, visible: true },
              ]
            }
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
          ],
          categoryMenus: [
            { id: 'cat-1', name: 'category.beauty', categoryId: 'beauty', icon: '', order: 1, visible: true },
            { id: 'cat-2', name: 'category.fashion', categoryId: 'fashion', icon: '', order: 2, visible: true },
            { id: 'cat-3', name: 'category.food', categoryId: 'food', icon: '', badge: 'badge.hot', order: 3, visible: true },
            { id: 'cat-4', name: 'category.travel', categoryId: 'travel', icon: '', order: 4, visible: true },
            { id: 'cat-5', name: 'category.tech', categoryId: 'tech', icon: '', order: 5, visible: true },
            { id: 'cat-6', name: 'category.fitness', categoryId: 'fitness', icon: '', order: 6, visible: true },
            { id: 'cat-7', name: 'category.lifestyle', categoryId: 'lifestyle', icon: '', order: 7, visible: true },
            { id: 'cat-8', name: 'category.pet', categoryId: 'pet', icon: '', order: 8, visible: true },
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
          }
        }
      };
      
      return NextResponse.json({ config: defaultConfig });
    }

    return NextResponse.json({ config: JSON.parse(uiConfig.value) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession();
    if (!session || session.user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { config } = await request.json();

    // 중복 섹션 ID 정리
    if (config.mainPage?.sectionOrder) {
      // sectionOrder에서 중복 제거
      const seenIds = new Set<string>();
      const cleanedSectionOrder = config.mainPage.sectionOrder.filter((section: any) => {
        if (seenIds.has(section.id)) {
          console.log(`Removing duplicate section ID: ${section.id}`);
          return false;
        }
        seenIds.add(section.id);
        return true;
      });
      config.mainPage.sectionOrder = cleanedSectionOrder;
    }

    if (config.mainPage?.customSections) {
      // customSections에서 중복 제거
      const seenCustomIds = new Set<string>();
      const cleanedCustomSections = config.mainPage.customSections.filter((section: any) => {
        if (seenCustomIds.has(section.id)) {
          console.log(`Removing duplicate custom section ID: ${section.id}`);
          return false;
        }
        seenCustomIds.add(section.id);
        return true;
      });
      config.mainPage.customSections = cleanedCustomSections;
    }

    // DB에 UI 설정 저장 - JSON을 문자열로 변환
    await prisma.siteConfig.upsert({
      where: { key: 'ui-config' },
      update: { value: JSON.stringify(config) },
      create: { key: 'ui-config', value: JSON.stringify(config) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('UI config save error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}