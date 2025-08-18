#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCategoryMenuSlugs() {
  try {
    console.log('🔧 카테고리 메뉴 슬러그 및 표시명 수정 중...');
    
    // 카테고리 데이터 가져오기
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });
    
    console.log(`📋 처리할 카테고리: ${categories.length}개`);
    
    // 카테고리별 UI 섹션 업데이트
    for (const category of categories) {
      try {
        console.log(`🔧 수정 중: ${category.name} (${category.slug})`);
        
        // 해당하는 UI 섹션 찾기
        const uiSection = await prisma.uISection.findFirst({
          where: {
            type: 'header',
            sectionId: `category-${category.slug}`
          }
        });
        
        if (uiSection) {
          // 기존 content 파싱
          const content = uiSection.content ? JSON.parse(uiSection.content) : {};
          
          // 올바른 href 설정 (실제 카테고리 slug 사용)
          const updatedContent = {
            ...content,
            name: category.name,
            label: `category.${category.slug}`,
            href: `/category/${category.slug}`, // 실제 카테고리 slug 사용
            categoryId: category.slug,
            icon: content.icon || (category.name === '캠페인' ? '📢' : category.name === '병원' ? '🏥' : '⭐')
          };
          
          // UI 섹션 업데이트
          await prisma.uISection.update({
            where: { id: uiSection.id },
            data: {
              content: JSON.stringify(updatedContent),
              title: JSON.stringify({
                ko: category.name,
                en: category.name,
                jp: category.name
              })
            }
          });
          
          // 언어팩도 업데이트 (이미 존재하면)
          await prisma.languagePack.upsert({
            where: { key: `category.${category.slug}` },
            update: {
              ko: category.name,
              en: category.name, // 기본적으로 같은 이름 사용
              jp: category.name
            },
            create: {
              key: `category.${category.slug}`,
              ko: category.name,
              en: category.name,
              jp: category.name,
              category: 'header',
              description: `Category menu: ${category.name}`,
              isEditable: true
            }
          });
          
          console.log(`   ✅ ${category.name} → /category/${category.slug} 수정 완료`);
        } else {
          console.log(`   ⚠️ ${category.name}에 해당하는 UI 섹션을 찾을 수 없음`);
        }
        
      } catch (error) {
        console.error(`   ❌ ${category.name} 수정 실패:`, error.message);
      }
    }
    
    // 최종 결과 확인
    console.log('\n📊 수정 결과 확인...');
    const updatedSections = await prisma.uISection.findMany({
      where: {
        type: 'header',
        sectionId: { startsWith: 'category-' }
      },
      orderBy: { order: 'asc' }
    });
    
    console.log('✅ 수정된 카테고리 메뉴들:');
    updatedSections.forEach(section => {
      const content = section.content ? JSON.parse(section.content) : {};
      console.log(`   - ${content.name} → ${content.href} (${content.label})`);
    });
    
    console.log('\n🎯 이제 카테고리 메뉴에서 올바른 슬러그와 이름이 표시됩니다!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategoryMenuSlugs();