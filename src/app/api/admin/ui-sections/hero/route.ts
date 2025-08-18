import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { translateText } from '@/lib/services/translation.service';

// Dynamic route configuration
export const dynamic = 'force-dynamic';

// GET: Hero 섹션 가져오기
export async function GET() {
  try {
    const section = await prisma.uISection.findFirst({
      where: { sectionId: 'hero' }
    });

    return NextResponse.json({ 
      section,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch hero section',
      success: false 
    }, { status: 500 });
  }
}

// PUT: Hero 섹션 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, visible, autoTranslate } = body;

    if (!content) {
      return NextResponse.json({ 
        error: 'Content is required',
        success: false 
      }, { status: 400 });
    }

    // 기존 섹션 조회 또는 생성
    let existingSection = await prisma.uISection.findFirst({
      where: { sectionId: 'hero' }
    });

    // 자동 번역 처리
    let translations: Record<string, any> = {};
    
    if (autoTranslate && content.slides) {
      // 영어 번역
      const enSlides = await Promise.all(content.slides.map(async (slide: any) => {
        const translatedSlide = { ...slide };
        
        if (slide.title) {
          translatedSlide.title = await translateText(slide.title, 'en');
        }
        if (slide.subtitle) {
          translatedSlide.subtitle = await translateText(slide.subtitle, 'en');
        }
        if (slide.tag) {
          // 이모지 제외하고 텍스트만 번역
          const textOnly = slide.tag.replace(/[\u2600-\u26FF]|[\u2700-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
          if (textOnly) {
            const translated = await translateText(textOnly, 'en');
            translatedSlide.tag = slide.tag.replace(textOnly, translated);
          }
        }
        
        return translatedSlide;
      }));

      // 일본어 번역
      const jpSlides = await Promise.all(content.slides.map(async (slide: any) => {
        const translatedSlide = { ...slide };
        
        if (slide.title) {
          translatedSlide.title = await translateText(slide.title, 'ja');
        }
        if (slide.subtitle) {
          translatedSlide.subtitle = await translateText(slide.subtitle, 'ja');
        }
        if (slide.tag) {
          // 이모지 제외하고 텍스트만 번역
          const textOnly = slide.tag.replace(/[\u2600-\u26FF]|[\u2700-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
          if (textOnly) {
            const translated = await translateText(textOnly, 'ja');
            translatedSlide.tag = slide.tag.replace(textOnly, translated);
          }
        }
        
        return translatedSlide;
      }));

      translations = {
        en: { content: { slides: enSlides } },
        jp: { content: { slides: jpSlides } }
      };
    }

    let section;

    if (existingSection) {
      // 기존 섹션 업데이트
      section = await prisma.uISection.update({
        where: { id: existingSection.id },
        data: {
          content: content as any,
          visible: visible !== undefined ? visible : true,
          translations: autoTranslate ? translations as any : existingSection.translations
        }
      });
    } else {
      // 새 섹션 생성
      section = await prisma.uISection.create({
        data: {
          sectionId: 'hero',
          type: 'hero',
          title: 'Hero Section',
          subtitle: 'Main banner slides',
          content: content as any,
          visible: visible !== undefined ? visible : true,
          order: 1,
          translations: autoTranslate ? translations as any : {}
        }
      });
    }

    return NextResponse.json({ 
      section,
      success: true 
    });
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json({ 
      error: 'Failed to update hero section',
      success: false 
    }, { status: 500 });
  }
}