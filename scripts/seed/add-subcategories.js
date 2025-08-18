const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSubcategories() {
  try {
    console.log('중분류 카테고리 추가 시작...');
    
    // 대분류 카테고리 찾기 또는 생성
    let campaigns = await prisma.category.findFirst({ where: { slug: 'campaigns' } });
    if (!campaigns) {
      campaigns = await prisma.category.create({
        data: {
          name: '캠페인',
          slug: 'campaigns',
          description: '모든 캠페인',
          level: 1,
          isActive: true,
          showInMenu: true,
          menuOrder: 0,
          icon: '📢'
        }
      });
      console.log('✅ 캠페인 대분류 생성됨');
    }
    
    let hospital = await prisma.category.findFirst({ where: { slug: 'hospital' } });
    if (!hospital) {
      hospital = await prisma.category.create({
        data: {
          name: '병원',
          slug: 'hospital',
          description: '의료 서비스 관련 캠페인',
          level: 1,
          isActive: true,
          showInMenu: true,
          menuOrder: 1,
          icon: '🏥'
        }
      });
      console.log('✅ 병원 대분류 생성됨');
    }
    
    let reviews = await prisma.category.findFirst({ where: { slug: 'reviews' } });
    if (!reviews) {
      reviews = await prisma.category.create({
        data: {
          name: '구매평',
          slug: 'reviews',
          description: '제품 및 서비스 리뷰 캠페인',
          level: 1,
          isActive: true,
          showInMenu: true,
          menuOrder: 2,
          icon: '⭐'
        }
      });
      console.log('✅ 구매평 대분류 생성됨');
    }
    
    // 캠페인 중분류
    const campaignSubcategories = [
      { name: '뷰티', slug: 'beauty', description: '화장품, 스킨케어 관련 캠페인' },
      { name: '패션', slug: 'fashion', description: '의류, 액세서리 관련 캠페인' },
      { name: '식품', slug: 'food', description: '식품, 음료 관련 캠페인' },
      { name: '전자제품', slug: 'electronics', description: '전자기기, 가전제품 관련 캠페인' },
      { name: '생활용품', slug: 'lifestyle', description: '일상 생활용품 관련 캠페인' },
      { name: '여행', slug: 'travel', description: '여행, 숙박 관련 캠페인' },
      { name: '교육', slug: 'education', description: '교육, 학습 관련 캠페인' },
      { name: '스포츠', slug: 'sports', description: '운동, 스포츠 관련 캠페인' }
    ];
    
    // 병원 중분류
    const hospitalSubcategories = [
      { name: '피부과', slug: 'dermatology', description: '피부과 관련 의료 서비스' },
      { name: '치과', slug: 'dental', description: '치과 치료 및 상담' },
      { name: '성형외과', slug: 'plastic-surgery', description: '성형, 미용 시술' },
      { name: '안과', slug: 'ophthalmology', description: '시력교정, 안과 질환' },
      { name: '정형외과', slug: 'orthopedics', description: '관절, 척추 치료' },
      { name: '한의원', slug: 'korean-medicine', description: '한방 치료 및 한약' },
      { name: '산부인과', slug: 'obstetrics', description: '여성 건강 관리' },
      { name: '내과', slug: 'internal-medicine', description: '내과 진료 및 건강검진' }
    ];
    
    // 구매평 중분류
    const reviewSubcategories = [
      { name: '배달음식', slug: 'delivery-food', description: '배달 음식 리뷰' },
      { name: '온라인쇼핑', slug: 'online-shopping', description: '온라인 쇼핑몰 제품 리뷰' },
      { name: '앱/서비스', slug: 'app-service', description: '앱 및 서비스 이용 후기' },
      { name: '숙박', slug: 'accommodation', description: '호텔, 펜션 등 숙박 리뷰' },
      { name: '맛집', slug: 'restaurant', description: '레스토랑, 카페 방문 후기' },
      { name: '뷰티샵', slug: 'beauty-shop', description: '미용실, 네일샵 등 뷰티샵 리뷰' },
      { name: '문화생활', slug: 'culture', description: '영화, 공연, 전시 관람 후기' },
      { name: '반려동물', slug: 'pet', description: '펫샵, 동물병원 등 반려동물 관련 리뷰' }
    ];
    
    // 캠페인 중분류 추가
    console.log('\n📌 캠페인 중분류 추가 중...');
    for (const sub of campaignSubcategories) {
      const existing = await prisma.category.findFirst({
        where: { slug: sub.slug, parentId: campaigns.id }
      });
      
      if (!existing) {
        await prisma.category.create({
          data: {
            ...sub,
            parentId: campaigns.id,
            level: 2,
            isActive: true,
            showInMenu: true,
            menuOrder: campaignSubcategories.indexOf(sub)
          }
        });
        console.log(`✅ 생성됨: 캠페인 > ${sub.name}`);
      } else {
        console.log(`⏭️  이미 존재: 캠페인 > ${sub.name}`);
      }
    }
    
    // 병원 중분류 추가
    console.log('\n🏥 병원 중분류 추가 중...');
    for (const sub of hospitalSubcategories) {
      const existing = await prisma.category.findFirst({
        where: { slug: sub.slug, parentId: hospital.id }
      });
      
      if (!existing) {
        await prisma.category.create({
          data: {
            ...sub,
            parentId: hospital.id,
            level: 2,
            isActive: true,
            showInMenu: true,
            menuOrder: hospitalSubcategories.indexOf(sub)
          }
        });
        console.log(`✅ 생성됨: 병원 > ${sub.name}`);
      } else {
        console.log(`⏭️  이미 존재: 병원 > ${sub.name}`);
      }
    }
    
    // 구매평 중분류 추가
    console.log('\n🛍️ 구매평 중분류 추가 중...');
    for (const sub of reviewSubcategories) {
      const existing = await prisma.category.findFirst({
        where: { slug: sub.slug, parentId: reviews.id }
      });
      
      if (!existing) {
        await prisma.category.create({
          data: {
            ...sub,
            parentId: reviews.id,
            level: 2,
            isActive: true,
            showInMenu: true,
            menuOrder: reviewSubcategories.indexOf(sub)
          }
        });
        console.log(`✅ 생성됨: 구매평 > ${sub.name}`);
      } else {
        console.log(`⏭️  이미 존재: 구매평 > ${sub.name}`);
      }
    }
    
    console.log('\n✅ 모든 중분류 카테고리가 성공적으로 추가되었습니다!');
    
    // 카테고리 통계 출력
    const totalCategories = await prisma.category.count();
    const level1Count = await prisma.category.count({ where: { level: 1 } });
    const level2Count = await prisma.category.count({ where: { level: 2 } });
    const level3Count = await prisma.category.count({ where: { level: 3 } });
    
    console.log('\n📊 카테고리 통계:');
    console.log(`- 전체: ${totalCategories}개`);
    console.log(`- 대분류: ${level1Count}개`);
    console.log(`- 중분류: ${level2Count}개`);
    console.log(`- 소분류: ${level3Count}개`);
    
  } catch (error) {
    console.error('중분류 추가 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSubcategories();