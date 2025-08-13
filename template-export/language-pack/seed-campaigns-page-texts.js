// 캠페인 페이지에서 누락된 하드코딩 텍스트들을 LanguagePack에 추가하는 스크립트
const { PrismaClient } = require('@prisma/client')

async function addMissingCampaignsPageTexts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== 캠페인 페이지 누락된 텍스트들 LanguagePack 추가 시작 ===\n')

    // 캠페인 페이지에서 찾은 추가 하드코딩된 텍스트들
    const missingTexts = [
      // 히어로 섹션
      {
        key: 'campaigns.hero.title',
        ko: '진행 중인 캠페인',
        en: 'Ongoing Campaigns',
        jp: '進行中のキャンペーン',
        category: 'campaigns',
        description: '캠페인 페이지 히어로 제목'
      },
      {
        key: 'campaigns.hero.subtitle',
        ko: '당신에게 맞는 브랜드 캠페인을 찾아보세요',
        en: 'Find brand campaigns that suit you',
        jp: 'あなたに合ったブランドキャンペーンを見つけてください',
        category: 'campaigns',
        description: '캠페인 페이지 히어로 부제목'
      },

      // 필터 관련
      {
        key: 'campaigns.filter.all_platforms',
        ko: '모든 플랫폼',
        en: 'All Platforms',
        jp: 'すべてのプラットフォーム',
        category: 'campaigns',
        description: '모든 플랫폼 필터'
      },

      // 상태 메시지들
      {
        key: 'campaigns.status.total_campaigns_count',
        ko: '총 {count}개의 캠페인이 있습니다.',
        en: 'There are {count} campaigns in total.',
        jp: '合計{count}件のキャンペーンがあります。',
        category: 'campaigns',
        description: '총 캠페인 개수 표시'
      },
      {
        key: 'campaigns.status.no_campaigns_available',
        ko: '캠페인이 없습니다',
        en: 'No campaigns available',
        jp: 'キャンペーンがありません',
        category: 'campaigns',
        description: '캠페인 없음 메시지'
      },
      {
        key: 'campaigns.status.no_matching_campaigns',
        ko: '조건에 맞는 캠페인을 찾을 수 없습니다.',
        en: 'No campaigns match your criteria.',
        jp: '条件に合うキャンペーンが見つかりません。',
        category: 'campaigns',
        description: '조건에 맞는 캠페인 없음 메시지'
      },
      {
        key: 'campaigns.action.reset_filters',
        ko: '필터 초기화',
        en: 'Reset Filters',
        jp: 'フィルターリセット',
        category: 'campaigns',
        description: '필터 초기화 버튼'
      },

      // 에러 메시지들
      {
        key: 'error.campaigns_fetch_failed',
        ko: '캠페인 데이터를 가져오는데 실패했습니다.',
        en: 'Failed to fetch campaign data.',
        jp: 'キャンペーンデータの取得に失敗しました。',
        category: 'error',
        description: '캠페인 데이터 가져오기 실패'
      },
      {
        key: 'error.data_loading_failed_title',
        ko: '데이터 로딩 실패',
        en: 'Data Loading Failed',
        jp: 'データ読み込み失敗',
        category: 'error',
        description: '데이터 로딩 실패 제목'
      },
      {
        key: 'error.unknown_error_occurred',
        ko: '알 수 없는 오류가 발생했습니다.',
        en: 'An unknown error occurred.',
        jp: '不明なエラーが発生しました。',
        category: 'error',
        description: '알 수 없는 오류 메시지'
      },
      {
        key: 'auth.login_required_message',
        ko: '로그인이 필요합니다.',
        en: 'Login is required.',
        jp: 'ログインが必要です。',
        category: 'auth',
        description: '로그인 필요 메시지'
      },
      {
        key: 'error.like_processing_failed',
        ko: '좋아요 처리 중 오류가 발생했습니다.',
        en: 'An error occurred while processing the like.',
        jp: 'いいね処理中にエラーが発生しました。',
        category: 'error',
        description: '좋아요 처리 오류'
      },

      // 캠페인 카드 관련
      {
        key: 'campaigns.card.deadline_urgent',
        ko: '마감임박 D-{days}',
        en: 'Urgent D-{days}',
        jp: '締切迫る D-{days}',
        category: 'campaigns',
        description: '마감임박 배지'
      },
      {
        key: 'campaigns.card.applicant_count',
        ko: '{count}명 지원',
        en: '{count} applied',
        jp: '{count}名応募',
        category: 'campaigns',
        description: '지원자 수 표시'
      },
      {
        key: 'campaigns.card.followers_required',
        ko: '팔로워 {count}+',
        en: 'Followers {count}+',
        jp: 'フォロワー {count}+',
        category: 'campaigns',
        description: '팔로워 수 요구사항'
      },
      {
        key: 'campaigns.card.days_left',
        ko: 'D-{days}',
        en: 'D-{days}',
        jp: 'D-{days}',
        category: 'campaigns',
        description: '남은 일수 표시'
      },

      // 페이지네이션
      {
        key: 'pagination.previous',
        ko: '이전',
        en: 'Previous',
        jp: '前',
        category: 'pagination',
        description: '이전 페이지 버튼'
      },
      {
        key: 'pagination.next',
        ko: '다음',
        en: 'Next',
        jp: '次',
        category: 'pagination',
        description: '다음 페이지 버튼'
      },

      // CTA 섹션
      {
        key: 'campaigns.cta.not_found_title',
        ko: '원하는 캠페인을 찾지 못하셨나요?',
        en: "Couldn't find the campaign you want?",
        jp: 'お探しのキャンペーンが見つかりませんでしたか？',
        category: 'campaigns',
        description: 'CTA 섹션 제목'
      },
      {
        key: 'campaigns.cta.profile_register_desc',
        ko: '프로필을 등록하면 맞춤 캠페인 추천을 받을 수 있습니다.',
        en: 'Register your profile to receive personalized campaign recommendations.',
        jp: 'プロフィールを登録すると、カスタマイズされたキャンペーンの推薦を受けることができます。',
        category: 'campaigns',
        description: 'CTA 섹션 설명'
      },
      {
        key: 'campaigns.cta.register_as_influencer',
        ko: '인플루언서로 등록하기',
        en: 'Register as Influencer',
        jp: 'インフルエンサーとして登録する',
        category: 'campaigns',
        description: '인플루언서 등록 버튼'
      }
    ]

    console.log(`총 ${missingTexts.length}개의 캠페인 페이지 누락된 텍스트를 추가합니다...\n`)

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

    console.log('\n=== 캠페인 페이지 누락된 텍스트 추가 완료 ===')
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
    console.error('캠페인 페이지 누락된 텍스트 추가 중 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMissingCampaignsPageTexts()