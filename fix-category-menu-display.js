#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCategoryMenuDisplay() {
  try {
    console.log('🔧 카테고리 메뉴 표시 문제 수정 중...');
    
    // 현재 카테고리 헤더 메뉴들 확인
    const categoryMenus = await prisma.uISection.findMany({
      where: {
        type: 'header',
        sectionId: {
          startsWith: 'category-'
        }
      },
      orderBy: { order: 'asc' }
    });
    
    console.log(`📋 수정할 카테고리 메뉴: ${categoryMenus.length}개`);
    
    for (const menu of categoryMenus) {
      try {
        const content = menu.content ? JSON.parse(menu.content) : {};
        const categoryName = content.name || content.label || '';
        
        console.log(`🔧 수정 중: ${menu.sectionId} → ${categoryName}`);
        
        // 언어팩 키 생성 (카테고리명 기반)
        const languageKey = `category.${content.categoryId || menu.sectionId.replace('category-', '')}`;
        
        // 언어팩에 추가
        await prisma.languagePack.upsert({
          where: { key: languageKey },
          update: {
            ko: categoryName,
            en: categoryName, // 영어는 일단 동일하게
            jp: categoryName, // 일본어도 일단 동일하게
            category: 'header'
          },
          create: {
            key: languageKey,
            ko: categoryName,
            en: categoryName,
            jp: categoryName,
            category: 'header'
          }
        });
        
        // UI 섹션 업데이트 - label을 언어팩 키로 변경
        const updatedContent = {
          ...content,
          label: languageKey, // 언어팩 키로 변경
          name: categoryName  // 실제 이름 유지
        };
        
        await prisma.uISection.update({
          where: { id: menu.id },
          data: {
            content: JSON.stringify(updatedContent),
            title: JSON.stringify({
              ko: categoryName,
              en: categoryName,
              jp: categoryName
            })
          }
        });
        
        console.log(`   ✅ ${categoryName} (${languageKey}) 수정 완료`);
        
      } catch (error) {
        console.error(`   ❌ ${menu.sectionId} 수정 실패:`, error.message);
      }
    }
    
    // 최종 결과 확인
    console.log('\n📊 수정 결과 확인...');
    const updatedMenus = await prisma.uISection.findMany({
      where: {
        type: 'header',
        sectionId: {
          startsWith: 'category-'
        }
      },
      orderBy: { order: 'asc' }
    });
    
    console.log('✅ 수정된 카테고리 메뉴들:');
    updatedMenus.forEach(menu => {
      const content = menu.content ? JSON.parse(menu.content) : {};
      console.log(`   - ${content.name} (${content.label}) → ${content.href}`);
    });
    
    console.log('\n🎯 이제 UI에서 카테고리 이름이 올바르게 표시됩니다!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategoryMenuDisplay();