const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCategorySections() {
  try {
    console.log('카테고리 섹션 추가 시작...');
    
    // 기존 카테고리 섹션 삭제 (중복 방지)
    await prisma.uISection.deleteMany({
      where: {
        type: 'category'
      }
    });
    
    // 병원 카테고리 섹션 추가
    const hospitalSection = await prisma.uISection.create({
      data: {
        sectionId: 'hospital-category',
        type: 'category',
        title: '병원 캠페인',
        subtitle: '의료 서비스 관련 캠페인을 만나보세요',
        order: 4, // ranking, recommended 다음
        visible: true,
        settings: {
          count: 8,
          categorySlug: 'hospital',
          categoryName: '병원'
        }
      }
    });
    
    console.log('✅ 병원 카테고리 섹션 생성:', hospitalSection.id);
    
    // 구매평 카테고리 섹션 추가
    const reviewSection = await prisma.uISection.create({
      data: {
        sectionId: 'review-category',
        type: 'category',
        title: '구매평 캠페인',
        subtitle: '제품 리뷰 캠페인을 만나보세요',
        order: 5,
        visible: true,
        settings: {
          count: 8,
          categorySlug: 'reviews',
          categoryName: '구매평'
        }
      }
    });
    
    console.log('✅ 구매평 카테고리 섹션 생성:', reviewSection.id);
    
    console.log('\n✅ 카테고리 섹션이 성공적으로 추가되었습니다!');
    
  } catch (error) {
    console.error('카테고리 섹션 추가 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCategorySections();