const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteHospitalCampaigns() {
  try {
    console.log('병원 카테고리 캠페인 삭제 시작...');
    
    // 병원 카테고리 찾기
    const hospitalCategory = await prisma.category.findFirst({
      where: { slug: 'hospital' }
    });

    if (!hospitalCategory) {
      console.log('병원 카테고리를 찾을 수 없습니다.');
      return;
    }

    // 병원 카테고리의 이미지 없는 캠페인 찾기
    const hospitalCampaigns = await prisma.campaign.findMany({
      where: {
        categories: {
          some: {
            categoryId: hospitalCategory.id
          }
        },
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      },
      select: {
        id: true,
        title: true
      }
    });

    console.log(`\n삭제할 병원 캠페인 ${hospitalCampaigns.length}개:`);
    hospitalCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.title}`);
    });

    if (hospitalCampaigns.length > 0) {
      // 캠페인 카테고리 관계 먼저 삭제
      await prisma.campaignCategory.deleteMany({
        where: {
          campaignId: {
            in: hospitalCampaigns.map(c => c.id)
          }
        }
      });
      console.log('✅ 캠페인-카테고리 관계 삭제 완료');

      // 캠페인 삭제
      const deleteResult = await prisma.campaign.deleteMany({
        where: {
          id: {
            in: hospitalCampaigns.map(c => c.id)
          }
        }
      });
      
      console.log(`✅ ${deleteResult.count}개의 병원 캠페인이 삭제되었습니다.`);
    }

    // ipTIME 캠페인 확인
    const remainingCampaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        status: true,
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
      }
    });

    console.log(`\n✅ 남은 캠페인: ${remainingCampaigns.length}개`);
    remainingCampaigns.forEach(campaign => {
      const category = campaign.categories[0]?.category?.name || '카테고리 없음';
      console.log(`  - ${campaign.title} (${category}) - ${campaign.status}`);
    });

  } catch (error) {
    console.error('캠페인 삭제 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteHospitalCampaigns();