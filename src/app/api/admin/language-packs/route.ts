import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { translationService } from '@/lib/services/translation.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/language-packs - 언어팩 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { ko: { contains: search, mode: 'insensitive' } },
        { en: { contains: search, mode: 'insensitive' } },
        { ja: { contains: search, mode: 'insensitive' } }
      ];
    }

    const languagePacks = await prisma.languagePack.findMany({
      where,
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

// POST /api/admin/language-packs - 언어팩 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { key, ko, en, ja, category, description, autoTranslate } = body;

    // 필수 필드 검증
    if (!key || !ko || !category) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 중복 키 검사
    const existing = await prisma.languagePack.findUnique({
      where: { key }
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 키입니다.' },
        { status: 409 }
      );
    }

    let translatedEn = en;
    let translatedJa = ja;

    // 자동 번역 옵션이 활성화되고 번역 값이 없는 경우
    if (autoTranslate && process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
        if (!en) {
          const enResult = await translationService.translateText(ko, { from: 'ko', to: 'en' });
          translatedEn = enResult.translatedText;
        }
        if (!ja) {
          const jaResult = await translationService.translateText(ko, { from: 'ko', to: 'ja' });
          translatedJa = jaResult.translatedText;
        }
      } catch (error) {
        console.error('자동 번역 실패:', error);
      }
    }

    const languagePack = await prisma.languagePack.create({
      data: {
        key,
        ko,
        en: translatedEn || ko, // 번역 실패 시 한국어 사용
        ja: translatedJa || ko, // 번역 실패 시 한국어 사용
        category,
        description,
        isEditable: true
      }
    });

    return NextResponse.json(languagePack);
  } catch (error) {
    console.error('언어팩 생성 오류:', error);
    return NextResponse.json(
      { error: '언어팩 생성에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/admin/language-packs - 언어팩 수정
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { id, ko, en, ja, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 수정 가능 여부 확인
    const existing = await prisma.languagePack.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: '존재하지 않는 언어팩입니다.' },
        { status: 404 }
      );
    }

    if (!existing.isEditable) {
      return NextResponse.json(
        { error: '수정할 수 없는 언어팩입니다.' },
        { status: 403 }
      );
    }

    const languagePack = await prisma.languagePack.update({
      where: { id },
      data: {
        ko,
        en,
        ja,
        description
      }
    });

    return NextResponse.json(languagePack);
  } catch (error) {
    console.error('언어팩 수정 오류:', error);
    return NextResponse.json(
      { error: '언어팩 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/admin/language-packs/[id] - 언어팩 삭제
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 삭제 가능 여부 확인
    const existing = await prisma.languagePack.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: '존재하지 않는 언어팩입니다.' },
        { status: 404 }
      );
    }

    if (!existing.isEditable) {
      return NextResponse.json(
        { error: '삭제할 수 없는 언어팩입니다.' },
        { status: 403 }
      );
    }

    await prisma.languagePack.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('언어팩 삭제 오류:', error);
    return NextResponse.json(
      { error: '언어팩 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}