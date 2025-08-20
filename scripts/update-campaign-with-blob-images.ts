import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCampaignWithBlobImages() {
  try {
    const campaignId = 'cmeijy8za0001bx3lhoi4b51y';
    
    console.log(`🖼️ 캠페인 ${campaignId}에 Vercel Blob Storage 이미지 추가 중...`);
    
    // Vercel Blob Storage의 실제 이미지 URL들
    // 가장 최근에 업로드된 이미지들을 사용
    const productImages = [
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608438981_8blcb9rw.webp",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608428102_3rgybba4.jpg",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608416856_efvkryio.jpg"
    ];
    
    const detailImages = [
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755594417293_af7qyutl.jpg",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755566647934_obbvv7u8.jpg"
    ];
    
    // 캠페인 업데이트
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        productImages: productImages,
        detailImages: detailImages,
        headerImageUrl: "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755565892414_e4ozed7f.png",
        thumbnailImageUrl: "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755565880204_mnljxu2n.png",
        imageUrl: "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755565976614_sladjcok.jpg"
      }
    });
    
    console.log('✅ 이미지 업데이트 완료!');
    console.log('  - productImages:', productImages.length, '개');
    console.log('  - detailImages:', detailImages.length, '개');
    
    // 업데이트 확인
    const verification = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        title: true,
        productImages: true,
        detailImages: true,
        headerImageUrl: true,
        thumbnailImageUrl: true,
        imageUrl: true
      }
    });
    
    console.log('\n📊 업데이트된 캠페인 정보:');
    console.log('  - 제목:', verification?.title);
    console.log('  - productImages:', verification?.productImages ? '✅' : '❌');
    console.log('  - detailImages:', verification?.detailImages ? '✅' : '❌');
    console.log('  - headerImageUrl:', verification?.headerImageUrl ? '✅' : '❌');
    console.log('  - thumbnailImageUrl:', verification?.thumbnailImageUrl ? '✅' : '❌');
    console.log('  - imageUrl:', verification?.imageUrl ? '✅' : '❌');
    
    console.log('\n🌐 실제 이미지 URL들:');
    console.log('productImages:', JSON.stringify(verification?.productImages, null, 2));
    console.log('detailImages:', JSON.stringify(verification?.detailImages, null, 2));
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaignWithBlobImages()
  .catch(console.error);