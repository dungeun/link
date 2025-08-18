const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCampaigns() {
  try {
    // 모든 캠페인 조회
    const allCampaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        businessId: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        categories: {
          select: {
            category: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('=== 현재 데이터베이스의 캠페인 ===');
    console.log(`총 캠페인 수: ${allCampaigns.length}개\n`);

    // 이미지가 있는 캠페인과 없는 캠페인 구분
    const withImage = allCampaigns.filter(c => c.imageUrl && c.imageUrl !== '');
    const withoutImage = allCampaigns.filter(c => !c.imageUrl || c.imageUrl === '');

    console.log(`📷 이미지 있는 캠페인: ${withImage.length}개`);
    console.log(`❌ 이미지 없는 캠페인: ${withoutImage.length}개\n`);

    // 카테고리별 통계
    const categoryStats = {};
    allCampaigns.forEach(campaign => {
      if (campaign.categories && campaign.categories.length > 0) {
        campaign.categories.forEach(cc => {
          const categoryName = cc.category.name;
          categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
        });
      } else {
        categoryStats['카테고리 없음'] = (categoryStats['카테고리 없음'] || 0) + 1;
      }
    });

    console.log('📊 카테고리별 캠페인 수:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}개`);
    });

    console.log('\n📋 캠페인 목록:');
    allCampaigns.forEach((campaign, index) => {
      const category = campaign.categories[0]?.category?.name || '카테고리 없음';
      const imageStatus = campaign.imageUrl ? '✅' : '❌';
      console.log(`${index + 1}. [${imageStatus}] ${campaign.title} (${category}) - ${campaign.status}`);
    });

    // 더미로 보이는 캠페인 찾기 (이미지 URL이 특정 패턴인 경우)
    const dummyCampaigns = allCampaigns.filter(c => {
      return c.imageUrl && (
        c.imageUrl.includes('unsplash.com') ||
        c.imageUrl.includes('placeholder') ||
        c.imageUrl.includes('default.jpg') ||
        c.imageUrl === '/images/campaigns/default.jpg'
      );
    });

    if (dummyCampaigns.length > 0) {
      console.log(`\n⚠️  더미로 보이는 캠페인: ${dummyCampaigns.length}개`);
      dummyCampaigns.forEach(campaign => {
        console.log(`  - ${campaign.title}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaigns();