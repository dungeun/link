import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { translationService } from '@/lib/services/translation.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/language-packs/translate - 일괄 번역
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { items, targetLanguages = ['en', 'ja'], sourceLanguage = 'ko' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '번역할 항목이 없습니다.' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      return NextResponse.json(
        { error: 'Google Translate API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const translatedItems = [];
    const errors = [];

    for (const item of items) {
      try {
        const translations: any = {
          original: item.text,
          [sourceLanguage]: item.text
        };

        // 각 대상 언어로 번역
        for (const targetLang of targetLanguages) {
          if (targetLang !== sourceLanguage) {
            const result = await translationService.translateText(item.text, {
              from: sourceLanguage,
              to: targetLang
            });
            translations[targetLang] = result.translatedText;
          }
        }

        translatedItems.push({
          ...item,
          translations
        });
      } catch (error) {
        console.error(`번역 실패 - ${item.text}:`, error);
        errors.push({
          item,
          error: error instanceof Error ? error.message : '번역 실패'
        });
      }
    }

    return NextResponse.json({
      success: true,
      translated: translatedItems,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: items.length,
        succeeded: translatedItems.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('일괄 번역 오류:', error);
    return NextResponse.json(
      { error: '일괄 번역에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/language-packs/initialize - 기본 언어팩 초기화
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    // 기본 메뉴 항목들
    const defaultMenuItems = [
      { key: 'menu.home', ko: '홈', category: 'menu' },
      { key: 'menu.campaigns', ko: '캠페인', category: 'menu' },
      { key: 'menu.influencers', ko: '인플루언서', category: 'menu' },
      { key: 'menu.about', ko: '소개', category: 'menu' },
      { key: 'menu.contact', ko: '문의', category: 'menu' },
      { key: 'menu.login', ko: '로그인', category: 'menu' },
      { key: 'menu.signup', ko: '회원가입', category: 'menu' },
      { key: 'menu.mypage', ko: '마이페이지', category: 'menu' },
      { key: 'menu.logout', ko: '로그아웃', category: 'menu' },
      { key: 'menu.admin', ko: '관리자', category: 'menu' },
      { key: 'menu.business', ko: '비즈니스', category: 'menu' },
      { key: 'menu.settings', ko: '설정', category: 'menu' }
    ];

    // 기본 버튼 텍스트
    const defaultButtons = [
      { key: 'button.submit', ko: '제출', category: 'button' },
      { key: 'button.cancel', ko: '취소', category: 'button' },
      { key: 'button.save', ko: '저장', category: 'button' },
      { key: 'button.delete', ko: '삭제', category: 'button' },
      { key: 'button.edit', ko: '수정', category: 'button' },
      { key: 'button.create', ko: '생성', category: 'button' },
      { key: 'button.search', ko: '검색', category: 'button' },
      { key: 'button.filter', ko: '필터', category: 'button' },
      { key: 'button.apply', ko: '신청', category: 'button' },
      { key: 'button.approve', ko: '승인', category: 'button' },
      { key: 'button.reject', ko: '거절', category: 'button' }
    ];

    // 기본 레이블
    const defaultLabels = [
      { key: 'label.title', ko: '제목', category: 'label' },
      { key: 'label.description', ko: '설명', category: 'label' },
      { key: 'label.platform', ko: '플랫폼', category: 'label' },
      { key: 'label.budget', ko: '예산', category: 'label' },
      { key: 'label.startDate', ko: '시작일', category: 'label' },
      { key: 'label.endDate', ko: '종료일', category: 'label' },
      { key: 'label.status', ko: '상태', category: 'label' },
      { key: 'label.email', ko: '이메일', category: 'label' },
      { key: 'label.password', ko: '비밀번호', category: 'label' },
      { key: 'label.name', ko: '이름', category: 'label' },
      { key: 'label.phone', ko: '전화번호', category: 'label' },
      { key: 'label.company', ko: '회사', category: 'label' }
    ];

    const allItems = [...defaultMenuItems, ...defaultButtons, ...defaultLabels];
    const created = [];
    const skipped = [];

    for (const item of allItems) {
      // 이미 존재하는지 확인
      const existing = await prisma.languagePack.findUnique({
        where: { key: item.key }
      });

      if (existing) {
        skipped.push(item.key);
        continue;
      }

      // 자동 번역
      let enText = item.ko;
      let jaText = item.ko;

      if (process.env.GOOGLE_TRANSLATE_API_KEY) {
        try {
          const multiLang = await translationService.translateToMultiLanguages(item.ko);
          enText = multiLang.en;
          jaText = multiLang.ja;
        } catch (error) {
          console.error(`번역 실패 - ${item.key}:`, error);
        }
      }

      // 언어팩 생성
      await prisma.languagePack.create({
        data: {
          key: item.key,
          ko: item.ko,
          en: enText,
          ja: jaText,
          category: item.category,
          isEditable: true
        }
      });

      created.push(item.key);
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: allItems.length,
        created: created.length,
        skipped: skipped.length
      },
      created,
      skipped
    });
  } catch (error) {
    console.error('언어팩 초기화 오류:', error);
    return NextResponse.json(
      { error: '언어팩 초기화에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}