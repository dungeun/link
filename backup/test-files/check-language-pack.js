// LanguagePack 테이블 현재 상태 확인
const { PrismaClient } = require('@prisma/client')

async function checkLanguagePack() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== LanguagePack 테이블 현재 데이터 ===')
    const languagePacks = await prisma.languagePack.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })
    
    if (languagePacks.length === 0) {
      console.log('LanguagePack 테이블이 비어있습니다.')
    } else {
      console.log(`총 ${languagePacks.length}개의 언어팩 데이터가 있습니다.\n`)
      
      // 카테고리별로 그룹화
      const categories = {}
      languagePacks.forEach(pack => {
        if (!categories[pack.category]) {
          categories[pack.category] = []
        }
        categories[pack.category].push(pack)
      })
      
      Object.keys(categories).forEach(category => {
        console.log(`\n[${category}] 카테고리:`)
        categories[category].forEach(pack => {
          console.log(`  ${pack.key}: "${pack.ko}" | "${pack.en}" | "${pack.ja}"`)
        })
      })
    }
    
  } catch (error) {
    console.error('데이터베이스 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLanguagePack()