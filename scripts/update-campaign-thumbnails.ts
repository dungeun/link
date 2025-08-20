import { PrismaClient } from '@prisma/client';
import { list } from '@vercel/blob';

const prisma = new PrismaClient();

async function getAllBlobImages() {
  try {
    const response = await list({
      prefix: 'campaign/',
      limit: 1000
    });
    
    console.log(`📦 Vercel Blob Storage에서 ${response.blobs.length}개의 파일 발견`);
    
    // 이미지 파일만 필터링
    const imageUrls = response.blobs
      .filter(blob => {
        const ext = blob.pathname.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
      })
      .map(blob => blob.url);
    
    console.log(`🖼️ 이미지 파일 ${imageUrls.length}개 발견\n`);
    return imageUrls;
    
  } catch (error) {
    console.error('❌ Blob Storage 접근 실패:', error);
    // 폴백 이미지 목록
    return [
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608438981_8blcb9rw.webp",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608428102_3rgybba4.jpg",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608416856_efvkryio.jpg",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755594417293_af7qyutl.jpg",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755566647934_obbvv7u8.jpg",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755565880204_mnljxu2n.png",
      "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755565892414_e4ozed7f.png"
    ];
  }
}

async function updateCampaignThumbnails() {
  try {
    const imageUrls = await getAllBlobImages();
    
    if (imageUrls.length === 0) {
      console.error('❌ 사용 가능한 이미지가 없습니다.');
      return;
    }
    
    // 모든 캠페인 조회
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        headerImageUrl: true,
        thumbnailImageUrl: true
      }
    });
    
    console.log(`📊 총 ${campaigns.length}개의 캠페인 발견\n`);
    
    // 각 캠페인마다 고유한 썸네일 할당
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      
      // 각 캠페인마다 다른 이미지 인덱스 사용
      const imageIndex = i % imageUrls.length;
      const headerIndex = (i + 1) % imageUrls.length;
      const thumbnailIndex = (i + 2) % imageUrls.length;
      
      const updateData: any = {};
      
      // imageUrl 업데이트 (메인 이미지)
      updateData.imageUrl = imageUrls[imageIndex];
      
      // headerImageUrl 업데이트 (헤더 이미지)
      updateData.headerImageUrl = imageUrls[headerIndex];
      
      // thumbnailImageUrl 업데이트 (썸네일 이미지)
      updateData.thumbnailImageUrl = imageUrls[thumbnailIndex];
      
      // 캠페인 업데이트
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: updateData
      });
      
      console.log(`✅ 캠페인 썸네일 업데이트: ${campaign.title}`);
      console.log(`   - 메인 이미지: ${imageUrls[imageIndex].split('/').pop()}`);
      console.log(`   - 헤더 이미지: ${imageUrls[headerIndex].split('/').pop()}`);
      console.log(`   - 썸네일: ${imageUrls[thumbnailIndex].split('/').pop()}\n`);
    }
    
    console.log('🎉 모든 캠페인 썸네일 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaignThumbnails()
  .catch(console.error);