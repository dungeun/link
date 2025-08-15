import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-utils';
import { translateText } from '@/lib/services/translation.service';

const prisma = new PrismaClient();

// GET: 메뉴 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'header'; // header or footer

    // UI 메뉴 테이블이 없으므로 UISection 테이블을 활용
    const menus = await prisma.uISection.findMany({
      where: {
        type: type,
        visible: true
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ menus }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}

// POST: 새 메뉴 추가
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated || authResult.user?.type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, name, href, icon, autoTranslate = true } = body;

    // 언어팩 키 생성 (고유성 보장)
    const timestamp = Date.now();
    const safeName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const menuKey = `${type}.menu.custom_${safeName}_${timestamp}`;

    // 번역 처리 (Google Translate API가 없으면 기본값 사용)
    let translations: Record<string, unknown> = {};
    if (autoTranslate) {
      try {
        // Google Translate API가 설정되어 있지 않으면 기본값 사용
        const hasGoogleTranslate = process.env.GOOGLE_TRANSLATE_API_KEY && process.env.GOOGLE_TRANSLATE_API_KEY.trim() !== '';
        
        if (hasGoogleTranslate) {
          const [enTranslation, jpTranslation] = await Promise.all([
            translateText(name, 'en').catch(() => name),
            translateText(name, 'ja').catch(() => name)
          ]);

          translations = {
            en: { name: enTranslation },
            jp: { name: jpTranslation }
          };
        } else {
          // API 키가 없으면 간단한 변환 사용
          translations = {
            en: { name: name }, // 실제 프로덕션에서는 API 키 설정 필요
            jp: { name: name }  // 실제 프로덕션에서는 API 키 설정 필요
          };
        }
      } catch (error) {
        console.warn('Translation failed, using original text:', error);
        translations = {
          en: { name: name },
          jp: { name: name }
        };
      }
    } else {
      // 자동 번역을 사용하지 않으면 원본 텍스트 사용
      translations = {
        en: { name: name },
        jp: { name: name }
      };
    }

    // 메뉴 데이터 생성
    const menuContent = {
      id: `menu-${Date.now()}`,
      label: menuKey,
      name: name,
      href: href || '/',
      icon: icon || null,
      visible: true
    };

    // 최대 order 값 조회
    const maxOrder = await prisma.uISection.findFirst({
      where: { type: type },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    // DB에 저장
    const menu = await prisma.uISection.create({
      data: {
        sectionId: menuKey,
        type: type,
        content: menuContent,
        translations: translations,
        order: (maxOrder?.order || 0) + 1,
        visible: true
      }
    });

    // 언어팩에도 추가 (있으면 업데이트, 없으면 생성)
    await prisma.languagePack.upsert({
      where: { key: menuKey },
      update: {
        ko: name,
        en: translations.en?.name || name,
        jp: translations.jp?.name || name,
        category: type,
        description: `${type === 'header' ? '헤더' : '푸터'} 메뉴`
      },
      create: {
        key: menuKey,
        ko: name,
        en: translations.en?.name || name,
        jp: translations.jp?.name || name,
        category: type,
        description: `${type === 'header' ? '헤더' : '푸터'} 메뉴`
      }
    });

    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu:', error);
    return NextResponse.json(
      { error: 'Failed to create menu' },
      { status: 500 }
    );
  }
}

// PUT: 메뉴 수정
export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated || authResult.user?.type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, name, href, icon, visible, order, autoTranslate = false } = body;

    const menu = await prisma.uISection.findUnique({
      where: { id }
    });

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // 컨텐츠 업데이트
    const updatedContent: Record<string, unknown> = (menu.content as Record<string, unknown>) || {};
    if (name !== undefined) updatedContent.name = name;
    if (href !== undefined) updatedContent.href = href;
    if (icon !== undefined) updatedContent.icon = icon;
    if (visible !== undefined) updatedContent.visible = visible;

    // 번역 업데이트
    let updatedTranslations = (menu.translations as Record<string, unknown>) || {};
    if (autoTranslate && name) {
      try {
        // Google Translate API가 설정되어 있지 않으면 기본값 사용
        const hasGoogleTranslate = process.env.GOOGLE_TRANSLATE_API_KEY && process.env.GOOGLE_TRANSLATE_API_KEY.trim() !== '';
        
        let enTranslation = name;
        let jpTranslation = name;
        
        if (hasGoogleTranslate) {
          [enTranslation, jpTranslation] = await Promise.all([
            translateText(name, 'en').catch(() => name),
            translateText(name, 'ja').catch(() => name)
          ]);
        }

        updatedTranslations = {
          ...updatedTranslations,
          en: { ...updatedTranslations.en, name: enTranslation },
          jp: { ...updatedTranslations.jp, name: jpTranslation }
        };

        // 언어팩도 업데이트
        const menuKey = (menu.content as Record<string, unknown>)?.label as string || menu.sectionId;
        await prisma.languagePack.updateMany({
          where: { key: menuKey },
          data: {
            ko: name,
            en: enTranslation,
            jp: jpTranslation
          }
        });
      } catch (error) {
        console.warn('Translation failed during update:', error);
      }
    }

    // DB 업데이트
    const updatedMenu = await prisma.uISection.update({
      where: { id },
      data: {
        content: updatedContent,
        translations: updatedTranslations,
        order: order !== undefined ? order : menu.order,
        visible: visible !== undefined ? visible : menu.visible
      }
    });

    return NextResponse.json({ menu: updatedMenu }, { status: 200 });
  } catch (error) {
    console.error('Failed to update menu:', error);
    return NextResponse.json(
      { error: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

// DELETE: 메뉴 삭제
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated || authResult.user?.type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    const menu = await prisma.uISection.findUnique({
      where: { id }
    });

    if (!menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // 메뉴 삭제
    await prisma.uISection.delete({
      where: { id }
    });

    // 언어팩에서도 삭제 (커스텀 메뉴인 경우)
    const menuKey = (menu.content as Record<string, unknown>)?.label as string || menu.sectionId;
    if (menuKey.includes('custom_')) {
      await prisma.languagePack.deleteMany({
        where: { key: menuKey }
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete menu:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}