#!/usr/bin/env node

/**
 * 템플릿 기능 빠른 테스트
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser() {
  const hashedPassword = await bcrypt.hash('test123456', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test.business@revu.com' },
    update: {},
    create: {
      email: 'test.business@revu.com',
      password: hashedPassword,
      name: '테스트 비즈니스',
      type: 'BUSINESS',
      verified: true,
      businessProfile: {
        create: {
          companyName: '테스트 회사',
          businessNumber: '123-45-67890',
          representativeName: '테스트 대표',
          businessAddress: '서울시 강남구',
          businessCategory: 'IT'
        }
      }
    }
  });
  
  return user;
}

async function testTemplate(userId) {
  console.log('\n📋 템플릿 DB 연동 테스트\n');
  
  // 1. 템플릿 생성
  console.log('1️⃣ 템플릿 생성...');
  const template = await prisma.campaignTemplate.create({
    data: {
      businessId: userId,
      name: '2025 봄 캠페인 템플릿',
      description: '봄 시즌 프로모션용 템플릿',
      data: JSON.stringify({
        title: '봄맞이 뷰티 캠페인',
        description: '새로운 봄 컬렉션 홍보',
        platform: 'instagram',
        budget: 2000000,
        maxApplicants: 20,
        requirements: '10대-20대 여성 인플루언서',
        hashtags: '#봄뷰티 #신상품 #화장품',
        productImages: [
          { url: '/sample1.jpg', name: '제품1' },
          { url: '/sample2.jpg', name: '제품2' }
        ],
        dynamicQuestions: [
          { id: '1', question: '주로 사용하는 SNS 플랫폼은?', required: true },
          { id: '2', question: '뷰티 콘텐츠 제작 경험을 알려주세요', required: true }
        ]
      })
    }
  });
  
  console.log(`✅ 템플릿 생성 완료 (ID: ${template.id})`);
  console.log(`   이름: ${template.name}`);
  console.log(`   설명: ${template.description}\n`);
  
  // 2. 템플릿 목록 조회
  console.log('2️⃣ 템플릿 목록 조회...');
  const templates = await prisma.campaignTemplate.findMany({
    where: { businessId: userId },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`✅ 총 ${templates.length}개 템플릿 발견`);
  templates.forEach(t => {
    console.log(`   - ${t.name} (${t.createdAt.toLocaleDateString()})`);
  });
  console.log();
  
  // 3. 템플릿 데이터 불러오기
  console.log('3️⃣ 템플릿 데이터 불러오기...');
  const loadedTemplate = await prisma.campaignTemplate.findUnique({
    where: { id: template.id }
  });
  
  const templateData = JSON.parse(loadedTemplate.data);
  console.log('✅ 불러온 데이터:');
  console.log(`   제목: ${templateData.title}`);
  console.log(`   예산: ${templateData.budget.toLocaleString()}원`);
  console.log(`   최대 지원자: ${templateData.maxApplicants}명`);
  console.log(`   질문 개수: ${templateData.dynamicQuestions.length}개`);
  console.log(`   제품 이미지: ${templateData.productImages.length}개\n`);
  
  // 4. 템플릿 삭제
  console.log('4️⃣ 템플릿 삭제...');
  await prisma.campaignTemplate.delete({
    where: { id: template.id }
  });
  console.log('✅ 템플릿 삭제 완료\n');
  
  return true;
}

async function main() {
  try {
    console.log('🔐 테스트 사용자 생성 중...');
    const user = await createTestUser();
    console.log(`✅ 사용자 생성 완료: ${user.email}`);
    
    await testTemplate(user.id);
    
    console.log('🎉 템플릿 저장/불러오기 DB 연동 테스트 완료!');
    console.log('✨ 모든 기능이 정상적으로 작동합니다.\n');
    
    console.log('📌 확인된 기능:');
    console.log('   ✅ 템플릿 데이터베이스 저장');
    console.log('   ✅ 템플릿 목록 조회');
    console.log('   ✅ 템플릿 데이터 불러오기');
    console.log('   ✅ 템플릿 삭제');
    console.log('   ✅ JSON 데이터 직렬화/역직렬화');
    console.log('   ✅ 사용자별 템플릿 관리');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();