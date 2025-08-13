// 메인 페이지에서 누락된 하드코딩 텍스트들을 LanguagePack에 추가하는 스크립트
const { PrismaClient } = require('@prisma/client')

async function addMissingHomepageTexts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== 메인 페이지 누락된 텍스트들 LanguagePack 추가 시작 ===\n')

    // 메인 페이지에서 찾은 하드코딩된 텍스트들
    const missingTexts = [
      // 배너 및 슬라이드 관련
      {
        key: 'home.banner.view_more',
        ko: '자세히 보기',
        en: 'View More',
        jp: 'もっと見る',
        category: 'homepage',
        description: '배너 자세히 보기 버튼'
      },
      
      // 랭킹 섹션 관련
      {
        key: 'home.ranking.view_all',
        ko: '전체보기',
        en: 'View All',
        jp: 'すべて見る',
        category: 'homepage',
        description: '랭킹 섹션 전체보기 버튼'
      },
      {
        key: 'home.ranking.days_left',
        ko: 'D-{days}',
        en: 'D-{days}',
        jp: 'D-{days}',
        category: 'homepage',
        description: '마감일 표시'
      },
      {
        key: 'home.ranking.applicants',
        ko: '신청 {current}/{max}',
        en: 'Applied {current}/{max}',
        jp: '応募 {current}/{max}',
        category: 'homepage',
        description: '신청자 수 표시'
      },

      // 추천 캠페인 섹션
      {
        key: 'home.recommended.title',
        ko: '추천 캠페인',
        en: 'Recommended Campaigns',
        jp: 'おすすめキャンペーン',
        category: 'homepage',
        description: '추천 캠페인 섹션 제목'
      },
      {
        key: 'home.recommended.view_all',
        ko: '전체보기',
        en: 'View All',
        jp: 'すべて見る',
        category: 'homepage',
        description: '추천 캠페인 전체보기'
      },
      {
        key: 'home.recommended.applicants_count',
        ko: '지원 {current}/{max}명',
        en: 'Applied {current}/{max}',
        jp: '応募 {current}/{max}名',
        category: 'homepage',
        description: '지원자 수 표시'
      },
      {
        key: 'home.recommended.days_remaining',
        ko: '{days}일 남음',
        en: '{days} days left',
        jp: '{days}日残り',
        category: 'homepage',
        description: '남은 일수 표시'
      },

      // 커스텀 섹션 관련
      {
        key: 'home.custom.more_button_default',
        ko: '더보기',
        en: 'More',
        jp: 'もっと見る',
        category: 'homepage',
        description: '커스텀 섹션 기본 더보기 버튼'
      },

      // 하단 CTA 섹션 (중복 제거된 새로운 것들)
      {
        key: 'home.bottom_cta.title',
        ko: '지금 바로 시작하세요',
        en: 'Start Now',
        jp: '今すぐ始めましょう',
        category: 'homepage',
        description: '하단 CTA 제목'
      },
      {
        key: 'home.bottom_cta.subtitle',
        ko: '5분이면 충분합니다. 복잡한 절차 없이 바로 시작할 수 있어요.',
        en: '5 minutes is enough. You can start right away without complicated procedures.',
        jp: '5分で十分です。複雑な手続きなしで、すぐに始めることができます。',
        category: 'homepage',
        description: '하단 CTA 설명'
      },
      {
        key: 'home.bottom_cta.brand_button',
        ko: '브랜드로 시작하기',
        en: 'Start as Brand',
        jp: 'ブランドとして始める',
        category: 'homepage',
        description: '하단 브랜드 시작 버튼'
      },
      {
        key: 'home.bottom_cta.influencer_button',
        ko: '인플루언서로 시작하기',
        en: 'Start as Influencer',
        jp: 'インフルエンサーとして始める',
        category: 'homepage',
        description: '하단 인플루언서 시작 버튼'
      },

      // 기타 공통 요소들
      {
        key: 'common.arrow_right',
        ko: '→',
        en: '→',
        jp: '→',
        category: 'common',
        description: '화살표 아이콘 대체 텍스트'
      },
      {
        key: 'common.loading',
        ko: '로딩 중...',
        en: 'Loading...',
        jp: '読み込み中...',
        category: 'common',
        description: '로딩 상태 텍스트'
      },
      {
        key: 'common.no_image',
        ko: '이미지 없음',
        en: 'No Image',
        jp: '画像なし',
        category: 'common',
        description: '이미지 없을 때 표시'
      },

      // 배지 및 라벨
      {
        key: 'badge.hot',
        ko: 'HOT',
        en: 'HOT',
        jp: 'HOT',
        category: 'common',
        description: 'HOT 배지'
      },
      {
        key: 'badge.new',
        ko: '신규',
        en: 'NEW',
        jp: '新規',
        category: 'common',
        description: '신규 배지'
      },

      // 플랫폼 아이콘 대체 텍스트들
      {
        key: 'platform.instagram',
        ko: '인스타그램',
        en: 'Instagram',
        jp: 'インスタグラム',
        category: 'platform',
        description: '인스타그램 플랫폼'
      },
      {
        key: 'platform.youtube',
        ko: '유튜브',
        en: 'YouTube',
        jp: 'YouTube',
        category: 'platform',
        description: '유튜브 플랫폼'
      },
      {
        key: 'platform.tiktok',
        ko: '틱톡',
        en: 'TikTok',
        jp: 'TikTok',
        category: 'platform',
        description: '틱톡 플랫폼'
      },
      {
        key: 'platform.blog',
        ko: '블로그',
        en: 'Blog',
        jp: 'ブログ',
        category: 'platform',
        description: '블로그 플랫폼'
      },

      // 순위 관련
      {
        key: 'ranking.first_place',
        ko: '1위',
        en: '1st',
        jp: '1位',
        category: 'ranking',
        description: '1등 순위'
      },
      {
        key: 'ranking.second_place',
        ko: '2위',
        en: '2nd',
        jp: '2位',
        category: 'ranking',
        description: '2등 순위'
      },
      {
        key: 'ranking.third_place',
        ko: '3위',
        en: '3rd',
        jp: '3位',
        category: 'ranking',
        description: '3등 순위'
      }
    ]

    console.log(`총 ${missingTexts.length}개의 누락된 텍스트를 추가합니다...\n`)

    // 데이터베이스에 추가
    let addedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const text of missingTexts) {
      try {
        const result = await prisma.languagePack.create({
          data: text
        })
        console.log(`✓ ${text.key}: "${text.ko}"`)
        addedCount++
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠ ${text.key}: 이미 존재함 (건너뜀)`)
          skippedCount++
        } else {
          console.error(`✗ ${text.key}: 오류 -`, error.message)
          errorCount++
        }
      }
    }

    console.log('\n=== 누락된 텍스트 추가 완료 ===')
    console.log(`추가됨: ${addedCount}개`)
    console.log(`건너뜀: ${skippedCount}개`)
    console.log(`오류: ${errorCount}개`)
    
    // 전체 개수 확인
    const totalCount = await prisma.languagePack.count()
    console.log(`현재 LanguagePack 테이블에 총 ${totalCount}개의 항목이 있습니다.`)

    // 카테고리별 개수 확인
    const categoryStats = await prisma.languagePack.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        category: 'asc'
      }
    })

    console.log('\n카테고리별 통계:')
    categoryStats.forEach(stat => {
      console.log(`- ${stat.category}: ${stat._count.category}개`)
    })

  } catch (error) {
    console.error('누락된 텍스트 추가 중 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMissingHomepageTexts()