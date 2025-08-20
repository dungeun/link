import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllImages() {
  try {
    console.log('🔍 productImages를 가진 캠페인 확인 중...\n');
    
    const campaignsWithImages = await prisma.campaign.findMany({
      where: {
        productImages: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        productImages: true,
        status: true
      }
    });

    console.log(`총 ${campaignsWithImages.length}개의 캠페인이 productImages를 가지고 있습니다.\n`);

    campaignsWithImages.forEach(campaign => {
      console.log(`📦 캠페인: ${campaign.title}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   상태: ${campaign.status}`);
      
      try {
        let images = campaign.productImages;
        if (typeof images === 'string') {
          images = JSON.parse(images);
        }
        
        if (Array.isArray(images)) {
          console.log(`   이미지 개수: ${images.length}개`);
          if (images.length > 0) {
            const firstImage = images[0];
            console.log(`   첫 번째 이미지 샘플:`, 
              typeof firstImage === 'string' 
                ? firstImage.substring(0, 80) + '...' 
                : JSON.stringify(firstImage).substring(0, 80) + '...'
            );
          }
        }
      } catch (error) {
        console.log(`   파싱 오류:`, error);
      }
      console.log('');
    });

    // 실제 업로드된 이미지를 가진 캠페인 찾기
    console.log('\n🔍 실제 업로드된 이미지를 가진 캠페인 찾기...\n');
    
    let realUploadCount = 0;
    campaignsWithImages.forEach(campaign => {
      try {
        let images = campaign.productImages;
        if (typeof images === 'string') {
          images = JSON.parse(images);
        }
        
        if (Array.isArray(images)) {
          const hasRealUpload = images.some((img: any) => {
            const url = typeof img === 'string' ? img : (img?.url || img?.imageUrl);
            return url && !url.includes('unsplash') && !url.includes('picsum') && 
                   (url.startsWith('/uploads') || url.includes('supabase'));
          });
          
          if (hasRealUpload) {
            realUploadCount++;
            console.log(`✅ ${campaign.title} - 실제 업로드 이미지 있음`);
            console.log(`   ID: ${campaign.id}`);
          }
        }
      } catch (error) {
        // 무시
      }
    });
    
    console.log(`\n📊 결과: ${realUploadCount}개의 캠페인이 실제 업로드된 이미지를 가지고 있습니다.`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllImages()
  .catch(console.error);