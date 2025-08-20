import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleImages() {
  try {
    const campaignId = 'cmeijy8za0001bx3lhoi4b51y';
    
    console.log(`🖼️ 캠페인 ${campaignId}에 샘플 이미지 추가 중...`);
    
    // 샘플 이미지 데이터
    const productImages = [
      {
        id: 'sample-product-1',
        url: '/images/campaigns/moos-airfryer-01.png',
        filename: 'moos-airfryer-01.png',
        type: 'product'
      },
      {
        id: 'sample-product-2', 
        url: '/images/campaigns/moos-airfryer-02.png',
        filename: 'moos-airfryer-02.png',
        type: 'product'
      },
      {
        id: 'sample-product-3',
        url: '/images/campaigns/moos-airfryer-03.png',
        filename: 'moos-airfryer-03.png',
        type: 'product'
      }
    ];
    
    const detailImages = [
      {
        id: 'sample-detail-1',
        url: '/images/campaigns/moos-detail-01.png',
        filename: 'moos-detail-01.png',
        type: 'detail'
      },
      {
        id: 'sample-detail-2',
        url: '/images/campaigns/moos-detail-02.png',
        filename: 'moos-detail-02.png',
        type: 'detail'
      }
    ];
    
    // 캠페인 업데이트
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        productImages: productImages,
        detailImages: detailImages,
        headerImageUrl: '/images/campaigns/moos-header.png',
        thumbnailImageUrl: '/images/campaigns/moos-thumb.png',
        imageUrl: '/images/campaigns/moos-main.png'
      }
    });
    
    console.log('✅ 이미지 추가 완료!');
    console.log('  - productImages:', productImages.length, '개');
    console.log('  - detailImages:', detailImages.length, '개');
    
    // 업데이트 확인
    const verification = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        productImages: true,
        detailImages: true,
        headerImageUrl: true,
        thumbnailImageUrl: true,
        imageUrl: true
      }
    });
    
    console.log('\n📊 업데이트 확인:');
    console.log('  - productImages:', verification?.productImages ? '✅' : '❌');
    console.log('  - detailImages:', verification?.detailImages ? '✅' : '❌');
    console.log('  - headerImageUrl:', verification?.headerImageUrl || 'null');
    console.log('  - thumbnailImageUrl:', verification?.thumbnailImageUrl || 'null');
    console.log('  - imageUrl:', verification?.imageUrl || 'null');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleImages()
  .catch(console.error);