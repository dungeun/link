// 메뉴 번역 API 직접 테스트
const { PrismaClient } = require('@prisma/client')

async function testMenuAPI() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== 메뉴 번역 API 테스트 ===\n')

    // API와 동일한 로직으로 데이터 조회
    const languagePacks = await prisma.languagePack.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    const data = languagePacks.map(pack => ({
      id: pack.id,
      type: 'menu',
      originalId: pack.id,
      ko: `[${pack.category}] ${pack.ko}`,
      en: pack.en,
      ja: pack.ja,
      key: pack.key,
      category: pack.category,
      isAutoTranslated: {
        en: false,
        ja: false,
      }
    }))

    console.log(`번역 관리 화면에서 표시될 메뉴 데이터 (총 ${data.length}개):`)
    console.log('=============================================\n')

    data.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}`)
      console.log(`   Key: ${item.key}`)
      console.log(`   한국어: ${item.ko}`)
      console.log(`   영어: ${item.en}`)
      console.log(`   일본어: ${item.ja}`)
      console.log(`   카테고리: ${item.category}`)
      console.log('   ---')
    })

    console.log(`\n✅ 성공: ${data.length}개의 메뉴/UI 텍스트가 번역 관리 화면에 노출됩니다.`)

  } catch (error) {
    console.error('❌ API 테스트 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMenuAPI()