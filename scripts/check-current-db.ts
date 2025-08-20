import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentDB() {
  try {
    const campaignId = 'cmeijy8za0001bx3lhoi4b51y';
    
    console.log(`🔍 캠페인 ${campaignId}의 현재 DB 상태 확인...\n`);
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        productImages: true,
        detailImages: true,
        imageUrl: true,
        headerImageUrl: true,
        thumbnailImageUrl: true
      }
    });

    if (!campaign) {
      console.log('❌ 캠페인을 찾을 수 없습니다.');
      return;
    }

    console.log('📊 캠페인 데이터:');
    console.log('  ID:', campaign.id);
    console.log('  제목:', campaign.title);
    console.log('\n📷 이미지 URL들:');
    console.log('  imageUrl:', campaign.imageUrl);
    console.log('  headerImageUrl:', campaign.headerImageUrl);
    console.log('  thumbnailImageUrl:', campaign.thumbnailImageUrl);
    
    console.log('\n🖼️ productImages:');
    console.log('  타입:', typeof campaign.productImages);
    console.log('  값:', JSON.stringify(campaign.productImages, null, 2));
    
    console.log('\n📄 detailImages:');
    console.log('  타입:', typeof campaign.detailImages);
    console.log('  값:', JSON.stringify(campaign.detailImages, null, 2));

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentDB()
  .catch(console.error);