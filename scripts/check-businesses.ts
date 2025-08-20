import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    // 전체 업체 목록 조회
    const businesses = await prisma.business.findMany({
      include: {
        businessProfile: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    });

    console.log(`=== 총 ${businesses.length}개의 업체가 있습니다 ===\n`);

    if (businesses.length === 0) {
      console.log('업체가 없습니다. 먼저 업체를 생성해야 합니다.');
      
      // 첫 번째 캠페인의 business 정보 확인
      const campaign = await prisma.campaign.findFirst({
        include: {
          business: true
        }
      });
      
      if (campaign && campaign.business) {
        console.log('\n캠페인에 연결된 업체 발견:');
        console.log(`- ID: ${campaign.business.id}`);
        console.log(`- Name: ${campaign.business.name}`);
        console.log(`- Email: ${campaign.business.email}`);
      }
    } else {
      businesses.forEach((b, index) => {
        console.log(`${index + 1}. ${b.name} (${b.email})`);
        console.log(`   ID: ${b.id}`);
        if (b.businessProfile) {
          console.log(`   회사명: ${b.businessProfile.companyName}`);
          console.log(`   사업자번호: ${b.businessProfile.businessNumber}`);
        }
        console.log(`   캠페인 수: ${b._count.campaigns}개\n`);
      });
    }

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses()
  .catch(console.error);