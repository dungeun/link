import { PrismaClient } from '@prisma/client';
import { list } from '@vercel/blob';

const prisma = new PrismaClient();

// Vercel Blob Storage의 모든 이미지 URL들
const BLOB_IMAGES = [
  "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608438981_8blcb9rw.webp",
  "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608428102_3rgybba4.jpg",
  "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755608416856_efvkryio.jpg",
  "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755594417293_af7qyutl.jpg",
  "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755566647934_obbvv7u8.jpg",
  "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755565880204_mnljxu2n.png",
  "https://i3otdokfzvapv5df.public.blob.vercel-storage.com/campaign/1755565892414_e4ozed7f.png"
];

async function getMoreBlobImages() {
  try {
    const response = await list({
      prefix: 'campaign/',
      limit: 100
    });
    
    const additionalImages = response.blobs
      .map(blob => blob.url)
      .filter(url => !BLOB_IMAGES.includes(url));
    
    return [...BLOB_IMAGES, ...additionalImages];
  } catch (error) {
    console.log('⚠️ Vercel Blob API 접근 실패, 기본 이미지 목록 사용');
    return BLOB_IMAGES;
  }
}

async function updateAllCampaigns() {
  try {
    const allImages = await getMoreBlobImages();
    console.log(`🔍 총 ${allImages.length}개의 Blob Storage 이미지 발견\n`);
    
    // 모든 캠페인 조회
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        productImages: true,
        detailImages: true
      }
    });
    
    console.log(`📊 총 ${campaigns.length}개의 캠페인 발견\n`);
    
    let imageIndex = 0;
    
    for (const campaign of campaigns) {
      // 각 캠페인마다 다른 이미지 할당
      const productImageCount = Math.floor(Math.random() * 3) + 2; // 2-4개
      const detailImageCount = Math.floor(Math.random() * 2) + 2; // 2-3개
      
      const productImages: string[] = [];
      const detailImages: string[] = [];
      
      // productImages 할당
      for (let i = 0; i < productImageCount; i++) {
        productImages.push(allImages[imageIndex % allImages.length]);
        imageIndex++;
      }
      
      // detailImages 할당
      for (let i = 0; i < detailImageCount; i++) {
        detailImages.push(allImages[imageIndex % allImages.length]);
        imageIndex++;
      }
      
      // 캠페인 업데이트
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          productImages: JSON.stringify(productImages),
          detailImages: JSON.stringify(detailImages)
        }
      });
      
      console.log(`✅ 캠페인 업데이트: ${campaign.title}`);
      console.log(`   - productImages: ${productImageCount}개`);
      console.log(`   - detailImages: ${detailImageCount}개\n`);
    }
    
    console.log('🎉 모든 캠페인 이미지 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllCampaigns()
  .catch(console.error);