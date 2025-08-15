const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addAdminCategoryTranslations() {
  console.log('Adding admin category translation keys...')
  
  const translations = [
    // 어드민 메뉴
    {
      key: 'admin.menu.categories',
      ko: '카테고리 관리',
      en: 'Category Management',
      jp: 'カテゴリ管理',
      category: 'admin',
      description: '어드민 사이드바 카테고리 관리 메뉴'
    },
    
    // 카테고리 관리 페이지
    {
      key: 'admin.categories.title',
      ko: '카테고리 관리',
      en: 'Category Management',
      jp: 'カテゴリ管理',
      category: 'admin',
      description: '카테고리 관리 페이지 제목'
    },
    {
      key: 'admin.categories.description',
      ko: '캠페인 카테고리 계층 구조를 관리합니다.',
      en: 'Manage campaign category hierarchy structure.',
      jp: 'キャンペーンカテゴリの階層構造を管理します。',
      category: 'admin',
      description: '카테고리 관리 페이지 설명'
    },
    {
      key: 'admin.categories.new_category',
      ko: '새 카테고리',
      en: 'New Category',
      jp: '新しいカテゴリ',
      category: 'admin',
      description: '새 카테고리 버튼'
    },
    {
      key: 'admin.categories.total_categories',
      ko: '전체 카테고리',
      en: 'Total Categories',
      jp: '全体カテゴリ',
      category: 'admin',
      description: '전체 카테고리 통계'
    },
    {
      key: 'admin.categories.main_categories',
      ko: '대분류',
      en: 'Main Categories',
      jp: '大分類',
      category: 'admin',
      description: '대분류 통계'
    },
    {
      key: 'admin.categories.sub_categories',
      ko: '중분류',
      en: 'Sub Categories',
      jp: '中分類',
      category: 'admin',
      description: '중분류 통계'
    },
    {
      key: 'admin.categories.detail_categories',
      ko: '소분류',
      en: 'Detail Categories',
      jp: '小分類',
      category: 'admin',
      description: '소분류 통계'
    },
    {
      key: 'admin.categories.hierarchy_structure',
      ko: '카테고리 계층 구조',
      en: 'Category Hierarchy Structure',
      jp: 'カテゴリ階層構造',
      category: 'admin',
      description: '카테고리 계층 구조 섹션 제목'
    },
    {
      key: 'admin.categories.no_categories',
      ko: '생성된 카테고리가 없습니다.',
      en: 'No categories have been created.',
      jp: '作成されたカテゴリがありません。',
      category: 'admin',
      description: '카테고리 없음 메시지'
    }
  ]

  try {
    for (const translation of translations) {
      await prisma.languagePack.upsert({
        where: { key: translation.key },
        update: {
          ko: translation.ko,
          en: translation.en,
          jp: translation.jp,
          category: translation.category,
          description: translation.description
        },
        create: {
          key: translation.key,
          ko: translation.ko,
          en: translation.en,
          jp: translation.jp,
          category: translation.category,
          description: translation.description
        }
      })
      console.log(`✓ Added translation: ${translation.key}`)
    }

    console.log(`Successfully added ${translations.length} translation keys!`)
  } catch (error) {
    console.error('Error adding translations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addAdminCategoryTranslations()