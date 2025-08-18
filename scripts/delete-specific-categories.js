#!/usr/bin/env node

/**
 * 특정 카테고리 삭제 스크립트
 * 삭제 대상: 건강/의료, 반려동물, 육아/유아, 전자/IT, 패션/의류, 홈/리빙
 * 보존 대상: 캠페인, 병원, 구매평
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES_TO_DELETE = [
  'health',     // 건강/의료
  'pet',        // 반려동물
  'baby',       // 육아/유아
  'tech',       // 전자/IT
  'fashion',    // 패션/의류
  'home'        // 홈/리빙
];

const CATEGORIES_TO_KEEP = [
  'campaign',   // 캠페인
  'hospital',   // 병원
  'review'      // 구매평
];

async function deleteSpecificCategories() {
  try {
    console.log('🗑️  특정 카테고리 삭제 시작...');
    console.log('삭제 대상:', CATEGORIES_TO_DELETE);
    console.log('보존 대상:', CATEGORIES_TO_KEEP);
    console.log('─'.repeat(50));

    // 삭제할 카테고리 조회
    const categoriesToDelete = await prisma.category.findMany({
      where: {
        slug: {
          in: CATEGORIES_TO_DELETE
        }
      },
      include: {
        children: {
          include: {
            children: true
          }
        }
      }
    });

    if (categoriesToDelete.length === 0) {
      console.log('❌ 삭제할 카테고리를 찾을 수 없습니다.');
      return;
    }

    console.log(`\n찾은 카테고리: ${categoriesToDelete.length}개`);
    
    for (const category of categoriesToDelete) {
      console.log(`\n📁 ${category.icon || ''} ${category.name} (${category.slug})`);
      
      // 하위 카테고리 개수 확인
      const totalChildren = category.children.length + 
        category.children.reduce((acc, child) => acc + (child.children?.length || 0), 0);
      
      if (totalChildren > 0) {
        console.log(`  └─ 하위 카테고리: ${totalChildren}개`);
      }

      // 관련 캠페인 개수 확인 (CampaignCategory 중간 테이블 사용)
      const campaigns = await prisma.campaignCategory.count({
        where: {
          OR: [
            { categoryId: category.id },
            { categoryId: { in: category.children.map(c => c.id) } },
            { categoryId: { 
              in: category.children.flatMap(c => 
                c.children?.map(sc => sc.id) || []
              ) 
            }}
          ]
        }
      });

      if (campaigns > 0) {
        console.log(`  └─ 관련 캠페인: ${campaigns}개`);
      }
    }

    console.log('\n' + '─'.repeat(50));
    console.log('⚠️  위 카테고리들을 모두 삭제합니다.');
    console.log('   하위 카테고리와 관련 데이터도 함께 삭제됩니다.');
    console.log('─'.repeat(50));

    // 각 카테고리 삭제 (CASCADE로 하위 카테고리도 자동 삭제)
    for (const category of categoriesToDelete) {
      console.log(`\n🗑️  삭제 중: ${category.name}`);
      
      try {
        // 카테고리 삭제 (하위 카테고리는 CASCADE로 자동 삭제)
        await prisma.category.delete({
          where: { id: category.id }
        });
        
        console.log(`✅ ${category.name} 삭제 완료`);
      } catch (error) {
        console.error(`❌ ${category.name} 삭제 실패:`, error.message);
      }
    }

    // 남은 카테고리 확인
    console.log('\n' + '─'.repeat(50));
    console.log('📊 남은 카테고리 확인...');
    
    const remainingCategories = await prisma.category.findMany({
      where: {
        level: 1
      },
      orderBy: {
        menuOrder: 'asc'
      }
    });

    console.log(`\n✅ 남은 대분류 카테고리: ${remainingCategories.length}개`);
    for (const cat of remainingCategories) {
      console.log(`  - ${cat.icon || ''} ${cat.name} (${cat.slug})`);
    }

    console.log('\n✨ 카테고리 삭제 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
deleteSpecificCategories();