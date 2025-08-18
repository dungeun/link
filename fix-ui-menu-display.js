#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUIMenuDisplay() {
  try {
    console.log('🔧 UI 메뉴 표시 문제 완전 수정 중...');
    
    // 현재 카테고리 UI 섹션들 확인
    const categoryMenus = await prisma.uISection.findMany({
      where: {
        type: 'header',
        sectionId: { startsWith: 'category-' }
      },
      orderBy: { order: 'asc' }
    });
    
    console.log(`📋 수정할 카테고리 메뉴: ${categoryMenus.length}개`);
    
    // 카테고리 데이터 가져오기
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });
    
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat;
    });
    
    for (const menu of categoryMenus) {
      try {
        // sectionId에서 slug 추출 (category-campaign → campaign)
        const slug = menu.sectionId.replace('category-', '');
        const category = categoryMap[slug];
        
        if (!category) {
          console.log(`   ⚠️ 카테고리를 찾을 수 없음: ${slug}`);
          continue;
        }
        
        console.log(`🔧 수정 중: ${menu.sectionId} → ${category.name}`);
        
        // 기존 content 파싱
        const content = menu.content ? JSON.parse(menu.content) : {};
        
        // 올바른 content 설정
        const updatedContent = {
          name: category.name,           // 실제 카테고리 이름 (캠페인, 병원, 구매평)
          label: `category.${slug}`,     // 언어팩 키
          href: `/category/${slug}`,     // 올바른 슬러그 URL
          categoryId: slug,              // 카테고리 슬러그
          icon: content.icon || (category.name === '캠페인' ? '📢' : category.name === '병원' ? '🏥' : '⭐')
        };
        
        // UI 섹션 업데이트
        await prisma.uISection.update({
          where: { id: menu.id },
          data: {
            content: JSON.stringify(updatedContent),
            // title도 실제 카테고리 이름으로 설정
            title: JSON.stringify({
              ko: category.name,
              en: category.name,
              jp: category.name
            })
          }
        });
        
        // 언어팩도 올바르게 설정
        await prisma.languagePack.upsert({
          where: { key: `category.${slug}` },
          update: {
            ko: category.name,
            en: category.name,
            jp: category.name
          },
          create: {
            key: `category.${slug}`,
            ko: category.name,
            en: category.name,
            jp: category.name,
            category: 'header',
            description: `Category menu: ${category.name}`,
            isEditable: true
          }
        });
        
        console.log(`   ✅ ${category.name} → ${updatedContent.href} 수정 완료`);
        
      } catch (error) {
        console.error(`   ❌ ${menu.sectionId} 수정 실패:`, error.message);
      }
    }
    
    // 최종 결과 확인
    console.log('\n📊 수정 결과 확인...');
    const updatedMenus = await prisma.uISection.findMany({
      where: {
        type: 'header',
        sectionId: { startsWith: 'category-' }
      },
      orderBy: { order: 'asc' }
    });
    
    console.log('✅ 수정된 카테고리 메뉴들:');
    updatedMenus.forEach(menu => {
      const content = menu.content ? JSON.parse(menu.content) : {};
      console.log(`   - 이름: "${content.name}" | URL: "${content.href}" | 언어키: "${content.label}"`);
    });
    
    console.log('\n🎯 이제 UI에서 카테고리 이름이 한글로 올바르게 표시되고 URL도 슬러그로 설정됩니다!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUIMenuDisplay();