import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { translateText } from '@/lib/services/translation.service';

// GET: 특정 섹션 가져오기
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const section = await prisma.uISection.findUnique({
      where: { sectionId: params.sectionId }
    });

    if (!section) {
      return NextResponse.json({ 
        error: 'Section not found',
        success: false 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      section,
      success: true 
    });
  } catch (error) {
    logger.error('Error fetching UI section:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch section',
      success: false 
    }, { status: 500 });
  }
}

// PUT: 특정 섹션 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const body = await request.json();
    const { title, subtitle, content, order, visible, autoTranslate } = body;

    // 기존 섹션 조회
    const existingSection = await prisma.uISection.findUnique({
      where: { sectionId: params.sectionId }
    });

    if (!existingSection) {
      return NextResponse.json({ 
        error: 'Section not found',
        success: false 
      }, { status: 404 });
    }

    // 자동 번역 처리 (선택사항)
    let translations = (existingSection.translations as Record<string, unknown>) || {};
    
    if (autoTranslate) {
      try {
        // content 내 슬라이드가 있으면 번역
        if (content?.slides) {
          translations.en = translations.en || {};
          translations.jp = translations.jp || {};
          
          // 영어 번역
          translations.en.slides = await Promise.all(content.slides.map(async (slide: { title?: string; subtitle?: string; tag?: string; [key: string]: unknown }) => ({
            ...slide,
            title: slide.title ? await translateText(slide.title, 'en').catch(() => slide.title) : slide.title,
            subtitle: slide.subtitle ? await translateText(slide.subtitle, 'en').catch(() => slide.subtitle) : slide.subtitle,
            tag: slide.tag ? await translateTagText(slide.tag, 'en').catch(() => slide.tag) : slide.tag
          })));

          // 일본어 번역
          translations.jp.slides = await Promise.all(content.slides.map(async (slide: { title?: string; subtitle?: string; tag?: string; [key: string]: unknown }) => ({
            ...slide,
            title: slide.title ? await translateText(slide.title, 'ja').catch(() => slide.title) : slide.title,
            subtitle: slide.subtitle ? await translateText(slide.subtitle, 'ja').catch(() => slide.subtitle) : slide.subtitle,
            tag: slide.tag ? await translateTagText(slide.tag, 'ja').catch(() => slide.tag) : slide.tag
          })));
        }

        // 카테고리가 있으면 번역
        if (content?.categories) {
          translations.en = translations.en || {};
          translations.jp = translations.jp || {};
          
          translations.en.categories = await Promise.all(content.categories.map(async (cat: { name?: string; badge?: string; [key: string]: unknown }) => ({
            ...cat,
            name: cat.name ? await translateText(cat.name, 'en').catch(() => cat.name) : cat.name,
            badge: cat.badge ? await translateText(cat.badge, 'en').catch(() => cat.badge) : cat.badge
          })));

          translations.jp.categories = await Promise.all(content.categories.map(async (cat: { name?: string; badge?: string; [key: string]: unknown }) => ({
            ...cat,
            name: cat.name ? await translateText(cat.name, 'ja').catch(() => cat.name) : cat.name,
            badge: cat.badge ? await translateText(cat.badge, 'ja').catch(() => cat.badge) : cat.badge
          })));
        }

        // 링크가 있으면 번역
        if (content?.links) {
          translations.en = translations.en || {};
          translations.jp = translations.jp || {};
          
          translations.en.links = await Promise.all(content.links.map(async (link: { title?: string; [key: string]: unknown }) => ({
            ...link,
            title: link.title ? await translateTagText(link.title, 'en').catch(() => link.title) : link.title
          })));

          translations.jp.links = await Promise.all(content.links.map(async (link: { title?: string; [key: string]: unknown }) => ({
            ...link,
            title: link.title ? await translateTagText(link.title, 'ja').catch(() => link.title) : link.title
          })));
        }

        // 제목과 부제목 번역
        if (title) {
          translations.en = translations.en || {};
          translations.jp = translations.jp || {};
          translations.en.title = await translateText(title, 'en').catch(() => title);
          translations.jp.title = await translateText(title, 'ja').catch(() => title);
        }

        if (subtitle) {
          translations.en = translations.en || {};
          translations.jp = translations.jp || {};
          translations.en.subtitle = await translateText(subtitle, 'en').catch(() => subtitle);
          translations.jp.subtitle = await translateText(subtitle, 'ja').catch(() => subtitle);
        }
      } catch (translationError) {
        logger.warn('Translation failed, continuing without translation:', translationError);
        // 번역 실패해도 저장은 계속 진행
      }
    }

    const section = await prisma.uISection.update({
      where: { sectionId: params.sectionId },
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

// DELETE: 특정 섹션 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    await prisma.uISection.delete({
      where: { sectionId: params.sectionId }
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

// 이모지를 보존하면서 텍스트만 번역
async function translateTagText(text: string, to: string): Promise<string> {
  // 이모지 패턴
  const emojiRegex = /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]/gu;
  
  // 이모지 찾기
  const emojis = text.match(emojiRegex) || [];
  
  // 이모지 제거한 텍스트
  const textOnly = text.replace(emojiRegex, '').trim();
  
  if (!textOnly) return text;
  
  // 텍스트 번역
  const translated = await translateText(textOnly, to);
  
  // 이모지 다시 붙이기 (원본 위치 유지)
  if (emojis.length > 0) {
    // 첫 번째 이모지가 앞에 있었는지 확인
    if (text.indexOf(emojis[0]) === 0) {
      return emojis[0] + ' ' + translated;
    } else {
      return translated + ' ' + emojis[0];
    }
  }
  
  return translated;
}