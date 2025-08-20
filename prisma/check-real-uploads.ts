import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRealUploads() {
  try {
    console.log('🔍 실제 업로드 데이터 찾기...\n');
    
    // /uploads/ 경로를 가진 캠페인 찾기
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        productImages: true,
        detailImages: true,
        imageUrl: true,
        headerImageUrl: true,
        thumbnailImageUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });

    let realUploadCount = 0;
    const realUploadCampaigns: any[] = [];

    for (const campaign of campaigns) {
      let hasRealUpload = false;
      const uploadedImages: string[] = [];

      // 각 이미지 필드 체크
      const imageFields = [
        { field: 'imageUrl', value: campaign.imageUrl },
        { field: 'headerImageUrl', value: campaign.headerImageUrl },
        { field: 'thumbnailImageUrl', value: campaign.thumbnailImageUrl }
      ];

      for (const { field, value } of imageFields) {
        if (value && typeof value === 'string') {
          if (value.includes('/uploads/') || value.includes('blob.vercel-storage.com')) {
            hasRealUpload = true;
            uploadedImages.push(`${field}: ${value}`);
          }
        }
      }

      // productImages 체크
      if (campaign.productImages) {
        try {
          let images = campaign.productImages;
          if (typeof images === 'string') {
            images = JSON.parse(images);
          }
          
          if (Array.isArray(images)) {
            images.forEach((img: any) => {
              const url = typeof img === 'string' ? img : (img?.url || img?.imageUrl);
              if (url && (url.includes('/uploads/') || url.includes('blob.vercel-storage.com'))) {
                hasRealUpload = true;
                uploadedImages.push(`productImage: ${url}`);
              }
            });
          }
        } catch (e) {
          // 무시
        }
      }

      // detailImages 체크
      if (campaign.detailImages) {
        try {
          let images = campaign.detailImages;
          if (typeof images === 'string') {
            images = JSON.parse(images);
          }
          
          if (Array.isArray(images)) {
            images.forEach((img: any) => {
              const url = typeof img === 'string' ? img : (img?.url || img?.imageUrl);
              if (url && (url.includes('/uploads/') || url.includes('blob.vercel-storage.com'))) {
                hasRealUpload = true;
                uploadedImages.push(`detailImage: ${url}`);
              }
            });
          }
        } catch (e) {
          // 무시
        }
      }

      if (hasRealUpload) {
        realUploadCount++;
        realUploadCampaigns.push({
          id: campaign.id,
          title: campaign.title,
          uploadedImages,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt
        });
      }
    }

    console.log(`✅ ${realUploadCount}개의 캠페인이 실제 업로드된 이미지를 가지고 있습니다.\n`);

    // 최근 업데이트된 캠페인 표시
    const sortedCampaigns = realUploadCampaigns.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    console.log('📋 최근 업데이트된 캠페인 (상위 5개):\n');
    sortedCampaigns.slice(0, 5).forEach(campaign => {
      console.log(`📦 ${campaign.title}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   업데이트: ${new Date(campaign.updatedAt).toLocaleString('ko-KR')}`);
      console.log(`   업로드된 이미지:`);
      campaign.uploadedImages.forEach((img: string) => {
        console.log(`     - ${img}`);
      });
      console.log('');
    });

    // 특정 캠페인 상세 확인
    const targetId = 'cmeijy8za0001bx3lhoi4b51y';
    const targetCampaign = campaigns.find(c => c.id === targetId);
    
    if (targetCampaign) {
      console.log(`\n🎯 타겟 캠페인 (${targetId}) 상세 정보:`);
      console.log(`   제목: ${targetCampaign.title}`);
      console.log(`   imageUrl: ${targetCampaign.imageUrl || 'null'}`);
      console.log(`   headerImageUrl: ${targetCampaign.headerImageUrl || 'null'}`);
      console.log(`   thumbnailImageUrl: ${targetCampaign.thumbnailImageUrl || 'null'}`);
      console.log(`   productImages: ${JSON.stringify(targetCampaign.productImages, null, 2)}`);
      console.log(`   detailImages: ${JSON.stringify(targetCampaign.detailImages, null, 2)}`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealUploads()
  .catch(console.error);