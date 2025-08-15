const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// 전체 사이트에서 사용되는 모든 언어팩 키 정의
const ALL_LANGUAGE_KEYS = {
  // 헤더 관련
  header: {
    logo: { text: '링크픽', en: 'LinkPick', jp: 'リンクピック' },
    menu: {
      home: { ko: '홈', en: 'Home', jp: 'ホーム' },
      campaigns: { ko: '캠페인', en: 'Campaigns', jp: 'キャンペーン' },
      influencers: { ko: '인플루언서', en: 'Influencers', jp: 'インフルエンサー' },
      community: { ko: '커뮤니티', en: 'Community', jp: 'コミュニティ' },
      about: { ko: '소개', en: 'About', jp: '紹介' },
      pricing: { ko: '요금제', en: 'Pricing', jp: '料金プラン' },
    },
    cta: {
      start: { ko: '시작하기', en: 'Get Started', jp: '始める' },
      login: { ko: '로그인', en: 'Login', jp: 'ログイン' },
      register: { ko: '회원가입', en: 'Sign Up', jp: '会員登録' },
      logout: { ko: '로그아웃', en: 'Logout', jp: 'ログアウト' },
      mypage: { ko: '마이페이지', en: 'My Page', jp: 'マイページ' },
    }
  },

  // 푸터 관련
  footer: {
    description: { ko: '브랜드와 인플루언서를 연결하는 스마트한 마케팅 플랫폼', en: 'Smart marketing platform connecting brands and influencers', jp: 'ブランドとインフルエンサーをつなぐスマートマーケティングプラットフォーム' },
    company: {
      title: { ko: '회사', en: 'Company', jp: '会社' },
      about: { ko: '회사소개', en: 'About Us', jp: '会社紹介' },
      contact: { ko: '문의하기', en: 'Contact', jp: 'お問い合わせ' },
      careers: { ko: '채용', en: 'Careers', jp: '採用' },
    },
    legal: {
      title: { ko: '법적 고지', en: 'Legal', jp: '法的通知' },
      terms: { ko: '이용약관', en: 'Terms of Service', jp: '利用規約' },
      privacy: { ko: '개인정보처리방침', en: 'Privacy Policy', jp: 'プライバシーポリシー' },
    },
    support: {
      title: { ko: '고객지원', en: 'Support', jp: 'サポート' },
      hours: { ko: '평일 09:00~18:00 (주말/공휴일 휴무)', en: 'Weekdays 09:00~18:00 (Closed on weekends/holidays)', jp: '平日 09:00~18:00（週末・祝日休み）' },
    },
    info: {
      ceo: { ko: '대표', en: 'CEO', jp: '代表' },
      businessNo: { ko: '사업자등록번호', en: 'Business Registration No.', jp: '事業者登録番号' },
      telecom: { ko: '통신판매업', en: 'E-commerce Permit', jp: '通信販売業' },
    },
    copyright: { ko: '© 2024 LinkPick. All rights reserved.', en: '© 2024 LinkPick. All rights reserved.', jp: '© 2024 LinkPick. All rights reserved.' }
  },

  // 홈페이지 메인 섹션
  hero: {
    slide1: {
      tag: { ko: '🚀 새로운 시작', en: '🚀 New Beginning', jp: '🚀 新しいスタート' },
      title: { ko: '인플루언서 마케팅의\n새로운 기준', en: 'New Standard for\nInfluencer Marketing', jp: 'インフルエンサーマーケティングの\n新しい基準' },
      subtitle: { ko: '브랜드와 인플루언서를 연결하는 가장 스마트한 방법', en: 'The smartest way to connect brands and influencers', jp: 'ブランドとインフルエンサーをつなぐ最もスマートな方法' },
    },
    slide2: {
      title: { ko: '검증된 인플루언서와\n함께하세요', en: 'Work with\nVerified Influencers', jp: '検証済みインフルエンサーと\n一緒に' },
      subtitle: { ko: '데이터 기반 매칭으로 최적의 파트너를 찾아드립니다', en: 'Find the perfect partner with data-driven matching', jp: 'データ基盤マッチングで最適なパートナーを見つけます' },
    },
    slide3: {
      title: { ko: '간편한 캠페인 관리', en: 'Easy Campaign Management', jp: '簡単なキャンペーン管理' },
      subtitle: { ko: '클릭 몇 번으로 캠페인을 생성하고 관리하세요', en: 'Create and manage campaigns with just a few clicks', jp: '数回のクリックでキャンペーンを作成・管理' },
    },
    slide4: {
      tag: { ko: '💎 프리미엄', en: '💎 Premium', jp: '💎 プレミアム' },
      title: { ko: '실시간 성과 분석', en: 'Real-time Performance Analysis', jp: 'リアルタイム成果分析' },
      subtitle: { ko: '캠페인 성과를 실시간으로 모니터링하세요', en: 'Monitor campaign performance in real-time', jp: 'キャンペーン成果をリアルタイムでモニタリング' },
    },
    slide5: {
      title: { ko: '투명한 정산 시스템', en: 'Transparent Settlement System', jp: '透明な精算システム' },
      subtitle: { ko: '자동화된 정산으로 편리하고 정확하게', en: 'Convenient and accurate with automated settlement', jp: '自動化された精算で便利で正確に' },
    },
    slide6: {
      tag: { ko: '🎯 목표 달성', en: '🎯 Goal Achievement', jp: '🎯 目標達成' },
      title: { ko: '함께 성장하는 파트너', en: 'Growing Together as Partners', jp: '共に成長するパートナー' },
      subtitle: { ko: '링크픽과 함께 마케팅 목표를 달성하세요', en: 'Achieve your marketing goals with LinkPick', jp: 'LinkPickと一緒にマーケティング目標を達成' },
    }
  },

  // 카테고리
  category: {
    beauty: { ko: '뷰티', en: 'Beauty', jp: 'ビューティー' },
    fashion: { ko: '패션', en: 'Fashion', jp: 'ファッション' },
    food: { ko: '맛집', en: 'Food', jp: 'グルメ' },
    travel: { ko: '여행', en: 'Travel', jp: '旅行' },
    tech: { ko: 'IT/테크', en: 'Tech', jp: 'IT/テック' },
    fitness: { ko: '운동/건강', en: 'Fitness', jp: 'フィットネス' },
    lifestyle: { ko: '라이프스타일', en: 'Lifestyle', jp: 'ライフスタイル' },
    pet: { ko: '반려동물', en: 'Pet', jp: 'ペット' },
    parenting: { ko: '육아', en: 'Parenting', jp: '育児' },
    education: { ko: '교육', en: 'Education', jp: '教育' },
    game: { ko: '게임', en: 'Gaming', jp: 'ゲーム' },
    music: { ko: '음악', en: 'Music', jp: '音楽' },
  },

  // 퀵링크
  quicklink: {
    events: { ko: '이벤트', en: 'Events', jp: 'イベント' },
    coupons: { ko: '쿠폰', en: 'Coupons', jp: 'クーポン' },
    ranking: { ko: '랭킹', en: 'Ranking', jp: 'ランキング' },
  },

  // 프로모션 배너
  promo: {
    title: { ko: '첫 캠페인 20% 할인', en: '20% off your first campaign', jp: '初回キャンペーン20%割引' },
    subtitle: { ko: '지금 시작하고 특별 혜택을 받으세요', en: 'Start now and get special benefits', jp: '今すぐ始めて特別特典を受け取る' },
  },

  // 공통 버튼/액션
  common: {
    button: {
      save: { ko: '저장', en: 'Save', jp: '保存' },
      cancel: { ko: '취소', en: 'Cancel', jp: 'キャンセル' },
      delete: { ko: '삭제', en: 'Delete', jp: '削除' },
      edit: { ko: '수정', en: 'Edit', jp: '編集' },
      add: { ko: '추가', en: 'Add', jp: '追加' },
      search: { ko: '검색', en: 'Search', jp: '検索' },
      filter: { ko: '필터', en: 'Filter', jp: 'フィルター' },
      apply: { ko: '지원하기', en: 'Apply', jp: '応募' },
      submit: { ko: '제출', en: 'Submit', jp: '提出' },
      confirm: { ko: '확인', en: 'Confirm', jp: '確認' },
      close: { ko: '닫기', en: 'Close', jp: '閉じる' },
      next: { ko: '다음', en: 'Next', jp: '次へ' },
      prev: { ko: '이전', en: 'Previous', jp: '前へ' },
      back: { ko: '뒤로', en: 'Back', jp: '戻る' },
      more: { ko: '더보기', en: 'More', jp: 'もっと見る' },
      upload: { ko: '업로드', en: 'Upload', jp: 'アップロード' },
      download: { ko: '다운로드', en: 'Download', jp: 'ダウンロード' },
      refresh: { ko: '새로고침', en: 'Refresh', jp: 'リフレッシュ' },
    },
    status: {
      pending: { ko: '대기중', en: 'Pending', jp: '待機中' },
      approved: { ko: '승인됨', en: 'Approved', jp: '承認済み' },
      rejected: { ko: '거절됨', en: 'Rejected', jp: '拒否' },
      completed: { ko: '완료', en: 'Completed', jp: '完了' },
      active: { ko: '진행중', en: 'Active', jp: '進行中' },
      inactive: { ko: '비활성', en: 'Inactive', jp: '非アクティブ' },
      draft: { ko: '임시저장', en: 'Draft', jp: '下書き' },
    },
    message: {
      loading: { ko: '로딩중...', en: 'Loading...', jp: '読み込み中...' },
      noData: { ko: '데이터가 없습니다', en: 'No data available', jp: 'データがありません' },
      error: { ko: '오류가 발생했습니다', en: 'An error occurred', jp: 'エラーが発生しました' },
      success: { ko: '성공적으로 완료되었습니다', en: 'Successfully completed', jp: '正常に完了しました' },
      required: { ko: '필수 입력 항목입니다', en: 'This field is required', jp: '必須入力項目です' },
      invalidEmail: { ko: '올바른 이메일 주소를 입력하세요', en: 'Please enter a valid email address', jp: '正しいメールアドレスを入力してください' },
      passwordMismatch: { ko: '비밀번호가 일치하지 않습니다', en: 'Passwords do not match', jp: 'パスワードが一致しません' },
    },
    label: {
      email: { ko: '이메일', en: 'Email', jp: 'メール' },
      password: { ko: '비밀번호', en: 'Password', jp: 'パスワード' },
      name: { ko: '이름', en: 'Name', jp: '名前' },
      phone: { ko: '전화번호', en: 'Phone', jp: '電話番号' },
      address: { ko: '주소', en: 'Address', jp: '住所' },
      date: { ko: '날짜', en: 'Date', jp: '日付' },
      time: { ko: '시간', en: 'Time', jp: '時間' },
      price: { ko: '가격', en: 'Price', jp: '価格' },
      quantity: { ko: '수량', en: 'Quantity', jp: '数量' },
      total: { ko: '합계', en: 'Total', jp: '合計' },
      description: { ko: '설명', en: 'Description', jp: '説明' },
      title: { ko: '제목', en: 'Title', jp: 'タイトル' },
      content: { ko: '내용', en: 'Content', jp: '内容' },
      category: { ko: '카테고리', en: 'Category', jp: 'カテゴリー' },
      tag: { ko: '태그', en: 'Tag', jp: 'タグ' },
      image: { ko: '이미지', en: 'Image', jp: '画像' },
      file: { ko: '파일', en: 'File', jp: 'ファイル' },
    },
    time: {
      second: { ko: '초', en: 'second', jp: '秒' },
      minute: { ko: '분', en: 'minute', jp: '分' },
      hour: { ko: '시간', en: 'hour', jp: '時間' },
      day: { ko: '일', en: 'day', jp: '日' },
      week: { ko: '주', en: 'week', jp: '週' },
      month: { ko: '월', en: 'month', jp: '月' },
      year: { ko: '년', en: 'year', jp: '年' },
      today: { ko: '오늘', en: 'Today', jp: '今日' },
      yesterday: { ko: '어제', en: 'Yesterday', jp: '昨日' },
      tomorrow: { ko: '내일', en: 'Tomorrow', jp: '明日' },
    }
  },

  // 마이페이지
  mypage: {
    tabs: {
      overview: { ko: '대시보드', en: 'Dashboard', jp: 'ダッシュボード' },
      profile: { ko: '프로필', en: 'Profile', jp: 'プロフィール' },
      campaigns: { ko: '캠페인', en: 'Campaigns', jp: 'キャンペーン' },
      earnings: { ko: '수익', en: 'Earnings', jp: '収益' },
      favorites: { ko: '관심목록', en: 'Favorites', jp: 'お気に入り' },
      settings: { ko: '설정', en: 'Settings', jp: '設定' },
    },
    profile: {
      personal: { ko: '개인정보', en: 'Personal Info', jp: '個人情報' },
      banking: { ko: '계좌정보', en: 'Bank Account', jp: '口座情報' },
      sns: { ko: 'SNS 계정연동', en: 'SNS Integration', jp: 'SNS連携' },
      saveSuccess: { ko: '프로필이 저장되었습니다', en: 'Profile saved successfully', jp: 'プロフィールが保存されました' },
      saveError: { ko: '프로필 저장에 실패했습니다', en: 'Failed to save profile', jp: 'プロフィール保存に失敗しました' },
    },
    stats: {
      totalCampaigns: { ko: '총 캠페인', en: 'Total Campaigns', jp: '総キャンペーン' },
      totalEarnings: { ko: '총 수익', en: 'Total Earnings', jp: '総収益' },
      averageRating: { ko: '평균 평점', en: 'Average Rating', jp: '平均評価' },
      totalViews: { ko: '총 조회수', en: 'Total Views', jp: '総閲覧数' },
    },
    earnings: {
      summary: { ko: '수익 요약', en: 'Earnings Summary', jp: '収益要約' },
      withdrawable: { ko: '출금 가능 금액', en: 'Withdrawable Amount', jp: '出金可能金額' },
      pending: { ko: '정산 대기중', en: 'Pending Settlement', jp: '精算待ち' },
      total: { ko: '총 수익', en: 'Total Earnings', jp: '総収益' },
    },
    withdrawal: {
      title: { ko: '출금 신청', en: 'Withdrawal Request', jp: '出金申請' },
      amount: { ko: '출금 금액', en: 'Withdrawal Amount', jp: '出金金額' },
      maxAmount: { ko: '최대 출금 가능', en: 'Maximum Withdrawable', jp: '最大出金可能' },
      submit: { ko: '출금 신청', en: 'Request Withdrawal', jp: '出金申請' },
      submitting: { ko: '처리중...', en: 'Processing...', jp: '処理中...' },
    },
    settlements: {
      title: { ko: '정산 내역', en: 'Settlement History', jp: '精算履歴' },
      date: { ko: '날짜', en: 'Date', jp: '日付' },
      amount: { ko: '금액', en: 'Amount', jp: '金額' },
      status: { ko: '상태', en: 'Status', jp: 'ステータス' },
      noHistory: { ko: '정산 내역이 없습니다', en: 'No settlement history', jp: '精算履歴がありません' },
    },
    overview: {
      recentActivity: { ko: '최근 활동', en: 'Recent Activity', jp: '最近の活動' },
    },
    favorites: {
      title: { ko: '관심 캠페인', en: 'Favorite Campaigns', jp: 'お気に入りキャンペーン' },
      empty: { ko: '관심 캠페인이 없습니다', en: 'No favorite campaigns', jp: 'お気に入りキャンペーンがありません' },
    },
    campaigns: {
      title: { ko: '내 캠페인', en: 'My Campaigns', jp: 'マイキャンペーン' },
    }
  },

  // 인증 관련
  auth: {
    login: {
      title: { ko: '로그인', en: 'Login', jp: 'ログイン' },
      email: { ko: '이메일', en: 'Email', jp: 'メール' },
      password: { ko: '비밀번호', en: 'Password', jp: 'パスワード' },
      rememberMe: { ko: '로그인 상태 유지', en: 'Remember me', jp: 'ログイン状態を維持' },
      forgotPassword: { ko: '비밀번호 찾기', en: 'Forgot password?', jp: 'パスワードを忘れた方' },
      submit: { ko: '로그인', en: 'Login', jp: 'ログイン' },
      noAccount: { ko: '계정이 없으신가요?', en: "Don't have an account?", jp: 'アカウントをお持ちでない方' },
      signUp: { ko: '회원가입', en: 'Sign up', jp: '会員登録' },
    },
    register: {
      title: { ko: '회원가입', en: 'Sign Up', jp: '会員登録' },
      userType: { ko: '회원 유형', en: 'User Type', jp: '会員タイプ' },
      influencer: { ko: '인플루언서', en: 'Influencer', jp: 'インフルエンサー' },
      business: { ko: '비즈니스', en: 'Business', jp: 'ビジネス' },
      agreeTerms: { ko: '이용약관에 동의합니다', en: 'I agree to the terms', jp: '利用規約に同意します' },
      agreePrivacy: { ko: '개인정보처리방침에 동의합니다', en: 'I agree to the privacy policy', jp: 'プライバシーポリシーに同意します' },
      submit: { ko: '가입하기', en: 'Sign Up', jp: '登録する' },
      hasAccount: { ko: '이미 계정이 있으신가요?', en: 'Already have an account?', jp: 'すでにアカウントをお持ちの方' },
    },
    error: {
      invalidCredentials: { ko: '이메일 또는 비밀번호가 올바르지 않습니다', en: 'Invalid email or password', jp: 'メールまたはパスワードが正しくありません' },
      emailExists: { ko: '이미 사용중인 이메일입니다', en: 'Email already in use', jp: 'すでに使用中のメールです' },
      weakPassword: { ko: '비밀번호는 8자 이상이어야 합니다', en: 'Password must be at least 8 characters', jp: 'パスワードは8文字以上である必要があります' },
    }
  },

  // 캠페인 관련
  campaign: {
    status: {
      draft: { ko: '임시저장', en: 'Draft', jp: '下書き' },
      pending: { ko: '검토중', en: 'Under Review', jp: 'レビュー中' },
      active: { ko: '진행중', en: 'Active', jp: '進行中' },
      completed: { ko: '완료', en: 'Completed', jp: '完了' },
      cancelled: { ko: '취소됨', en: 'Cancelled', jp: 'キャンセル' },
    },
    form: {
      title: { ko: '캠페인 제목', en: 'Campaign Title', jp: 'キャンペーンタイトル' },
      description: { ko: '캠페인 설명', en: 'Campaign Description', jp: 'キャンペーン説明' },
      category: { ko: '카테고리', en: 'Category', jp: 'カテゴリー' },
      budget: { ko: '예산', en: 'Budget', jp: '予算' },
      startDate: { ko: '시작일', en: 'Start Date', jp: '開始日' },
      endDate: { ko: '종료일', en: 'End Date', jp: '終了日' },
      requirements: { ko: '요구사항', en: 'Requirements', jp: '要件' },
      targetAudience: { ko: '타겟 고객', en: 'Target Audience', jp: 'ターゲット顧客' },
    },
    list: {
      noCampaigns: { ko: '캠페인이 없습니다', en: 'No campaigns', jp: 'キャンペーンがありません' },
      createNew: { ko: '새 캠페인 만들기', en: 'Create New Campaign', jp: '新しいキャンペーンを作成' },
    }
  },

  // 비즈니스 페이지
  business: {
    dashboard: {
      title: { ko: '비즈니스 대시보드', en: 'Business Dashboard', jp: 'ビジネスダッシュボード' },
      activeCampaigns: { ko: '진행중인 캠페인', en: 'Active Campaigns', jp: '進行中のキャンペーン' },
      totalSpent: { ko: '총 지출', en: 'Total Spent', jp: '総支出' },
      totalReach: { ko: '총 도달', en: 'Total Reach', jp: '総リーチ' },
    },
    campaign: {
      create: { ko: '캠페인 만들기', en: 'Create Campaign', jp: 'キャンペーン作成' },
      manage: { ko: '캠페인 관리', en: 'Manage Campaigns', jp: 'キャンペーン管理' },
      applicants: { ko: '지원자 관리', en: 'Manage Applicants', jp: '応募者管理' },
    }
  },

  // 배지 및 태그
  badge: {
    hot: { ko: 'HOT', en: 'HOT', jp: 'HOT' },
    new: { ko: 'NEW', en: 'NEW', jp: 'NEW' },
    recommended: { ko: '추천', en: 'Recommended', jp: 'おすすめ' },
    verified: { ko: '인증됨', en: 'Verified', jp: '認証済み' },
    premium: { ko: '프리미엄', en: 'Premium', jp: 'プレミアム' },
  },

  // 랭킹 섹션
  ranking: {
    title: { ko: '인기 인플루언서', en: 'Popular Influencers', jp: '人気インフルエンサー' },
    subtitle: { ko: '이번 주 가장 주목받는 인플루언서', en: 'Most popular influencers this week', jp: '今週最も注目されているインフルエンサー' },
    viewAll: { ko: '전체보기', en: 'View All', jp: '全て見る' },
  },

  // 추천 섹션
  recommended: {
    title: { ko: '추천 캠페인', en: 'Recommended Campaigns', jp: 'おすすめキャンペーン' },
    subtitle: { ko: '당신에게 딱 맞는 캠페인', en: 'Perfect campaigns for you', jp: 'あなたにぴったりのキャンペーン' },
  }
};

// 언어팩 데이터를 DB에 저장하는 함수
async function saveLanguagePacksToDB() {
  console.log('🚀 언어팩 데이터 수집 및 저장 시작...\n');
  
  let totalCount = 0;
  let createdCount = 0;
  let updatedCount = 0;

  // 재귀적으로 객체를 순회하며 언어팩 저장
  async function processObject(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && value.ko) {
        // 언어팩 데이터인 경우
        try {
          const existing = await prisma.languagePack.findUnique({
            where: { key: currentKey }
          });

          if (existing) {
            // 업데이트
            await prisma.languagePack.update({
              where: { key: currentKey },
              data: {
                ko: value.ko,
                en: value.en || value.ko,
                jp: value.jp || value.ko,
                category: prefix.split('.')[0] || 'common',
                updatedAt: new Date()
              }
            });
            updatedCount++;
            console.log(`✅ Updated: ${currentKey}`);
          } else {
            // 생성
            await prisma.languagePack.create({
              data: {
                key: currentKey,
                ko: value.ko,
                en: value.en || value.ko,
                jp: value.jp || value.ko,
                category: prefix.split('.')[0] || 'common'
              }
            });
            createdCount++;
            console.log(`✨ Created: ${currentKey}`);
          }
          totalCount++;
        } catch (error) {
          console.error(`❌ Error processing ${currentKey}:`, error.message);
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // 중첩된 객체인 경우 재귀 호출
        await processObject(value, currentKey);
      }
    }
  }

  await processObject(ALL_LANGUAGE_KEYS);

  console.log('\n📊 언어팩 저장 완료!');
  console.log(`   총 항목: ${totalCount}개`);
  console.log(`   생성됨: ${createdCount}개`);
  console.log(`   업데이트됨: ${updatedCount}개`);
}

// 언어팩 파일 생성 (AI 번역용)
async function createLanguagePackFiles() {
  console.log('\n📁 언어팩 파일 생성 시작...\n');

  // DB에서 모든 언어팩 가져오기
  const allPacks = await prisma.languagePack.findMany({
    orderBy: [
      { category: 'asc' },
      { key: 'asc' }
    ]
  });

  // 카테고리별로 그룹핑
  const byCategory = {};
  const needsTranslation = [];

  for (const pack of allPacks) {
    const category = pack.category || 'common';
    
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    
    byCategory[category].push(pack);
    
    // 영어나 일본어 번역이 없는 항목 수집
    if (pack.ko && (!pack.en || pack.en === pack.ko || !pack.jp || pack.jp === pack.ko)) {
      needsTranslation.push(pack);
    }
  }

  // 폴더 생성
  const translationsDir = path.join(process.cwd(), 'src', 'lib', 'translations');
  await fs.mkdir(translationsDir, { recursive: true });

  // 전체 통합 파일 생성
  const allTranslationsContent = `// 전체 언어팩 데이터 (자동 생성됨)
// 생성일: ${new Date().toISOString()}
// 총 ${allPacks.length}개 항목

export const ALL_TRANSLATIONS = ${JSON.stringify(allPacks, null, 2)};

// 카테고리별 분류
export const TRANSLATIONS_BY_CATEGORY = ${JSON.stringify(byCategory, null, 2)};

// 번역이 필요한 항목 (한글만 있는 항목)
export const NEEDS_TRANSLATION = ${JSON.stringify(needsTranslation, null, 2)};
`;

  await fs.writeFile(
    path.join(translationsDir, 'all-translations.ts'),
    allTranslationsContent
  );
  console.log('✅ all-translations.ts 생성 완료');

  // 번역 필요 항목만 모은 파일 (AI 번역용)
  const needsTranslationContent = `// AI 번역이 필요한 항목들
// 한글만 있거나 번역이 불완전한 항목들입니다.
// 각 항목의 'ko' 필드를 참고하여 'en'과 'jp' 필드를 번역해주세요.
// 생성일: ${new Date().toISOString()}

export const TRANSLATIONS_TO_COMPLETE = [
${needsTranslation.map(item => `  {
    key: "${item.key}",
    ko: "${item.ko}",
    en: "${item.en || ''}",  // TODO: 번역 필요
    jp: "${item.jp || ''}",  // TODO: 번역 필요
    category: "${item.category}"
  }`).join(',\n')}
];

// 번역 완료 후 DB 업데이트 스크립트
export async function updateTranslations() {
  // 이 함수는 번역 완료 후 실행하세요
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  for (const item of TRANSLATIONS_TO_COMPLETE) {
    if (item.en && item.jp) {
      await prisma.languagePack.update({
        where: { key: item.key },
        data: {
          en: item.en,
          jp: item.jp
        }
      });
      console.log(\`Updated: \${item.key}\`);
    }
  }
}
`;

  await fs.writeFile(
    path.join(translationsDir, 'needs-translation.ts'),
    needsTranslationContent
  );
  console.log(`✅ needs-translation.ts 생성 완료 (${needsTranslation.length}개 항목 번역 필요)`);

  // 카테고리별 파일 생성
  for (const [category, items] of Object.entries(byCategory)) {
    const categoryContent = `// ${category} 카테고리 언어팩
// 생성일: ${new Date().toISOString()}
// ${items.length}개 항목

export const ${category.toUpperCase()}_TRANSLATIONS = ${JSON.stringify(items, null, 2)};
`;

    await fs.writeFile(
      path.join(translationsDir, `${category}.ts`),
      categoryContent
    );
    console.log(`✅ ${category}.ts 생성 완료 (${items.length}개 항목)`);
  }

  console.log('\n📊 파일 생성 완료!');
  console.log(`   총 ${Object.keys(byCategory).length + 2}개 파일 생성`);
  console.log(`   번역 필요: ${needsTranslation.length}개 항목`);
}

// 메인 실행 함수
async function main() {
  try {
    // 1. DB에 언어팩 저장
    await saveLanguagePacksToDB();
    
    // 2. 언어팩 파일 생성
    await createLanguagePackFiles();
    
    console.log('\n✨ 모든 작업이 완료되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. src/lib/translations/needs-translation.ts 파일을 AI로 번역');
    console.log('2. 번역 완료 후 updateTranslations() 함수 실행하여 DB 업데이트');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main();