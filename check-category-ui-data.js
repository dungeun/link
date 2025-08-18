#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    console.log('📋 카테고리 데이터 확인 중...');
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, showInMenu: true, isActive: true }
    });
    console.log('카테고리 데이터:', JSON.stringify(categories, null, 2));
    
    console.log('\n📋 UI 섹션 데이터 확인 중...');
    const uiSections = await prisma.uISection.findMany({
      where: { type: 'header', sectionId: { startsWith: 'category-' } },
      select: { id: true, sectionId: true, content: true, visible: true }
    });
    console.log('UI 섹션 데이터:', JSON.stringify(uiSections, null, 2));
    
    console.log('\n📋 언어팩 데이터 확인 중...');
    const langPacks = await prisma.languagePack.findMany({
      where: { key: { startsWith: 'category.' } },
      select: { key: true, ko: true, en: true, jp: true }
    });
    console.log('언어팩 데이터:', JSON.stringify(langPacks, null, 2));
    
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();