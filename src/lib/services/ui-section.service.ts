import prisma from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

export interface UISection {
  id: string;
  sectionId: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  content?: any;
  order: number;
  visible: boolean;
  translations?: any;
  settings?: any;
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
        if (language !== 'ko' && section.translations) {
          const translations = section.translations as any;
          const langTranslations = translations[language];
          
          if (langTranslations) {
            return {
              ...section,
              title: langTranslations.title || section.title,
              subtitle: langTranslations.subtitle || section.subtitle,
              content: {
                ...section.content,
                ...langTranslations
              }
            };
          }
        }
        
        return section;
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

      // 언어에 따른 번역 적용
      if (language !== 'ko' && section.translations) {
        const translations = section.translations as any;
        const langTranslations = translations[language];
        
        if (langTranslations) {
          return {
            ...section,
            title: langTranslations.title || section.title,
            subtitle: langTranslations.subtitle || section.subtitle,
            content: {
              ...section.content,
              ...langTranslations
            }
          };
        }
      }

      return section;
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