import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUploadedImages() {
  try {
    console.log('🔍 데이터베이스에서 모든 이미지 URL 패턴 찾기...\n');
    
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

    // URL 패턴 수집
    const urlPatterns = new Set<string>();
    const allUrls: { url: string, campaign: string, field: string }[] = [];

    campaigns.forEach(campaign => {
      // 단일 이미지 필드들
      const singleImageFields = [
        { field: 'imageUrl', value: campaign.imageUrl },
        { field: 'headerImageUrl', value: campaign.headerImageUrl },
        { field: 'thumbnailImageUrl', value: campaign.thumbnailImageUrl }
      ];

      singleImageFields.forEach(({ field, value }) => {
        if (value && typeof value === 'string' && value.trim() !== '') {
          allUrls.push({ url: value, campaign: campaign.title, field });
          
          // URL 패턴 추출
          if (value.startsWith('http')) {
            const url = new URL(value);
            urlPatterns.add(url.hostname);
          } else if (value.startsWith('/')) {
            if (value.includes('/uploads/')) {
              urlPatterns.add('LOCAL:/uploads/');
            } else if (value.includes('/images/')) {
              urlPatterns.add('LOCAL:/images/');
            } else {
              urlPatterns.add('LOCAL:' + value.split('/')[1]);
            }
          } else if (value.startsWith('data:')) {
            urlPatterns.add('DATA_URL');
          }
        }
      });

      // productImages 처리
      if (campaign.productImages) {
        try {
          let images = campaign.productImages;
          if (typeof images === 'string') {
            images = JSON.parse(images);
          }
          
          if (Array.isArray(images)) {
            images.forEach((img: any) => {
              const url = typeof img === 'string' ? img : (img?.url || img?.imageUrl);
              if (url && typeof url === 'string' && url.trim() !== '') {
                allUrls.push({ url, campaign: campaign.title, field: 'productImages' });
                
                // URL 패턴 추출
                if (url.startsWith('http')) {
                  const urlObj = new URL(url);
                  urlPatterns.add(urlObj.hostname);
                } else if (url.startsWith('/')) {
                  if (url.includes('/uploads/')) {
                    urlPatterns.add('LOCAL:/uploads/');
                  } else if (url.includes('/images/')) {
                    urlPatterns.add('LOCAL:/images/');
                  } else {
                    urlPatterns.add('LOCAL:' + url.split('/')[1]);
                  }
                } else if (url.startsWith('data:')) {
                  urlPatterns.add('DATA_URL');
                }
              }
            });
          }
        } catch (e) {
          // 무시
        }
      }

      // detailImages 처리
      if (campaign.detailImages) {
        try {
          let images = campaign.detailImages;
          if (typeof images === 'string') {
            images = JSON.parse(images);
          }
          
          if (Array.isArray(images)) {
            images.forEach((img: any) => {
              const url = typeof img === 'string' ? img : (img?.url || img?.imageUrl);
              if (url && typeof url === 'string' && url.trim() !== '') {
                allUrls.push({ url, campaign: campaign.title, field: 'detailImages' });
                
                // URL 패턴 추출
                if (url.startsWith('http')) {
                  const urlObj = new URL(url);
                  urlPatterns.add(urlObj.hostname);
                } else if (url.startsWith('/')) {
                  if (url.includes('/uploads/')) {
                    urlPatterns.add('LOCAL:/uploads/');
                  } else if (url.includes('/images/')) {
                    urlPatterns.add('LOCAL:/images/');
                  } else {
                    urlPatterns.add('LOCAL:' + url.split('/')[1]);
                  }
                } else if (url.startsWith('data:')) {
                  urlPatterns.add('DATA_URL');
                }
              }
            });
          }
        } catch (e) {
          // 무시
        }
      }
    });

    console.log('📊 발견된 URL 패턴들:');
    console.log('─'.repeat(50));
    Array.from(urlPatterns).sort().forEach(pattern => {
      const count = allUrls.filter(u => {
        if (pattern.startsWith('LOCAL:')) {
          return u.url.includes(pattern.replace('LOCAL:', ''));
        } else if (pattern === 'DATA_URL') {
          return u.url.startsWith('data:');
        } else {
          return u.url.includes(pattern);
        }
      }).length;
      console.log(`  ${pattern}: ${count}개`);
    });

    // /uploads/ 경로를 가진 URL들만 출력
    console.log('\n📁 /uploads/ 경로 이미지들:');
    console.log('─'.repeat(50));
    const uploadUrls = allUrls.filter(u => u.url.includes('/uploads/'));
    if (uploadUrls.length > 0) {
      uploadUrls.forEach(({ url, campaign, field }) => {
        console.log(`  캠페인: ${campaign}`);
        console.log(`  필드: ${field}`);
        console.log(`  URL: ${url}`);
        console.log('');
      });
    } else {
      console.log('  /uploads/ 경로의 이미지가 없습니다.');
    }

    // blob.vercel-storage.com URL들만 출력
    console.log('\n☁️ Vercel Blob Storage 이미지들:');
    console.log('─'.repeat(50));
    const blobUrls = allUrls.filter(u => u.url.includes('blob.vercel-storage.com'));
    if (blobUrls.length > 0) {
      blobUrls.forEach(({ url, campaign, field }) => {
        console.log(`  캠페인: ${campaign}`);
        console.log(`  필드: ${field}`);
        console.log(`  URL: ${url}`);
        console.log('');
      });
    } else {
      console.log('  Vercel Blob Storage의 이미지가 없습니다.');
    }

    // data: URL들만 출력 (Base64)
    console.log('\n🔤 Base64 Data URL 이미지들:');
    console.log('─'.repeat(50));
    const dataUrls = allUrls.filter(u => u.url.startsWith('data:'));
    if (dataUrls.length > 0) {
      console.log(`  총 ${dataUrls.length}개의 Base64 이미지가 있습니다.`);
      dataUrls.slice(0, 3).forEach(({ campaign, field }) => {
        console.log(`  - ${campaign} (${field})`);
      });
      if (dataUrls.length > 3) {
        console.log(`  ... 외 ${dataUrls.length - 3}개`);
      }
    } else {
      console.log('  Base64 Data URL 이미지가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findUploadedImages()
  .catch(console.error);