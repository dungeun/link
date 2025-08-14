/**
 * 기존 캠페인에 기본 카테고리 설정
 * 모든 기존 캠페인을 '캠페인' 대분류로 설정
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('캠페인 카테고리 마이그레이션 시작...')
    
    // mainCategory가 null인 모든 캠페인 찾기
    const campaignsToUpdate = await prisma.campaign.findMany({
      where: {
        mainCategory: null
      },
      select: {
        id: true,
        title: true
      }
    })
    
    console.log(`업데이트할 캠페인 수: ${campaignsToUpdate.length}`)
    
    if (campaignsToUpdate.length === 0) {
      console.log('업데이트할 캠페인이 없습니다.')
      return
    }
    
    // 모든 캠페인을 '캠페인' 대분류로 설정
    const result = await prisma.campaign.updateMany({
      where: {
        mainCategory: null
      },
      data: {
        mainCategory: '캠페인'
      }
    })
    
    console.log(`✅ ${result.count}개의 캠페인이 성공적으로 업데이트되었습니다.`)
    
    // 업데이트된 캠페인 확인
    const updated = await prisma.campaign.findMany({
      where: {
        mainCategory: '캠페인'
      },
      select: {
        id: true,
        title: true,
        mainCategory: true,
        category: true
      }
    })
    
    console.log('\n📊 업데이트된 캠페인 현황:')
    console.log(`- 캠페인 대분류: ${updated.length}개`)
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })