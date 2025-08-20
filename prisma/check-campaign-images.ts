import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCampaignImages() {
  try {
    const campaignId = 'cmeijy8za0001bx3lhoi4b51y';
    
    console.log(`🔍 캠페인 ${campaignId}의 이미지 데이터 확인 중...\n`);
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        headerImageUrl: true,
        thumbnailImageUrl: true,
        imageUrl: true,
        productImages: true,
        detailImages: true,
        status: true,
        platform: true
      }
    });

    if (!campaign) {
      console.log('❌ 캠페인을 찾을 수 없습니다.');
      return;
    }

    console.log('📊 캠페인 정보:');
    console.log('  - 제목:', campaign.title);
    console.log('  - 상태:', campaign.status);
    console.log('  - 플랫폼:', campaign.platform);
    console.log('\n📷 이미지 필드 상태:');
    console.log('  - headerImageUrl:', campaign.headerImageUrl || 'null');
    console.log('  - thumbnailImageUrl:', campaign.thumbnailImageUrl || 'null');
    console.log('  - imageUrl:', campaign.imageUrl || 'null');
    
    console.log('\n🖼️ productImages 분석:');
    if (campaign.productImages) {
      console.log('  - 타입:', typeof campaign.productImages);
      console.log('  - 원본 데이터:', JSON.stringify(campaign.productImages, null, 2));
      
      try {
        let images = campaign.productImages;
        if (typeof images === 'string') {
          images = JSON.parse(images);
        }
        
        if (Array.isArray(images)) {
          console.log('  - 배열 길이:', images.length);
          images.forEach((img: any, index: number) => {
            console.log(`    [${index}]:`, typeof img === 'string' ? img : JSON.stringify(img));
          });
        }
      } catch (error) {
        console.log('  - 파싱 오류:', error);
      }
    } else {
      console.log('  - productImages가 null입니다.');
    }
    
    console.log('\n📄 detailImages 분석:');
    if (campaign.detailImages) {
      console.log('  - 타입:', typeof campaign.detailImages);
      console.log('  - 원본 데이터:', JSON.stringify(campaign.detailImages, null, 2));
      
      try {
        let images = campaign.detailImages;
        if (typeof images === 'string') {
          images = JSON.parse(images);
        }
        
        if (Array.isArray(images)) {
          console.log('  - 배열 길이:', images.length);
          images.forEach((img: any, index: number) => {
            console.log(`    [${index}]:`, typeof img === 'string' ? img : JSON.stringify(img));
          });
        }
      } catch (error) {
        console.log('  - 파싱 오류:', error);
      }
    } else {
      console.log('  - detailImages가 null입니다.');
    }

    // 모든 캠페인의 이미지 보유 현황 확인
    console.log('\n📊 전체 캠페인 이미지 보유 현황:');
    const allCampaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        productImages: true,
        detailImages: true
      }
    });
    
    let withProductImages = 0;
    let withDetailImages = 0;
    
    allCampaigns.forEach(c => {
      if (c.productImages && c.productImages !== null) {
        let hasImages = false;
        try {
          const images = typeof c.productImages === 'string' ? JSON.parse(c.productImages) : c.productImages;
          hasImages = Array.isArray(images) && images.length > 0;
        } catch {
          hasImages = false;
        }
        if (hasImages) withProductImages++;
      }
      
      if (c.detailImages && c.detailImages !== null) {
        let hasImages = false;
        try {
          const images = typeof c.detailImages === 'string' ? JSON.parse(c.detailImages) : c.detailImages;
          hasImages = Array.isArray(images) && images.length > 0;
        } catch {
          hasImages = false;
        }
        if (hasImages) withDetailImages++;
      }
    });
    
    console.log(`  - 총 캠페인 수: ${allCampaigns.length}`);
    console.log(`  - productImages 보유: ${withProductImages}개`);
    console.log(`  - detailImages 보유: ${withDetailImages}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignImages()
  .catch(console.error);