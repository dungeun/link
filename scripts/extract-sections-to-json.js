const { PrismaClient } = require('@prisma/client')
const fs = require('fs').promises
const path = require('path')

const prisma = new PrismaClient()

async function extractSectionsToJson() {
  try {
    console.log('🔍 Extracting UI sections from database...')
    
    // 1. UI 섹션 데이터 추출
    const sections = await prisma.uISection.findMany({
      where: { visible: true },
      select: {
        id: true,
        type: true,
        sectionId: true,
        title: true,
        subtitle: true,
        content: true,
        translations: true,
        visible: true,
        order: true
      },
      orderBy: { order: 'asc' }
    })
    
    console.log(`📊 Found ${sections.length} UI sections`)
    
    // 2. 섹션 타입별로 분류
    const heroSections = sections.filter(s => s.type === 'hero')
    const categorySections = sections.filter(s => s.type === 'category')
    const otherSections = sections.filter(s => !['hero', 'category'].includes(s.type))
    
    // 3. Hero 섹션 JSON 생성
    const heroData = {
      version: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'hero-sections',
      data: {
        slides: heroSections.map(section => {
          const content = section.content || {}
          const slides = content.slides || []
          
          return slides.map(slide => ({
            id: slide.id || `slide-${Date.now()}`,
            title: slide.title || '기본 타이틀',
            subtitle: slide.subtitle || '기본 서브타이틀',
            tag: slide.tag || null,
            bgColor: slide.bgColor || 'linear-gradient(to right, #3B82F6, #8B5CF6)',
            backgroundImage: slide.backgroundImage || null,
            link: slide.link || '/campaigns',
            buttonText: slide.buttonText || '캠페인 둘러보기',
            order: slide.order || 0,
            visible: slide.visible !== false
          }))
        }).flat().filter(slide => slide.visible)
      }
    }
    
    // 4. 카테고리 섹션 JSON 생성
    const categoryData = {
      version: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'category-sections',
      data: {
        categories: categorySections.map(section => {
          const content = section.content || {}
          const categories = content.categories || []
          
          return categories.map(category => ({
            id: category.id || `cat-${Date.now()}`,
            name: category.name || '기본 카테고리',
            slug: category.slug || category.name,
            icon: category.icon || 'Home',
            badge: category.badge || null,
            order: category.order || 0,
            visible: category.visible !== false
          }))
        }).flat().filter(cat => cat.visible)
      }
    }
    
    // 5. 전체 섹션 구조 JSON 생성
    const sectionsData = {
      version: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: 'ui-sections-structure',
      data: {
        sections: sections.map(section => ({
          id: section.id,
          type: section.type,
          sectionId: section.sectionId,
          title: section.title,
          subtitle: section.subtitle,
          order: section.order,
          visible: section.visible,
          hasContent: !!section.content
        })),
        sectionOrder: sections
          .sort((a, b) => a.order - b.order)
          .map(s => ({ id: s.id, type: s.type, order: s.order }))
      }
    }
    
    // 6. JSON 파일 저장
    const cacheDir = path.join(process.cwd(), 'public/cache/dynamic/homepage')
    
    await fs.writeFile(
      path.join(cacheDir, 'hero.json'),
      JSON.stringify(heroData, null, 2)
    )
    console.log('✅ Hero sections saved to hero.json')
    
    await fs.writeFile(
      path.join(cacheDir, 'categories.json'),
      JSON.stringify(categoryData, null, 2)
    )
    console.log('✅ Category sections saved to categories.json')
    
    await fs.writeFile(
      path.join(cacheDir, 'sections.json'),
      JSON.stringify(sectionsData, null, 2)
    )
    console.log('✅ All sections structure saved to sections.json')
    
    // 7. 백업도 생성
    await fs.writeFile(
      path.join(cacheDir, 'sections.backup.json'),
      JSON.stringify(sectionsData, null, 2)
    )
    
    await fs.writeFile(
      path.join(cacheDir, 'sections.default.json'),
      JSON.stringify({
        version: new Date().toISOString(),
        type: 'default-sections',
        data: {
          sections: [
            { id: 'hero-default', type: 'hero', order: 0, visible: true },
            { id: 'category-default', type: 'category', order: 1, visible: true },
            { id: 'campaigns-default', type: 'campaigns', order: 2, visible: true }
          ],
          sectionOrder: [
            { id: 'hero-default', type: 'hero', order: 0 },
            { id: 'category-default', type: 'category', order: 1 },
            { id: 'campaigns-default', type: 'campaigns', order: 2 }
          ]
        }
      }, null, 2)
    )
    console.log('✅ Default sections backup created')
    
    console.log('🎉 All sections extracted successfully!')
    
    return {
      sectionsCount: sections.length,
      heroSlides: heroData.data.slides.length,
      categories: categoryData.data.categories.length
    }
    
  } catch (error) {
    console.error('❌ Error extracting sections:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  extractSectionsToJson()
    .then(result => {
      console.log('📊 Extraction complete:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('Failed to extract sections:', error)
      process.exit(1)
    })
}

module.exports = { extractSectionsToJson }