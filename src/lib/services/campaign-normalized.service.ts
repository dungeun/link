/**
 * 정규화된 캠페인 데이터 서비스
 * JSON 필드들을 정규화된 테이블로 관리하는 서비스
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface NormalizedCampaignData {
  id: string;
  hashtags: string[];
  platforms: { platform: string; isPrimary: boolean }[];
  images: {
    url: string;
    type: 'MAIN' | 'HEADER' | 'THUMBNAIL' | 'DETAIL' | 'PRODUCT';
    order: number;
    alt?: string;
    caption?: string;
  }[];
  keywords: { keyword: string; weight: number }[];
  questions: {
    question: string;
    type: 'TEXT' | 'MULTIPLE_CHOICE' | 'BOOLEAN' | 'NUMBER';
    required: boolean;
    options?: any;
    order: number;
  }[];
}

export class CampaignNormalizedService {
  /**
   * 캠페인과 함께 정규화된 데이터를 조회
   */
  static async getCampaignWithNormalizedData(campaignId: string): Promise<NormalizedCampaignData | null> {
    const result = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        campaignHashtags: {
          orderBy: { order: 'asc' }
        },
        campaignPlatforms: {
          orderBy: { isPrimary: 'desc' }
        },
        campaignImages: {
          orderBy: { order: 'asc' }
        },
        campaignKeywords: {
          orderBy: { weight: 'desc' }
        },
        campaignQuestions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!result) return null;

    return {
      id: result.id,
      hashtags: result.campaignHashtags.map(h => h.hashtag),
      platforms: result.campaignPlatforms.map(p => ({
        platform: p.platform,
        isPrimary: p.isPrimary
      })),
      images: result.campaignImages.map(img => ({
        url: img.imageUrl,
        type: img.type as any,
        order: img.order,
        alt: img.alt || undefined,
        caption: img.caption || undefined
      })),
      keywords: result.campaignKeywords.map(k => ({
        keyword: k.keyword,
        weight: k.weight
      })),
      questions: result.campaignQuestions.map(q => ({
        question: q.question,
        type: q.type as any,
        required: q.required,
        options: q.options,
        order: q.order
      }))
    };
  }

  /**
   * 캠페인 해시태그 업데이트
   */
  static async updateCampaignHashtags(campaignId: string, hashtags: string[]) {
    return await prisma.$transaction(async (tx) => {
      // 기존 해시태그 삭제
      await tx.campaignHashtag.deleteMany({
        where: { campaignId }
      });

      // 새 해시태그 추가
      if (hashtags.length > 0) {
        await tx.campaignHashtag.createMany({
          data: hashtags.map((hashtag, index) => ({
            campaignId,
            hashtag: hashtag.replace('#', ''),
            order: index
          }))
        });
      }
    });
  }

  /**
   * 캠페인 플랫폼 업데이트
   */
  static async updateCampaignPlatforms(
    campaignId: string, 
    platforms: { platform: string; isPrimary: boolean }[]
  ) {
    return await prisma.$transaction(async (tx) => {
      // 기존 플랫폼 삭제
      await tx.campaignPlatform.deleteMany({
        where: { campaignId }
      });

      // 새 플랫폼 추가
      if (platforms.length > 0) {
        await tx.campaignPlatform.createMany({
          data: platforms.map(p => ({
            campaignId,
            platform: p.platform,
            isPrimary: p.isPrimary
          }))
        });
      }
    });
  }

  /**
   * 캠페인 이미지 업데이트
   */
  static async updateCampaignImages(
    campaignId: string,
    images: {
      url: string;
      type: 'MAIN' | 'HEADER' | 'THUMBNAIL' | 'DETAIL' | 'PRODUCT';
      order: number;
      alt?: string;
      caption?: string;
    }[]
  ) {
    return await prisma.$transaction(async (tx) => {
      // 기존 이미지 삭제
      await tx.campaignImage.deleteMany({
        where: { campaignId }
      });

      // 새 이미지 추가
      if (images.length > 0) {
        await tx.campaignImage.createMany({
          data: images.map(img => ({
            campaignId,
            imageUrl: img.url,
            type: img.type,
            order: img.order,
            alt: img.alt,
            caption: img.caption
          }))
        });
      }
    });
  }

  /**
   * 캠페인 키워드 업데이트
   */
  static async updateCampaignKeywords(
    campaignId: string,
    keywords: { keyword: string; weight: number }[]
  ) {
    return await prisma.$transaction(async (tx) => {
      // 기존 키워드 삭제
      await tx.campaignKeyword.deleteMany({
        where: { campaignId }
      });

      // 새 키워드 추가
      if (keywords.length > 0) {
        await tx.campaignKeyword.createMany({
          data: keywords.map(k => ({
            campaignId,
            keyword: k.keyword,
            weight: k.weight
          }))
        });
      }
    });
  }

  /**
   * 캠페인 질문 업데이트
   */
  static async updateCampaignQuestions(
    campaignId: string,
    questions: {
      question: string;
      type: 'TEXT' | 'MULTIPLE_CHOICE' | 'BOOLEAN' | 'NUMBER';
      required: boolean;
      options?: any;
      order: number;
    }[]
  ) {
    return await prisma.$transaction(async (tx) => {
      // 기존 질문 삭제
      await tx.campaignQuestion.deleteMany({
        where: { campaignId }
      });

      // 새 질문 추가
      if (questions.length > 0) {
        await tx.campaignQuestion.createMany({
          data: questions.map(q => ({
            campaignId,
            question: q.question,
            type: q.type,
            required: q.required,
            options: q.options,
            order: q.order
          }))
        });
      }
    });
  }

  /**
   * JSON 데이터에서 정규화된 데이터로 마이그레이션
   */
  static async migrateFromJsonToNormalized(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) throw new Error('Campaign not found');

    await prisma.$transaction(async (tx) => {
      // 해시태그 마이그레이션
      if (campaign.hashtags) {
        try {
          const hashtags = Array.isArray(campaign.hashtags) 
            ? campaign.hashtags as string[]
            : JSON.parse(campaign.hashtags as string);
          
          if (Array.isArray(hashtags)) {
            await this.updateCampaignHashtags(campaignId, hashtags);
          }
        } catch (error) {
          console.warn(`Failed to migrate hashtags for campaign ${campaignId}:`, error);
        }
      }

      // 플랫폼 마이그레이션
      if (campaign.platforms) {
        try {
          const platforms = Array.isArray(campaign.platforms)
            ? campaign.platforms as string[]
            : JSON.parse(campaign.platforms as string);
          
          if (Array.isArray(platforms)) {
            const platformData = platforms.map(p => ({
              platform: p,
              isPrimary: p === campaign.platform
            }));
            await this.updateCampaignPlatforms(campaignId, platformData);
          }
        } catch (error) {
          console.warn(`Failed to migrate platforms for campaign ${campaignId}:`, error);
        }
      }

      // 이미지 마이그레이션
      const images: any[] = [];
      
      // 기본 이미지들
      if (campaign.imageUrl) {
        images.push({
          url: campaign.imageUrl,
          type: 'MAIN',
          order: 0
        });
      }
      if (campaign.headerImageUrl) {
        images.push({
          url: campaign.headerImageUrl,
          type: 'HEADER',
          order: 1
        });
      }
      if (campaign.thumbnailImageUrl) {
        images.push({
          url: campaign.thumbnailImageUrl,
          type: 'THUMBNAIL',
          order: 2
        });
      }

      // JSON 이미지들
      if (campaign.detailImages) {
        try {
          const detailImages = Array.isArray(campaign.detailImages)
            ? campaign.detailImages
            : JSON.parse(campaign.detailImages as string);
          
          detailImages.forEach((img: any, index: number) => {
            if (img.url) {
              images.push({
                url: img.url,
                type: 'DETAIL',
                order: images.length + index
              });
            }
          });
        } catch (error) {
          console.warn(`Failed to migrate detail images for campaign ${campaignId}:`, error);
        }
      }

      if (campaign.productImages) {
        try {
          const productImages = Array.isArray(campaign.productImages)
            ? campaign.productImages
            : JSON.parse(campaign.productImages as string);
          
          productImages.forEach((img: any, index: number) => {
            if (img.url) {
              images.push({
                url: img.url,
                type: 'PRODUCT',
                order: images.length + index
              });
            }
          });
        } catch (error) {
          console.warn(`Failed to migrate product images for campaign ${campaignId}:`, error);
        }
      }

      if (images.length > 0) {
        await this.updateCampaignImages(campaignId, images);
      }

      // 키워드 마이그레이션
      if (campaign.keywords) {
        const keywords = campaign.keywords.split(',').map((k, index) => ({
          keyword: k.trim(),
          weight: index + 1
        }));
        await this.updateCampaignKeywords(campaignId, keywords);
      }

      // 질문 마이그레이션
      if (campaign.questions) {
        try {
          const questions = Array.isArray(campaign.questions)
            ? campaign.questions
            : JSON.parse(campaign.questions as string);
          
          if (Array.isArray(questions)) {
            const questionData = questions.map((q: any, index: number) => ({
              question: q.question || q,
              type: q.type || 'TEXT',
              required: q.required || false,
              options: q.options,
              order: index
            }));
            await this.updateCampaignQuestions(campaignId, questionData);
          }
        } catch (error) {
          console.warn(`Failed to migrate questions for campaign ${campaignId}:`, error);
        }
      }
    });
  }

  /**
   * 해시태그로 캠페인 검색 (정규화된 테이블 사용)
   */
  static async searchByHashtags(hashtags: string[]) {
    return await prisma.campaign.findMany({
      where: {
        campaignHashtags: {
          some: {
            hashtag: {
              in: hashtags
            }
          }
        },
        deletedAt: null
      },
      include: {
        campaignHashtags: true,
        business: {
          select: {
            name: true,
            businessProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * 플랫폼별 캠페인 조회 (정규화된 테이블 사용)
   */
  static async getByPlatforms(platforms: string[]) {
    return await prisma.campaign.findMany({
      where: {
        campaignPlatforms: {
          some: {
            platform: {
              in: platforms
            }
          }
        },
        deletedAt: null
      },
      include: {
        campaignPlatforms: true,
        business: {
          select: {
            name: true,
            businessProfile: {
              select: {
                companyName: true
              }
            }
          }
        }
      }
    });
  }
}