#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategoryLanguagePacks() {
  try {
    console.log('📋 카테고리 관련 언어팩 확인...\n');

    // category로 시작하는 언어팩 조회
    const categoryPacks = await prisma.languagePack.findMany({
      where: {
        key: {
          startsWith: 'category'
        }
      },
      orderBy: {
        key: 'asc'
      }
    });

    console.log(`찾은 카테고리 언어팩: ${categoryPacks.length}개\n`);

    categoryPacks.forEach((pack, index) => {
      console.log(`${index + 1}. ${pack.key}`);
      console.log(`   한국어: ${pack.ko}`);
      console.log(`   영어: ${pack.en}`);
      console.log(`   일본어: ${pack.jp}`);
      console.log(`   카테고리: ${pack.category}`);
      console.log(`   수정가능: ${pack.isEditable ? '✅' : '❌'}`);
      console.log('');
    });

    // 카테고리 메뉴 관련 언어팩이 없으면 생성 제안
    if (categoryPacks.length === 0) {
      console.log('⚠️  카테고리 관련 언어팩이 없습니다.');
      console.log('카테고리 메뉴를 위한 언어팩을 생성해야 합니다.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoryLanguagePacks();