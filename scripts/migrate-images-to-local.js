const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function downloadImageFromUrl(imageUrl, category = 'campaigns') {
  try {
    console.log(`📥 다운로드 중: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Content-Type에서 확장자 추출
    const contentType = response.headers.get('content-type') || '';
    let fileExtension = '.jpg';
    
    if (contentType.includes('png')) fileExtension = '.png';
    else if (contentType.includes('webp')) fileExtension = '.webp';

    // 고유한 파일명 생성
    const fileName = `${randomUUID()}${fileExtension}`;
    
    // 저장 경로 설정
    const uploadDir = path.join(process.cwd(), 'public', 'images', category);
    const filePath = path.join(uploadDir, fileName);
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/images/${category}/${fileName}`;
    console.log(`✅ 저장 완료: ${publicUrl}`);
    
    return publicUrl;

  } catch (error) {
    console.error(`❌ 다운로드 실패: ${imageUrl}`, error.message);
    return null;
  }
}

async function migrateImages() {
  console.log('🚀 이미지 마이그레이션 시작...');
  
  try {
    // 모든 캠페인 조회
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        headerImageUrl: true,
        thumbnailImageUrl: true,
        detailImages: true,
        productImages: true,
      }
    });

    console.log(`📊 총 ${campaigns.length}개 캠페인의 이미지를 마이그레이션합니다.`);

    let totalProcessed = 0;
    let totalMigrated = 0;

    for (const campaign of campaigns) {
      console.log(`\n🎯 캠페인: ${campaign.title} (${campaign.id})`);
      
      const updates = {};
      let hasUpdates = false;

      // headerImageUrl 처리
      if (campaign.headerImageUrl && campaign.headerImageUrl.startsWith('https://picsum.photos')) {
        const localUrl = await downloadImageFromUrl(campaign.headerImageUrl, 'campaigns');
        if (localUrl) {
          updates.headerImageUrl = localUrl;
          hasUpdates = true;
          totalMigrated++;
        }
        totalProcessed++;
      }

      // thumbnailImageUrl 처리
      if (campaign.thumbnailImageUrl && campaign.thumbnailImageUrl.startsWith('https://picsum.photos')) {
        const localUrl = await downloadImageFromUrl(campaign.thumbnailImageUrl, 'campaigns');
        if (localUrl) {
          updates.thumbnailImageUrl = localUrl;
          hasUpdates = true;
          totalMigrated++;
        }
        totalProcessed++;
      }

      // imageUrl 처리
      if (campaign.imageUrl && campaign.imageUrl.startsWith('https://picsum.photos')) {
        const localUrl = await downloadImageFromUrl(campaign.imageUrl, 'campaigns');
        if (localUrl) {
          updates.imageUrl = localUrl;
          hasUpdates = true;
          totalMigrated++;
        }
        totalProcessed++;
      }

      // productImages 배열 처리
      if (campaign.productImages && Array.isArray(campaign.productImages)) {
        const newProductImages = [];
        for (const imageUrl of campaign.productImages) {
          if (imageUrl && imageUrl.startsWith('https://picsum.photos')) {
            const localUrl = await downloadImageFromUrl(imageUrl, 'campaigns');
            if (localUrl) {
              newProductImages.push(localUrl);
              totalMigrated++;
            } else {
              newProductImages.push(imageUrl); // 실패시 원본 유지
            }
            totalProcessed++;
          } else {
            newProductImages.push(imageUrl);
          }
        }
        if (newProductImages.length > 0) {
          updates.productImages = newProductImages;
          hasUpdates = true;
        }
      }

      // detailImages 배열 처리
      if (campaign.detailImages && Array.isArray(campaign.detailImages)) {
        const newDetailImages = [];
        for (const imageUrl of campaign.detailImages) {
          if (imageUrl && imageUrl.startsWith('https://picsum.photos')) {
            const localUrl = await downloadImageFromUrl(imageUrl, 'campaigns');
            if (localUrl) {
              newDetailImages.push(localUrl);
              totalMigrated++;
            } else {
              newDetailImages.push(imageUrl); // 실패시 원본 유지
            }
            totalProcessed++;
          } else {
            newDetailImages.push(imageUrl);
          }
        }
        if (newDetailImages.length > 0) {
          updates.detailImages = newDetailImages;
          hasUpdates = true;
        }
      }

      // 데이터베이스 업데이트
      if (hasUpdates) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: updates
        });
        console.log(`💾 캠페인 업데이트 완료: ${campaign.id}`);
      }
    }

    console.log('\n🎉 이미지 마이그레이션 완료!');
    console.log(`📊 통계:`);
    console.log(`   - 처리된 이미지: ${totalProcessed}개`);
    console.log(`   - 마이그레이션된 이미지: ${totalMigrated}개`);
    console.log(`   - 실패한 이미지: ${totalProcessed - totalMigrated}개`);

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateImages();