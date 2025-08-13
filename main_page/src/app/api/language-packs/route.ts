import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/language-packs - 공개 언어팩 조회 (인증 불필요)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    
    const where: any = {};
    
    if (category) {
      where.category = category;
    }

    const languagePacks = await prisma.languagePack.findMany({
      where,
      select: {
        id: true,
        key: true,
        ko: true,
        en: true,
        jp: true,
        category: true,
        description: true
      },
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    return NextResponse.json(languagePacks);
  } catch (error) {
    console.error('언어팩 조회 오류:', error);
    return NextResponse.json(
      { error: '언어팩을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}