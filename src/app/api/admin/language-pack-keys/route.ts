import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';

// GET /api/admin/language-pack-keys - 언어팩 키 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 카테고리별로 언어팩 키 조회
    const category = request.nextUrl.searchParams.get('category') || 'ui_config';
    
    const languagePacks = await prisma.languagePack.findMany({
      where: {
        category: category
      },
      select: {
        key: true,
        ko: true,
        en: true,
        jp: true,
        description: true
      },
      orderBy: {
        key: 'asc'
      }
    });

    // 헤더 메뉴에 사용할 수 있는 키들을 필터링
    const headerMenuKeys = languagePacks.filter(pack => 
      pack.key.startsWith('header.menu.') || 
      pack.key.startsWith('menu.') ||
      pack.key.startsWith('footer.')
    );

    return NextResponse.json({
      all: languagePacks,
      headerMenu: headerMenuKeys,
      categories: {
        header: languagePacks.filter(pack => pack.key.startsWith('header.')),
        footer: languagePacks.filter(pack => pack.key.startsWith('footer.')),
        hero: languagePacks.filter(pack => pack.key.startsWith('hero.')),
        category: languagePacks.filter(pack => pack.key.startsWith('category.')),
        quicklink: languagePacks.filter(pack => pack.key.startsWith('quicklink.')),
        promo: languagePacks.filter(pack => pack.key.startsWith('promo.'))
      }
    });
  } catch (error) {
    console.error('언어팩 키 조회 오류:', error);
    return NextResponse.json({ error: '언어팩 키 조회 실패' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}