import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import { 
  UISection as GlobalUISection, 
  UISectionContent, 
  LanguageCode, 
  isLanguageCode, 
  isJsonObject 
} from '@/types/global';

export interface UISection extends GlobalUISection {
  settings?: UISectionContent;
}

export class UISectionService {
  // 모든 표시 가능한 섹션 가져오기
  static async getVisibleSections(language: string = 'ko'): Promise<UISection[]> {
    try {
      const sections = await prisma.uISection.findMany({
        where: { visible: true },
        orderBy: { order: 'asc' }
      });

      // 언어에 따른 번역 적용
      return sections.map(section => {
        // 타입 안전한 content 처리
        let content: UISectionContent = {}
        if (section.content && isJsonObject(section.content)) {
          content = section.content
        }

        // 타입 안전한 translations 처리
        let translations: Record<LanguageCode, UISectionContent> = {} as Record<LanguageCode, UISectionContent>
        if (section.translations && isJsonObject(section.translations)) {
          Object.entries(section.translations).forEach(([lang, trans]) => {
            if (isLanguageCode(lang) && isJsonObject(trans)) {
              translations[lang] = trans
            }
          })
        }

        // 언어별 번역 적용
        if (isLanguageCode(language) && language !== 'ko' && translations[language]) {
          const langTranslations = translations[language]
          
          return {
            id: section.id,
            type: section.type as GlobalUISection['type'],
            sectionId: section.sectionId,
            title: section.title ? 
              (isJsonObject(section.title) ? section.title as Record<LanguageCode, string> : undefined) : 
              undefined,
            subtitle: section.subtitle ? 
              (isJsonObject(section.subtitle) ? section.subtitle as Record<LanguageCode, string> : undefined) : 
              undefined,
            content: { ...content, ...langTranslations },
            translations,
            visible: section.visible,
            order: section.order,
            settings: section.settings && isJsonObject(section.settings) ? section.settings : undefined
          }
        }
        
        return {
          id: section.id,
          type: section.type as GlobalUISection['type'],
          sectionId: section.sectionId,
          title: section.title ? 
            (isJsonObject(section.title) ? section.title as Record<LanguageCode, string> : undefined) : 
            undefined,
          subtitle: section.subtitle ? 
            (isJsonObject(section.subtitle) ? section.subtitle as Record<LanguageCode, string> : undefined) : 
            undefined,
          content,
          translations,
          visible: section.visible,
          order: section.order,
          settings: section.settings && isJsonObject(section.settings) ? section.settings : undefined
        }
      });
    } catch (error) {
      logger.error('Error fetching visible sections:', error);
      return [];
    }
  }

  // 특정 섹션 가져오기
  static async getSection(sectionId: string, language: string = 'ko'): Promise<UISection | null> {
    try {
      const section = await prisma.uISection.findUnique({
        where: { sectionId }
      });

      if (!section) return null;

      // 타입 안전한 content 처리
      let content: UISectionContent = {}
      if (section.content && isJsonObject(section.content)) {
        content = section.content
      }

      // 타입 안전한 translations 처리
      let translations: Record<LanguageCode, UISectionContent> = {} as Record<LanguageCode, UISectionContent>
      if (section.translations && isJsonObject(section.translations)) {
        Object.entries(section.translations).forEach(([lang, trans]) => {
          if (isLanguageCode(lang) && isJsonObject(trans)) {
            translations[lang] = trans
          }
        })
      }

      // 언어별 번역 적용
      if (isLanguageCode(language) && language !== 'ko' && translations[language]) {
        const langTranslations = translations[language]
        
        return {
          id: section.id,
          type: section.type as GlobalUISection['type'],
          sectionId: section.sectionId,
          title: section.title ? 
            (isJsonObject(section.title) ? section.title as Record<LanguageCode, string> : undefined) : 
            undefined,
          subtitle: section.subtitle ? 
            (isJsonObject(section.subtitle) ? section.subtitle as Record<LanguageCode, string> : undefined) : 
            undefined,
          content: { ...content, ...langTranslations },
          translations,
          visible: section.visible,
          order: section.order,
          settings: section.settings && isJsonObject(section.settings) ? section.settings : undefined
        }
      }

      return {
        id: section.id,
        type: section.type as GlobalUISection['type'],
        sectionId: section.sectionId,
        title: section.title ? 
          (isJsonObject(section.title) ? section.title as Record<LanguageCode, string> : undefined) : 
          undefined,
        subtitle: section.subtitle ? 
          (isJsonObject(section.subtitle) ? section.subtitle as Record<LanguageCode, string> : undefined) : 
          undefined,
        content,
        translations,
        visible: section.visible,
        order: section.order,
        settings: section.settings && isJsonObject(section.settings) ? section.settings : undefined
      }
    } catch (error) {
      logger.error(`Error fetching section ${sectionId}:`, error);
      return null;
    }
  }

  // 섹션 업데이트 (관리자용)
  static async updateSection(sectionId: string, data: Partial<UISection>): Promise<UISection | null> {
    try {
      const updated = await prisma.uISection.update({
        where: { sectionId },
        data
      });
      
      return updated;
    } catch (error) {
      logger.error(`Error updating section ${sectionId}:`, error);
      return null;
    }
  }

  // 섹션 순서 업데이트
  static async updateSectionOrder(orders: { sectionId: string; order: number }[]): Promise<boolean> {
    try {
      await prisma.$transaction(
        orders.map(({ sectionId, order }) =>
          prisma.uISection.update({
            where: { sectionId },
            data: { order }
          })
        )
      );
      
      return true;
    } catch (error) {
      logger.error('Error updating section orders:', error);
      return false;
    }
  }

  // 섹션 표시/숨김 토글
  static async toggleSectionVisibility(sectionId: string): Promise<UISection | null> {
    try {
      const section = await prisma.uISection.findUnique({
        where: { sectionId }
      });

      if (!section) return null;

      const updated = await prisma.uISection.update({
        where: { sectionId },
        data: { visible: !section.visible }
      });
      
      return updated;
    } catch (error) {
      logger.error(`Error toggling section visibility ${sectionId}:`, error);
      return null;
    }
  }
}