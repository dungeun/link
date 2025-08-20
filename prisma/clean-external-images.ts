import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanExternalImages() {
  try {
    console.log('🧹 외부 이미지 URL 정리 시작...');

    // 모든 캠페인 조회
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        headerImageUrl: true,
        thumbnailImageUrl: true,
        imageUrl: true,
        productImages: true,
        detailImages: true
      }
    });

    console.log(`총 ${campaigns.length}개의 캠페인을 확인합니다.`);

    let updatedCount = 0;

    for (const campaign of campaigns) {
      const updateData: any = {};
      let needsUpdate = false;

      // 외부 URL 패턴 (Unsplash, Picsum, Lorem Picsum 등)
      const isExternalUrl = (url: string | null | undefined): boolean => {
        if (!url || typeof url !== 'string') return false;
        return (
          url.includes('unsplash.com') ||
          url.includes('picsum.photos') ||
          url.includes('lorem.picsum') ||
          url.includes('placeholder') ||
          url.includes('via.placeholder') ||
          url.includes('placehold.it') ||
          url.includes('dummyimage.com') ||
          url.includes('loremflickr.com') ||
          url.includes('placekitten.com') ||
          (url.startsWith('http') && !url.includes(process.env.NEXT_PUBLIC_SITE_URL || 'localhost'))
        );
      };

      // headerImageUrl 확인 및 제거
      if (isExternalUrl(campaign.headerImageUrl)) {
        updateData.headerImageUrl = null;
        needsUpdate = true;
        console.log(`  - ${campaign.title}: headerImageUrl 제거`);
      }

      // thumbnailImageUrl 확인 및 제거
      if (isExternalUrl(campaign.thumbnailImageUrl)) {
        updateData.thumbnailImageUrl = null;
        needsUpdate = true;
        console.log(`  - ${campaign.title}: thumbnailImageUrl 제거`);
      }

      // imageUrl 확인 및 제거
      if (isExternalUrl(campaign.imageUrl)) {
        updateData.imageUrl = null;
        needsUpdate = true;
        console.log(`  - ${campaign.title}: imageUrl 제거`);
      }

      // productImages 처리 (JSON 필드)
      if (campaign.productImages) {
        let productImages: any = campaign.productImages;
        let filteredImages: any[] = [];

        try {
          // JSON 파싱 시도
          if (typeof productImages === 'string') {
            productImages = JSON.parse(productImages);
          }

          if (Array.isArray(productImages)) {
            // 배열인 경우 외부 URL 필터링
            filteredImages = productImages.filter((img: any) => {
              if (typeof img === 'string') {
                return !isExternalUrl(img);
              } else if (img && typeof img === 'object' && img.url) {
                return !isExternalUrl(img.url);
              }
              return false;
            });

            if (filteredImages.length !== productImages.length) {
              updateData.productImages = filteredImages.length > 0 ? filteredImages : null;
              needsUpdate = true;
              console.log(`  - ${campaign.title}: productImages 필터링 (${productImages.length} → ${filteredImages.length})`);
            }
          }
        } catch (error) {
          console.error(`    productImages 파싱 실패:`, error);
          // 파싱 실패시 null로 설정
          updateData.productImages = null;
          needsUpdate = true;
        }
      }

      // detailImages 처리 (JSON 필드)
      if (campaign.detailImages) {
        let detailImages: any = campaign.detailImages;
        let filteredImages: any[] = [];

        try {
          // JSON 파싱 시도
          if (typeof detailImages === 'string') {
            detailImages = JSON.parse(detailImages);
          }

          if (Array.isArray(detailImages)) {
            // 배열인 경우 외부 URL 필터링
            filteredImages = detailImages.filter((img: any) => {
              if (typeof img === 'string') {
                return !isExternalUrl(img);
              } else if (img && typeof img === 'object' && img.url) {
                return !isExternalUrl(img.url);
              }
              return false;
            });

            if (filteredImages.length !== detailImages.length) {
              updateData.detailImages = filteredImages.length > 0 ? filteredImages : null;
              needsUpdate = true;
              console.log(`  - ${campaign.title}: detailImages 필터링 (${detailImages.length} → ${filteredImages.length})`);
            }
          }
        } catch (error) {
          console.error(`    detailImages 파싱 실패:`, error);
          // 파싱 실패시 null로 설정
          updateData.detailImages = null;
          needsUpdate = true;
        }
      }

      // 업데이트가 필요한 경우만 DB 업데이트
      if (needsUpdate) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: updateData
        });
        updatedCount++;
        console.log(`✅ ${campaign.title} 업데이트 완료`);
      }
    }

    console.log(`\n🎉 완료! 총 ${updatedCount}개의 캠페인이 업데이트되었습니다.`);

    // 통계 출력
    const updatedCampaigns = await prisma.campaign.findMany({
      select: {
        headerImageUrl: true,
        thumbnailImageUrl: true,
        imageUrl: true,
        productImages: true,
        detailImages: true
      }
    });

    let stats = {
      withHeaderImage: 0,
      withThumbnailImage: 0,
      withImage: 0,
      withProductImages: 0,
      withDetailImages: 0
    };

    updatedCampaigns.forEach(c => {
      if (c.headerImageUrl) stats.withHeaderImage++;
      if (c.thumbnailImageUrl) stats.withThumbnailImage++;
      if (c.imageUrl) stats.withImage++;
      if (c.productImages && (Array.isArray(c.productImages) ? c.productImages.length > 0 : true)) {
        stats.withProductImages++;
      }
      if (c.detailImages && (Array.isArray(c.detailImages) ? c.detailImages.length > 0 : true)) {
        stats.withDetailImages++;
      }
    });

    console.log('\n📊 현재 이미지 보유 현황:');
    console.log(`  - 헤더 이미지: ${stats.withHeaderImage}개`);
    console.log(`  - 썸네일 이미지: ${stats.withThumbnailImage}개`);
    console.log(`  - 메인 이미지: ${stats.withImage}개`);
    console.log(`  - 제품 이미지: ${stats.withProductImages}개`);
    console.log(`  - 상세 이미지: ${stats.withDetailImages}개`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
cleanExternalImages()
  .catch(console.error);