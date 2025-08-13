// 사용자 페이지의 LanguagePack에 UI 텍스트 추가하는 스크립트
const { PrismaClient } = require('@prisma/client')

async function seedUserPageLanguagePack() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== 사용자 페이지 LanguagePack 시드 데이터 추가 시작 ===\n')

    // 메인 페이지 텍스트
    const homePageTexts = [
      {
        key: 'home.hero.title',
        ko: '인플루언서 마케팅의 새로운 기준',
        en: 'A New Standard for Influencer Marketing',
        jp: 'インフルエンサーマーケティングの新しい基準',
        category: 'homepage',
        description: '메인 페이지 히어로 제목'
      },
      {
        key: 'home.hero.subtitle',
        ko: '브랜드와 인플루언서를 연결하는 혁신적인 플랫폼',
        en: 'An innovative platform connecting brands and influencers',
        jp: 'ブランドとインフルエンサーを繋ぐ革新的なプラットフォーム',
        category: 'homepage',
        description: '메인 페이지 히어로 부제목'
      },
      {
        key: 'home.campaigns.title',
        ko: '추천 캠페인',
        en: 'Recommended Campaigns',
        jp: 'おすすめキャンペーン',
        category: 'homepage',
        description: '추천 캠페인 섹션 제목'
      },
      {
        key: 'home.campaigns.view_all',
        ko: '전체보기',
        en: 'View All',
        jp: 'すべて見る',
        category: 'homepage',
        description: '전체보기 버튼'
      },
      {
        key: 'home.cta.title',
        ko: '지금 바로 시작하세요',
        en: 'Start Now',
        jp: '今すぐ始めましょう',
        category: 'homepage',
        description: 'CTA 섹션 제목'
      },
      {
        key: 'home.cta.subtitle',
        ko: '브랜드든 인플루언서든, 당신의 성공 스토리를 만들어보세요',
        en: 'Whether you are a brand or influencer, create your success story',
        jp: 'ブランドでもインフルエンサーでも、あなたの成功ストーリーを作ってみてください',
        category: 'homepage',
        description: 'CTA 섹션 부제목'
      },
      {
        key: 'home.cta.brand_button',
        ko: '브랜드로 시작하기',
        en: 'Start as Brand',
        jp: 'ブランドとして始める',
        category: 'homepage',
        description: '브랜드 시작하기 버튼'
      },
      {
        key: 'home.cta.influencer_button',
        ko: '인플루언서로 시작하기',
        en: 'Start as Influencer',
        jp: 'インフルエンサーとして始める',
        category: 'homepage',
        description: '인플루언서 시작하기 버튼'
      }
    ]

    // 캠페인 페이지 텍스트
    const campaignsPageTexts = [
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
      // 카테고리 필터
      {
        key: 'campaigns.category.all',
        ko: '전체',
        en: 'All',
        jp: 'すべて',
        category: 'campaigns',
        description: '전체 카테고리'
      },
      {
        key: 'campaigns.category.fashion',
        ko: '패션',
        en: 'Fashion',
        jp: 'ファッション',
        category: 'campaigns',
        description: '패션 카테고리'
      },
      {
        key: 'campaigns.category.beauty',
        ko: '뷰티',
        en: 'Beauty',
        jp: 'ビューティー',
        category: 'campaigns',
        description: '뷰티 카테고리'
      },
      {
        key: 'campaigns.category.food',
        ko: '음식',
        en: 'Food',
        jp: '食べ物',
        category: 'campaigns',
        description: '음식 카테고리'
      },
      {
        key: 'campaigns.category.travel',
        ko: '여행',
        en: 'Travel',
        jp: '旅行',
        category: 'campaigns',
        description: '여행 카테고리'
      },
      {
        key: 'campaigns.category.tech',
        ko: '기술',
        en: 'Technology',
        jp: '技術',
        category: 'campaigns',
        description: '기술 카테고리'
      },
      {
        key: 'campaigns.category.lifestyle',
        ko: '라이프스타일',
        en: 'Lifestyle',
        jp: 'ライフスタイル',
        category: 'campaigns',
        description: '라이프스타일 카테고리'
      },
      {
        key: 'campaigns.category.sports',
        ko: '스포츠',
        en: 'Sports',
        jp: 'スポーツ',
        category: 'campaigns',
        description: '스포츠 카테고리'
      },
      {
        key: 'campaigns.category.game',
        ko: '게임',
        en: 'Game',
        jp: 'ゲーム',
        category: 'campaigns',
        description: '게임 카테고리'
      },
      {
        key: 'campaigns.category.education',
        ko: '교육',
        en: 'Education',
        jp: '教育',
        category: 'campaigns',
        description: '교육 카테고리'
      },
      {
        key: 'campaigns.category.health',
        ko: '헬스',
        en: 'Health',
        jp: 'ヘルス',
        category: 'campaigns',
        description: '헬스 카테고리'
      },
      // 플랫폼 필터
      {
        key: 'campaigns.platform.all',
        ko: '모든 플랫폼',
        en: 'All Platforms',
        jp: 'すべてのプラットフォーム',
        category: 'campaigns',
        description: '모든 플랫폼 옵션'
      },
      // 정렬 옵션
      {
        key: 'campaigns.sort.latest',
        ko: '최신순',
        en: 'Latest',
        jp: '最新順',
        category: 'campaigns',
        description: '최신순 정렬'
      },
      {
        key: 'campaigns.sort.deadline',
        ko: '마감임박순',
        en: 'Deadline',
        jp: '締切順',
        category: 'campaigns',
        description: '마감임박순 정렬'
      },
      {
        key: 'campaigns.sort.popular',
        ko: '인기순',
        en: 'Popular',
        jp: '人気順',
        category: 'campaigns',
        description: '인기순 정렬'
      },
      // 상태 메시지
      {
        key: 'campaigns.status.total_count',
        ko: '총 {count}개의 캠페인이 있습니다.',
        en: 'There are {count} campaigns in total.',
        jp: '合計{count}件のキャンペーンがあります。',
        category: 'campaigns',
        description: '총 캠페인 개수 표시'
      },
      {
        key: 'campaigns.status.no_campaigns',
        ko: '캠페인이 없습니다',
        en: 'No campaigns available',
        jp: 'キャンペーンがありません',
        category: 'campaigns',
        description: '캠페인 없음 메시지'
      },
      {
        key: 'campaigns.status.no_matching',
        ko: '조건에 맞는 캠페인을 찾을 수 없습니다.',
        en: 'No campaigns match your criteria.',
        jp: '条件に合うキャンペーンが見つかりません。',
        category: 'campaigns',
        description: '조건에 맞는 캠페인 없음'
      },
      {
        key: 'campaigns.action.reset_filter',
        ko: '필터 초기화',
        en: 'Reset Filter',
        jp: 'フィルターリセット',
        category: 'campaigns',
        description: '필터 초기화 버튼'
      },
      {
        key: 'campaigns.card.deadline_badge',
        ko: '마감임박 D-{days}',
        en: 'Deadline D-{days}',
        jp: '締切迫る D-{days}',
        category: 'campaigns',
        description: '마감임박 배지'
      },
      {
        key: 'campaigns.card.applicants',
        ko: '{count}명 지원',
        en: '{count} applicants',
        jp: '{count}名応募',
        category: 'campaigns',
        description: '지원자 수 표시'
      },
      {
        key: 'campaigns.card.followers',
        ko: '팔로워 {count}+',
        en: 'Followers {count}+',
        jp: 'フォロワー {count}+',
        category: 'campaigns',
        description: '팔로워 수 요구사항'
      },
      // 페이지네이션
      {
        key: 'campaigns.pagination.previous',
        ko: '이전',
        en: 'Previous',
        jp: '前',
        category: 'campaigns',
        description: '이전 페이지 버튼'
      },
      {
        key: 'campaigns.pagination.next',
        ko: '다음',
        en: 'Next',
        jp: '次',
        category: 'campaigns',
        description: '다음 페이지 버튼'
      },
      // CTA 섹션
      {
        key: 'campaigns.cta.title',
        ko: '원하는 캠페인을 찾지 못하셨나요?',
        en: "Couldn't find the campaign you want?",
        jp: 'お探しのキャンペーンが見つかりませんでしたか？',
        category: 'campaigns',
        description: 'CTA 섹션 제목'
      },
      {
        key: 'campaigns.cta.subtitle',
        ko: '프로필을 등록하면 맞춤 캠페인 추천을 받을 수 있습니다.',
        en: 'Register your profile to receive personalized campaign recommendations.',
        jp: 'プロフィールを登録すると、カスタマイズされたキャンペーンの推薦を受けることができます。',
        category: 'campaigns',
        description: 'CTA 섹션 부제목'
      },
      {
        key: 'campaigns.cta.register_button',
        ko: '인플루언서로 등록하기',
        en: 'Register as Influencer',
        jp: 'インフルエンサーとして登録する',
        category: 'campaigns',
        description: '인플루언서 등록 버튼'
      }
    ]

    // 공통 에러 메시지
    const errorMessages = [
      {
        key: 'error.fetch_campaigns_failed',
        ko: '캠페인 데이터를 가져오는데 실패했습니다.',
        en: 'Failed to fetch campaign data.',
        jp: 'キャンペーンデータの取得に失敗しました。',
        category: 'error',
        description: '캠페인 데이터 로딩 실패'
      },
      {
        key: 'error.unknown_error',
        ko: '알 수 없는 오류가 발생했습니다.',
        en: 'An unknown error occurred.',
        jp: '不明なエラーが発生しました。',
        category: 'error',
        description: '알 수 없는 오류'
      },
      {
        key: 'error.login_required',
        ko: '로그인이 필요합니다.',
        en: 'Login is required.',
        jp: 'ログインが必要です。',
        category: 'error',
        description: '로그인 필요 메시지'
      },
      {
        key: 'error.like_failed',
        ko: '좋아요 처리 중 오류가 발생했습니다.',
        en: 'An error occurred while processing the like.',
        jp: 'いいね処理中にエラーが発生しました。',
        category: 'error',
        description: '좋아요 처리 오류'
      },
      {
        key: 'error.data_loading_failed',
        ko: '데이터 로딩 실패',
        en: 'Data loading failed',
        jp: 'データ読み込み失敗',
        category: 'error',
        description: '데이터 로딩 실패'
      },
      {
        key: 'action.retry',
        ko: '다시 시도',
        en: 'Retry',
        jp: '再試行',
        category: 'action',
        description: '다시 시도 버튼'
      }
    ]

    // 모든 텍스트 합치기
    const allTexts = [
      ...homePageTexts,
      ...campaignsPageTexts,
      ...errorMessages
    ]

    console.log(`총 ${allTexts.length}개의 사용자 페이지 언어팩 항목을 추가합니다...\n`)

    // 데이터베이스에 추가
    let addedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const text of allTexts) {
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

    console.log('\n=== 사용자 페이지 LanguagePack 시드 데이터 추가 완료 ===')
    console.log(`추가됨: ${addedCount}개`)
    console.log(`건너뜀: ${skippedCount}개`)
    console.log(`오류: ${errorCount}개`)
    
    // 추가된 데이터 확인
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
    console.error('사용자 페이지 시드 데이터 추가 중 오류:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedUserPageLanguagePack()