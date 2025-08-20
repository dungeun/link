/**
 * JSON 파일 기반 캐싱 전략
 * - 빌드 타임 정적 생성
 * - 런타임 동적 업데이트
 * - 캠페인 우선 최적화
 */

import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';

// 캐시 디렉토리 설정
const CACHE_DIR = path.join(process.cwd(), 'public/cache');
const STATIC_CACHE_DIR = path.join(process.cwd(), 'src/cache/static');

interface CacheMetadata {
  version: string;
  generatedAt: string;
  ttl: number;
  size: number;
  checksum?: string;
}

export class JsonCacheStrategy {
  private static instance: JsonCacheStrategy;
  
  static getInstance(): JsonCacheStrategy {
    if (!this.instance) {
      this.instance = new JsonCacheStrategy();
    }
    return this.instance;
  }

  /**
   * 캠페인 JSON 캐시 생성 (최우선)
   */
  async generateCampaignCache(): Promise<void> {
    const startTime = Date.now();
    logger.info('🔄 캠페인 JSON 캐시 생성 시작...');

    try {
      // 디렉토리 생성
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.mkdir(STATIC_CACHE_DIR, { recursive: true });

      // 1. 활성 캠페인 조회 (최적화된 쿼리)
      const campaigns = await prisma.campaign.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
          endDate: { gte: new Date() }
        },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailImageUrl: true,
          headerImageUrl: true,
          rewardAmount: true,
          budget: true,
          targetFollowers: true,
          platform: true,
          hashtags: true,
          endDate: true,
          maxApplicants: true,
          createdAt: true,
          // 최소한의 관계 데이터만
          business: {
            select: {
              id: true,
              name: true,
              businessProfile: {
                select: {
                  companyName: true,
                  businessCategory: true
                }
              }
            }
          },
          categories: {
            select: {
              isPrimary: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { applications: { _count: 'desc' } }
        ]
      });

      // 2. 캠페인 데이터 변환 및 그룹화
      const processedCampaigns = {
        // 메인 페이지용 (상위 20개)
        featured: campaigns.slice(0, 20).map(this.transformCampaign),
        
        // 카테고리별
        byCategory: this.groupByCategory(campaigns),
        
        // 플랫폼별
        byPlatform: this.groupByPlatform(campaigns),
        
        // 인기순 (지원자 많은 순)
        popular: campaigns
          .sort((a, b) => b._count.applications - a._count.applications)
          .slice(0, 10)
          .map(this.transformCampaign),
        
        // 마감 임박 (7일 이내)
        urgent: campaigns
          .filter(c => {
            const daysLeft = Math.ceil(
              (new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return daysLeft <= 7 && daysLeft > 0;
          })
          .slice(0, 10)
          .map(this.transformCampaign),
        
        // 전체 리스트 (페이지네이션용)
        all: campaigns.map(this.transformCampaign)
      };

      // 3. 메타데이터 생성
      const metadata: CacheMetadata = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        ttl: 60, // 1분
        size: JSON.stringify(processedCampaigns).length
      };

      // 4. JSON 파일 저장
      // 공개 캐시 (CDN 배포 가능)
      await fs.writeFile(
        path.join(CACHE_DIR, 'campaigns.json'),
        JSON.stringify(processedCampaigns)
      );
      
      await fs.writeFile(
        path.join(CACHE_DIR, 'campaigns-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      // 정적 import용 (빌드 타임)
      await fs.writeFile(
        path.join(STATIC_CACHE_DIR, 'campaigns.ts'),
        `// Auto-generated at ${new Date().toISOString()}
export const cachedCampaigns = ${JSON.stringify(processedCampaigns, null, 2)};
export const cacheMetadata = ${JSON.stringify(metadata, null, 2)};`
      );

      const duration = Date.now() - startTime;
      logger.info(`✅ 캠페인 캐시 생성 완료: ${campaigns.length}개 캠페인, ${duration}ms`);

      // 5. 추가 최적화 - 개별 캠페인 캐시
      await this.generateIndividualCampaignCache(campaigns);

    } catch (error) {
      logger.error(`❌ 캠페인 캐시 생성 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 개별 캠페인 캐시 생성
   */
  private async generateIndividualCampaignCache(campaigns: any[]): Promise<void> {
    const campaignDir = path.join(CACHE_DIR, 'campaigns');
    await fs.mkdir(campaignDir, { recursive: true });

    // 병렬 처리로 빠르게 생성
    await Promise.all(
      campaigns.map(async (campaign) => {
        const transformed = this.transformCampaign(campaign);
        await fs.writeFile(
          path.join(campaignDir, `${campaign.id}.json`),
          JSON.stringify(transformed)
        );
      })
    );
  }

  /**
   * 캠페인 데이터 변환
   */
  private transformCampaign(campaign: any): any {
    return {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      thumbnailUrl: campaign.thumbnailImageUrl,
      headerUrl: campaign.headerImageUrl,
      reward: campaign.rewardAmount,
      budget: campaign.budget,
      targetFollowers: campaign.targetFollowers,
      platforms: Array.isArray(campaign.platform) ? campaign.platform : [campaign.platform],
      hashtags: campaign.hashtags || [],
      deadline: campaign.endDate,
      maxApplicants: campaign.maxApplicants,
      createdAt: campaign.createdAt,
      business: {
        id: campaign.business.id,
        name: campaign.business.name,
        companyName: campaign.business.businessProfile?.companyName,
        category: campaign.business.businessProfile?.businessCategory
      },
      category: campaign.categories.find((c: any) => c.isPrimary)?.category || null,
      stats: {
        applications: campaign._count.applications
      }
    };
  }

  /**
   * 카테고리별 그룹화
   */
  private groupByCategory(campaigns: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    campaigns.forEach(campaign => {
      const primaryCategory = campaign.categories.find((c: any) => c.isPrimary);
      if (primaryCategory) {
        const categoryName = primaryCategory.category.name;
        if (!grouped[categoryName]) {
          grouped[categoryName] = [];
        }
        grouped[categoryName].push(this.transformCampaign(campaign));
      }
    });
    
    return grouped;
  }

  /**
   * 플랫폼별 그룹화
   */
  private groupByPlatform(campaigns: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    campaigns.forEach(campaign => {
      const platforms = Array.isArray(campaign.platform) 
        ? campaign.platform 
        : [campaign.platform];
        
      platforms.forEach((platform: string) => {
        if (!grouped[platform]) {
          grouped[platform] = [];
        }
        grouped[platform].push(this.transformCampaign(campaign));
      });
    });
    
    return grouped;
  }

  /**
   * 캐시 유효성 검사
   */
  async isCacheValid(cacheFile: string, ttlSeconds: number = 60): Promise<boolean> {
    try {
      const metadataPath = cacheFile.replace('.json', '-metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: CacheMetadata = JSON.parse(metadataContent);
      
      const age = Date.now() - new Date(metadata.generatedAt).getTime();
      const maxAge = ttlSeconds * 1000;
      
      return age < maxAge;
    } catch {
      return false;
    }
  }

  /**
   * 캐시 읽기 (유효성 검사 포함)
   */
  async readCache<T>(filename: string): Promise<T | null> {
    const filePath = path.join(CACHE_DIR, filename);
    
    try {
      // 유효성 검사
      if (!await this.isCacheValid(filePath)) {
        logger.info(`Cache expired: ${filename}`);
        return null;
      }
      
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
      
    } catch (error) {
      logger.error(`Failed to read cache ${filename}: ${error}`);
      return null;
    }
  }

  /**
   * 증분 업데이트 (신규 캠페인만)
   */
  async incrementalUpdate(newCampaignId: string): Promise<void> {
    try {
      // 기존 캐시 읽기
      const existing = await this.readCache<any>('campaigns.json');
      if (!existing) {
        // 캐시가 없으면 전체 재생성
        await this.generateCampaignCache();
        return;
      }

      // 신규 캠페인 조회
      const newCampaign = await prisma.campaign.findUnique({
        where: { id: newCampaignId },
        select: {
          // ... 동일한 select 구조
        }
      });

      if (newCampaign) {
        // 기존 캐시에 추가
        const transformed = this.transformCampaign(newCampaign);
        existing.all.unshift(transformed);
        existing.featured = existing.all.slice(0, 20);
        
        // 저장
        await fs.writeFile(
          path.join(CACHE_DIR, 'campaigns.json'),
          JSON.stringify(existing)
        );
        
        logger.info(`✅ 캠페인 캐시 증분 업데이트 완료: ${newCampaignId}`);
      }
      
    } catch (error) {
      logger.error(`증분 업데이트 실패: ${error}`);
      // 실패 시 전체 재생성
      await this.generateCampaignCache();
    }
  }
}

// 싱글톤 인스턴스
export const jsonCache = JsonCacheStrategy.getInstance();