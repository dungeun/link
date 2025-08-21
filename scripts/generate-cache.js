/**
 * 캐시 생성 스크립트 (JavaScript 버전)
 */

const fs = require('fs').promises;
const path = require('path');

// DATABASE_URL 환경 변수 확인 (Prisma Client 로드 전에 체크)
const hasDatabaseUrl = !!process.env.DATABASE_URL;

let prisma = null;
if (hasDatabaseUrl) {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} else {
  console.log('⚠️  DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  console.log('🔄 캐시 생성을 건너뛰고 빈 캐시 파일을 생성합니다.');
}

async function generateCampaignCache() {
  const startTime = Date.now();
  console.log('📦 캠페인 캐시 생성 중...');

  // DATABASE_URL이 없는 경우 빈 캐시 파일 생성
  if (!prisma) {
    try {
      const CACHE_DIR = path.join(process.cwd(), 'public/cache');
      await fs.mkdir(CACHE_DIR, { recursive: true });

      const emptyCache = {
        featured: [],
        all: [],
        byCategory: {},
        total: 0,
        generatedAt: new Date().toISOString(),
        error: 'DATABASE_URL not configured'
      };

      await fs.writeFile(
        path.join(CACHE_DIR, 'campaigns.json'),
        JSON.stringify(emptyCache, null, 2)
      );

      console.log('✅ 빈 캐시 파일이 생성되었습니다.');
      return;
    } catch (error) {
      console.error('❌ 빈 캐시 파일 생성 실패:', error);
      throw error;
    }
  }

  try {
    const CACHE_DIR = path.join(process.cwd(), 'public/cache');
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // 활성 캠페인 조회
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
        rewardAmount: true,
        budget: true,
        platform: true,
        hashtags: true,
        endDate: true,
        maxApplicants: true,
        createdAt: true,
        business: {
          select: {
            id: true,
            name: true,
            businessProfile: {
              select: {
                companyName: true
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
      orderBy: { createdAt: 'desc' }
    });

    // 캠페인 데이터 변환
    const transformedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      thumbnailUrl: campaign.thumbnailImageUrl,
      reward: campaign.rewardAmount,
      budget: campaign.budget,
      platforms: Array.isArray(campaign.platform) ? campaign.platform : [campaign.platform],
      hashtags: campaign.hashtags || [],
      deadline: campaign.endDate,
      maxApplicants: campaign.maxApplicants,
      createdAt: campaign.createdAt,
      business: {
        id: campaign.business.id,
        name: campaign.business.name,
        companyName: campaign.business.businessProfile?.companyName
      },
      category: campaign.categories.find(c => c.isPrimary)?.category?.name || '',
      stats: {
        applications: campaign._count.applications
      }
    }));

    // 카테고리별 그룹화
    const byCategory = {};
    transformedCampaigns.forEach(campaign => {
      if (campaign.category) {
        if (!byCategory[campaign.category]) {
          byCategory[campaign.category] = [];
        }
        byCategory[campaign.category].push(campaign);
      }
    });

    // 그룹화된 데이터
    const processedCampaigns = {
      featured: transformedCampaigns.slice(0, 20),
      all: transformedCampaigns,
      byCategory: byCategory,
      total: transformedCampaigns.length,
      generatedAt: new Date().toISOString()
    };

    // JSON 파일 저장
    await fs.writeFile(
      path.join(CACHE_DIR, 'campaigns.json'),
      JSON.stringify(processedCampaigns, null, 2)
    );

    const duration = Date.now() - startTime;
    console.log(`✅ 캠페인 캐시 생성 완료: ${campaigns.length}개 캠페인, ${duration}ms`);
    console.log(`📁 저장 위치: ${path.join(CACHE_DIR, 'campaigns.json')}`);

  } catch (error) {
    console.error('❌ 캠페인 캐시 생성 실패:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 캐시 생성 시작...\n');
  
  try {
    await generateCampaignCache();
    console.log('\n✨ 캐시 생성 완료!');
  } catch (error) {
    console.error('❌ 캐시 생성 실패:', error);
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

main();