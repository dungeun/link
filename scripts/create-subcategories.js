const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 각 대분류별 중분류 데이터
const subcategoriesData = {
  // 병원 카테고리 중분류 (이미 생성됨)
  hospital: [
    { name: '내과', slug: 'internal-medicine', description: '내과 의료 서비스', icon: '🫀' },
    { name: '외과', slug: 'surgery', description: '외과 수술 및 치료', icon: '🏥' },
    { name: '성형외과', slug: 'plastic-surgery', description: '성형 및 미용 수술', icon: '✨' },
    { name: '피부과', slug: 'dermatology', description: '피부 질환 치료', icon: '🧴' },
    { name: '치과', slug: 'dentistry', description: '치과 치료 서비스', icon: '🦷' },
    { name: '안과', slug: 'ophthalmology', description: '눈 질환 치료', icon: '👁️' },
    { name: '정형외과', slug: 'orthopedics', description: '뼈와 관절 치료', icon: '🦴' },
    { name: '산부인과', slug: 'gynecology', description: '여성 건강 관리', icon: '👶' }
  ],
  
  // 캠페인 카테고리 중분류 (정확한 슬러그: campaign)
  campaign: [
    { name: '이용가이드', slug: 'guide', description: '서비스 이용 가이드', icon: '📋' },
    { name: '맛집', slug: 'restaurant', description: '맛집 및 음식 관련', icon: '🍽️' },
    { name: '뷰티', slug: 'beauty', description: '화장품 및 뷰티 제품', icon: '💄' },
    { name: '여행', slug: 'travel', description: '여행 및 관광', icon: '✈️' },
    { name: '문화', slug: 'culture', description: '문화 및 예술', icon: '🎭' },
    { name: '식품', slug: 'food', description: '식품 및 요리', icon: '🥘' },
    { name: '생활', slug: 'lifestyle', description: '생활용품 및 라이프스타일', icon: '🏡' },
    { name: '디지털', slug: 'digital', description: '전자제품 및 디지털 기기', icon: '📱' }
  ],
  
  // 구매평 카테고리 중분류 (정확한 슬러그: review)  
  review: [
    { name: '이용가이드', slug: 'review-guide', description: '구매평 작성 가이드', icon: '📝' },
    { name: '맛집', slug: 'restaurant-review', description: '맛집 구매평', icon: '🍴' },
    { name: '뷰티', slug: 'beauty-review', description: '화장품 구매평', icon: '💋' },
    { name: '여행', slug: 'travel-review', description: '여행 상품 리뷰', icon: '🧳' },
    { name: '문화', slug: 'culture-review', description: '문화 상품 리뷰', icon: '🎨' },
    { name: '식품', slug: 'food-review', description: '식품 구매평', icon: '🍎' },
    { name: '생활', slug: 'daily-review', description: '생활용품 구매평', icon: '🛍️' },
    { name: '디지털', slug: 'digital-review', description: '전자제품 리뷰', icon: '💻' }
  ]
};

async function createSubcategories() {
  console.log('🚀 중분류 생성 시작...');

  try {
    // 기존 대분류 가져오기
    const parentCategories = await prisma.category.findMany({
      where: { level: 1 },
      select: { id: true, slug: true, name: true }
    });

    console.log('📋 찾은 대분류:', parentCategories.map(c => c.name).join(', '));

    for (const parentCategory of parentCategories) {
      const subcategories = subcategoriesData[parentCategory.slug];
      
      if (!subcategories) {
        console.log(`⚠️ ${parentCategory.name}에 대한 중분류 데이터가 없습니다.`);
        continue;
      }

      console.log(`\n📂 ${parentCategory.name} 중분류 생성 중...`);
      
      for (const subcategory of subcategories) {
        try {
          // 이미 존재하는지 확인
          const existing = await prisma.category.findUnique({
            where: { slug: subcategory.slug }
          });

          if (existing) {
            console.log(`   ⏭️ ${subcategory.name} - 이미 존재함`);
            continue;
          }

          // 중분류 생성
          const created = await prisma.category.create({
            data: {
              name: subcategory.name,
              slug: subcategory.slug,
              description: subcategory.description,
              icon: subcategory.icon,
              parentId: parentCategory.id,
              level: 2,
              isActive: true,
              showInMenu: true,
              menuOrder: subcategories.indexOf(subcategory) + 1
            }
          });

          console.log(`   ✅ ${created.name} (${created.slug}) 생성완료`);
        } catch (error) {
          console.error(`   ❌ ${subcategory.name} 생성 실패:`, error.message);
        }
      }
    }

    console.log('\n🎉 중분류 생성 완료!');
    
    // 결과 확인
    const result = await prisma.category.findMany({
      where: { level: 2 },
      include: { parent: { select: { name: true } } },
      orderBy: [{ parent: { name: 'asc' } }, { name: 'asc' }]
    });

    console.log('\n📊 생성된 중분류 목록:');
    result.forEach(cat => {
      console.log(`   ${cat.parent?.name || '없음'} > ${cat.name} (${cat.slug})`);
    });

  } catch (error) {
    console.error('❌ 중분류 생성 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
createSubcategories();