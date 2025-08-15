import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { translateText } from '@/lib/services/translation.service';

// GET: 모든 UI 섹션 가져오기
export async function GET(request: NextRequest) {
  try {
    const sections = await prisma.uISection.findMany({
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ 
      sections,
      success: true 
    });
  } catch (error) {
    logger.error('Error fetching UI sections:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch sections',
      success: false 
    }, { status: 500 });
  }
}

// POST: 새 섹션 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, type, title, subtitle, content, order, visible } = body;

    // 번역 처리 (한글이 기본)
    let translations: Record<string, { title?: string; subtitle?: string; content?: Record<string, unknown> }> = {};
    
    if (title || subtitle || content) {
      // 영어 번역
      const enTranslations: Record<string, unknown> = {};
      if (title) enTranslations.title = await translateText(title, 'ko', 'en');
      if (subtitle) enTranslations.subtitle = await translateText(subtitle, 'ko', 'en');
      
      // content 내부의 텍스트들도 번역
      if (content) {
        enTranslations.content = await translateContentTexts(content, 'ko', 'en');
      }
      translations.en = enTranslations;

      // 일본어 번역
      const jpTranslations: Record<string, unknown> = {};
      if (title) jpTranslations.title = await translateText(title, 'ko', 'ja');
      if (subtitle) jpTranslations.subtitle = await translateText(subtitle, 'ko', 'ja');
      
      if (content) {
        jpTranslations.content = await translateContentTexts(content, 'ko', 'ja');
      }
      translations.jp = jpTranslations;
    }

    const section = await prisma.uISection.create({
      data: {
        sectionId,
        type,
        title,
        subtitle,
        content,
        order: order || 0,
        visible: visible !== false,
        translations
      }
    });

    return NextResponse.json({ 
      section,
      success: true 
    });
  } catch (error) {
    logger.error('Error creating UI section:', error);
    return NextResponse.json({ 
      error: 'Failed to create section',
      success: false 
    }, { status: 500 });
  }
}

// PUT: 섹션 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, sectionId, title, subtitle, content, order, visible, autoTranslate } = body;

    if (!id && !sectionId) {
      return NextResponse.json({ 
        error: 'Section ID is required',
        success: false 
      }, { status: 400 });
    }

    // 기존 섹션 조회
    const existingSection = await prisma.uISection.findFirst({
      where: id ? { id } : { sectionId }
    });

    if (!existingSection) {
      return NextResponse.json({ 
        error: 'Section not found',
        success: false 
      }, { status: 404 });
    }

    // 자동 번역 처리
    let translations = (existingSection.translations as Record<string, { title?: string; subtitle?: string; content?: Record<string, unknown> }>) || {};
    
    if (autoTranslate && (title || subtitle || content)) {
      // 영어 번역
      if (!translations.en) translations.en = {};
      if (title) translations.en.title = await translateText(title, 'ko', 'en');
      if (subtitle) translations.en.subtitle = await translateText(subtitle, 'ko', 'en');
      if (content) {
        const translatedContent = await translateContentTexts(content, 'ko', 'en');
        translations.en = { ...translations.en, ...translatedContent };
      }

      // 일본어 번역
      if (!translations.jp) translations.jp = {};
      if (title) translations.jp.title = await translateText(title, 'ko', 'ja');
      if (subtitle) translations.jp.subtitle = await translateText(subtitle, 'ko', 'ja');
      if (content) {
        const translatedContent = await translateContentTexts(content, 'ko', 'ja');
        translations.jp = { ...translations.jp, ...translatedContent };
      }
    }

    const section = await prisma.uISection.update({
      where: id ? { id } : { sectionId },
      data: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
        ...(visible !== undefined && { visible }),
        translations
      }
    });

    return NextResponse.json({ 
      section,
      success: true 
    });
  } catch (error) {
    logger.error('Error updating UI section:', error);
    return NextResponse.json({ 
      error: 'Failed to update section',
      success: false 
    }, { status: 500 });
  }
}

// DELETE: 섹션 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const sectionId = searchParams.get('sectionId');

    if (!id && !sectionId) {
      return NextResponse.json({ 
        error: 'Section ID is required',
        success: false 
      }, { status: 400 });
    }

    await prisma.uISection.delete({
      where: id ? { id } : { sectionId }
    });

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    logger.error('Error deleting UI section:', error);
    return NextResponse.json({ 
      error: 'Failed to delete section',
      success: false 
    }, { status: 500 });
  }
}

// content 내부의 텍스트 번역 헬퍼 함수
async function translateContentTexts(content: Record<string, unknown>, from: string, to: string): Promise<Record<string, unknown>> {
  if (!content) return {};

  const result: Record<string, unknown> = {};

  // 히어로 슬라이드 번역
  if (content.slides && Array.isArray(content.slides)) {
    result.slides = await Promise.all(content.slides.map(async (slide: Record<string, unknown>) => {
      const translatedSlide: Record<string, unknown> = {
        ...slide
      };
      
      if (slide.title) {
        translatedSlide.title = await translateText(slide.title, from, to);
      }
      if (slide.subtitle) {
        translatedSlide.subtitle = await translateText(slide.subtitle, from, to);
      }
      if (slide.tag) {
        // 이모지는 제외하고 텍스트만 번역
        const textOnly = slide.tag.replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim();
        if (textOnly) {
          const translated = await translateText(textOnly, from, to);
          translatedSlide.tag = slide.tag.replace(textOnly, translated);
        } else {
          translatedSlide.tag = slide.tag;
        }
      }
      
      return translatedSlide;
    }));
  }

  // 카테고리 번역
  if (content.categories && Array.isArray(content.categories)) {
    result.categories = await Promise.all(content.categories.map(async (cat: Record<string, unknown>) => {
      const translatedCat: Record<string, unknown> = {
        ...cat
      };
      
      if (cat.name) {
        translatedCat.name = await translateText(cat.name, from, to);
      }
      if (cat.badge) {
        translatedCat.badge = await translateText(cat.badge, from, to);
      }
      
      return translatedCat;
    }));
  }

  // 링크 번역
  if (content.links && Array.isArray(content.links)) {
    result.links = await Promise.all(content.links.map(async (link: Record<string, unknown>) => {
      const translatedLink: Record<string, unknown> = {
        ...link
      };
      
      if (link.title) {
        // 이모지는 제외하고 텍스트만 번역
        const textOnly = link.title.replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').trim();
        if (textOnly) {
          const translated = await translateText(textOnly, from, to);
          translatedLink.title = link.title.replace(textOnly, translated);
        } else {
          translatedLink.title = link.title;
        }
      }
      
      return translatedLink;
    }));
  }

  // 기타 콘텐츠
  if (content.campaigns) result.campaigns = content.campaigns;
  if (content.products) result.products = content.products;
  if (content.buttons) result.buttons = content.buttons;

  return result;
}