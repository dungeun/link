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

    // 언어팩 키 생성
    const menuKey = `${type}.menu.${name.toLowerCase().replace(/\s+/g, '_')}`;

    // 번역 처리
    let translations: any = {};
    if (autoTranslate) {
      const [enTranslation, jpTranslation] = await Promise.all([
        translateText(name, 'ko', 'en'),
        translateText(name, 'ko', 'ja')
      ]);

      translations = {
        en: { name: enTranslation },
        jp: { name: jpTranslation }
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

    // 언어팩에도 추가
    await prisma.languagePack.create({
      data: {
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
    const updatedContent: any = menu.content || {};
    if (name !== undefined) updatedContent.name = name;
    if (href !== undefined) updatedContent.href = href;
    if (icon !== undefined) updatedContent.icon = icon;
    if (visible !== undefined) updatedContent.visible = visible;

    // 번역 업데이트
    let updatedTranslations = menu.translations as any || {};
    if (autoTranslate && name) {
      const [enTranslation, jpTranslation] = await Promise.all([
        translateText(name, 'ko', 'en'),
        translateText(name, 'ko', 'ja')
      ]);

      updatedTranslations = {
        ...updatedTranslations,
        en: { ...updatedTranslations.en, name: enTranslation },
        jp: { ...updatedTranslations.jp, name: jpTranslation }
      };

      // 언어팩도 업데이트
      const menuKey = (menu.content as any)?.label || menu.sectionId;
      await prisma.languagePack.updateMany({
        where: { key: menuKey },
        data: {
          ko: name,
          en: enTranslation,
          jp: jpTranslation
        }
      });
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
    const menuKey = (menu.content as any)?.label || menu.sectionId;
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