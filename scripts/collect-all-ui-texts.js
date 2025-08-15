const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// 전체 사이트에서 사용되는 모든 UI 텍스트 (완전 확장판)
const ALL_UI_TEXTS = {
  // 인플루언서 대시보드
  influencer: {
    dashboard: {
      title: { ko: '대시보드', en: 'Dashboard', jp: 'ダッシュボード' },
      subtitle: { ko: '오늘의 활동을 확인하세요', en: 'Check your activities today', jp: '今日のアクティビティを確認' },
      
      // 통계 카드
      stats: {
        totalCampaigns: { ko: '진행중인 캠페인', en: 'Active Campaigns', jp: '進行中のキャンペーン' },
        totalEarnings: { ko: '이번 달 수익', en: 'Monthly Earnings', jp: '今月の収益' },
        totalViews: { ko: '총 조회수', en: 'Total Views', jp: '総閲覧数' },
        totalFollowers: { ko: '총 팔로워', en: 'Total Followers', jp: '総フォロワー' },
        engagementRate: { ko: '참여율', en: 'Engagement Rate', jp: 'エンゲージメント率' },
        completedCampaigns: { ko: '완료한 캠페인', en: 'Completed Campaigns', jp: '完了したキャンペーン' },
      },
      
      // 빠른 액션
      quickActions: {
        title: { ko: '빠른 실행', en: 'Quick Actions', jp: 'クイックアクション' },
        exploreCampaigns: { ko: '캠페인 둘러보기', en: 'Explore Campaigns', jp: 'キャンペーンを探す' },
        submitContent: { ko: '콘텐츠 제출', en: 'Submit Content', jp: 'コンテンツ提出' },
        viewEarnings: { ko: '수익 확인', en: 'View Earnings', jp: '収益確認' },
        updateProfile: { ko: '프로필 수정', en: 'Update Profile', jp: 'プロフィール編集' },
      },
      
      // 최근 활동
      recentActivity: {
        title: { ko: '최근 활동', en: 'Recent Activity', jp: '最近の活動' },
        applied: { ko: '지원함', en: 'Applied', jp: '応募済み' },
        accepted: { ko: '승인됨', en: 'Accepted', jp: '承認済み' },
        rejected: { ko: '거절됨', en: 'Rejected', jp: '拒否' },
        contentSubmitted: { ko: '콘텐츠 제출됨', en: 'Content Submitted', jp: 'コンテンツ提出済み' },
        paymentReceived: { ko: '정산 완료', en: 'Payment Received', jp: '精算完了' },
      }
    },
    
    // 캠페인 탐색 페이지
    explore: {
      title: { ko: '캠페인 탐색', en: 'Explore Campaigns', jp: 'キャンペーンを探す' },
      subtitle: { ko: '나에게 맞는 캠페인을 찾아 지원해보세요', en: 'Find campaigns that suit you', jp: 'あなたに合ったキャンペーンを見つけて応募しましょう' },
      
      search: {
        placeholder: { ko: '캠페인, 브랜드, 태그로 검색...', en: 'Search by campaign, brand, tag...', jp: 'キャンペーン、ブランド、タグで検索...' },
        button: { ko: '검색', en: 'Search', jp: '検索' },
        results: { ko: '개의 캠페인을 찾았습니다', en: 'campaigns found', jp: '件のキャンペーンが見つかりました' },
        noResults: { ko: '검색 결과가 없습니다', en: 'No results found', jp: '検索結果がありません' },
        tryOther: { ko: '다른 검색어나 필터를 시도해보세요', en: 'Try different search terms or filters', jp: '他の検索語やフィルターを試してください' },
      },
      
      filters: {
        all: { ko: '전체', en: 'All', jp: '全て' },
        category: { ko: '카테고리', en: 'Category', jp: 'カテゴリー' },
        platform: { ko: '플랫폼', en: 'Platform', jp: 'プラットフォーム' },
        budget: { ko: '예산', en: 'Budget', jp: '予算' },
        location: { ko: '지역', en: 'Location', jp: '地域' },
        deadline: { ko: '마감일', en: 'Deadline', jp: '締切日' },
        
        // 플랫폼 옵션
        platforms: {
          all: { ko: '전체 플랫폼', en: 'All Platforms', jp: '全プラットフォーム' },
          instagram: { ko: '인스타그램', en: 'Instagram', jp: 'インスタグラム' },
          youtube: { ko: '유튜브', en: 'YouTube', jp: 'YouTube' },
          tiktok: { ko: '틱톡', en: 'TikTok', jp: 'TikTok' },
          blog: { ko: '블로그', en: 'Blog', jp: 'ブログ' },
          twitter: { ko: '트위터', en: 'Twitter', jp: 'ツイッター' },
        },
        
        // 예산 범위
        budgetRanges: {
          all: { ko: '전체 예산', en: 'All Budgets', jp: '全予算' },
          under10: { ko: '10만원 이하', en: 'Under 100K', jp: '10万ウォン以下' },
          '10to30': { ko: '10-30만원', en: '100K-300K', jp: '10-30万ウォン' },
          '30to50': { ko: '30-50만원', en: '300K-500K', jp: '30-50万ウォン' },
          over50: { ko: '50만원 이상', en: 'Over 500K', jp: '50万ウォン以上' },
        },
      },
      
      card: {
        status: {
          active: { ko: '진행중', en: 'Active', jp: '進行中' },
          upcoming: { ko: '예정', en: 'Upcoming', jp: '予定' },
          closed: { ko: '마감', en: 'Closed', jp: '締切' },
        },
        budget: { ko: '예산', en: 'Budget', jp: '予算' },
        deadline: { ko: '마감일', en: 'Deadline', jp: '締切日' },
        location: { ko: '지역', en: 'Location', jp: '地域' },
        followers: { ko: '팔로워', en: 'Followers', jp: 'フォロワー' },
        required: { ko: '명 이상', en: 'or more', jp: '名以上' },
        views: { ko: '조회', en: 'views', jp: '閲覧' },
        applicants: { ko: '명 지원', en: 'applicants', jp: '名応募' },
        daysLeft: { ko: '일 남음', en: 'days left', jp: '日残り' },
        today: { ko: '오늘 마감', en: 'Ends today', jp: '今日締切' },
        tomorrow: { ko: '내일 마감', en: 'Ends tomorrow', jp: '明日締切' },
        ended: { ko: '마감됨', en: 'Ended', jp: '締切済み' },
        viewDetails: { ko: '상세보기', en: 'View Details', jp: '詳細を見る' },
        apply: { ko: '지원하기', en: 'Apply', jp: '応募する' },
        save: { ko: '저장', en: 'Save', jp: '保存' },
        saved: { ko: '저장됨', en: 'Saved', jp: '保存済み' },
      }
    },
    
    // 포트폴리오 페이지
    portfolio: {
      title: { ko: '포트폴리오', en: 'Portfolio', jp: 'ポートフォリオ' },
      subtitle: { ko: '나의 작업을 관리하고 공유하세요', en: 'Manage and share your work', jp: '作品を管理・共有しましょう' },
      
      tabs: {
        all: { ko: '전체', en: 'All', jp: '全て' },
        instagram: { ko: '인스타그램', en: 'Instagram', jp: 'インスタグラム' },
        youtube: { ko: '유튜브', en: 'YouTube', jp: 'YouTube' },
        tiktok: { ko: '틱톡', en: 'TikTok', jp: 'TikTok' },
        blog: { ko: '블로그', en: 'Blog', jp: 'ブログ' },
      },
      
      upload: {
        title: { ko: '새 포트폴리오 추가', en: 'Add New Portfolio', jp: '新しいポートフォリオを追加' },
        selectPlatform: { ko: '플랫폼 선택', en: 'Select Platform', jp: 'プラットフォーム選択' },
        enterUrl: { ko: 'URL 입력', en: 'Enter URL', jp: 'URL入力' },
        uploadImage: { ko: '이미지 업로드', en: 'Upload Image', jp: '画像アップロード' },
        title: { ko: '제목', en: 'Title', jp: 'タイトル' },
        description: { ko: '설명', en: 'Description', jp: '説明' },
        tags: { ko: '태그', en: 'Tags', jp: 'タグ' },
        addTag: { ko: '태그 추가', en: 'Add Tag', jp: 'タグ追加' },
        category: { ko: '카테고리', en: 'Category', jp: 'カテゴリー' },
        save: { ko: '저장', en: 'Save', jp: '保存' },
        cancel: { ko: '취소', en: 'Cancel', jp: 'キャンセル' },
      },
      
      item: {
        views: { ko: '조회수', en: 'Views', jp: '閲覧数' },
        likes: { ko: '좋아요', en: 'Likes', jp: 'いいね' },
        comments: { ko: '댓글', en: 'Comments', jp: 'コメント' },
        engagement: { ko: '참여율', en: 'Engagement', jp: 'エンゲージメント' },
        edit: { ko: '수정', en: 'Edit', jp: '編集' },
        delete: { ko: '삭제', en: 'Delete', jp: '削除' },
        share: { ko: '공유', en: 'Share', jp: '共有' },
      },
      
      empty: {
        title: { ko: '포트폴리오가 없습니다', en: 'No portfolio items', jp: 'ポートフォリオがありません' },
        subtitle: { ko: '첫 번째 작품을 추가해보세요', en: 'Add your first work', jp: '最初の作品を追加しましょう' },
        addButton: { ko: '포트폴리오 추가', en: 'Add Portfolio', jp: 'ポートフォリオ追加' },
      }
    },
    
    // 수익 관리 페이지
    earnings: {
      title: { ko: '수익 관리', en: 'Earnings Management', jp: '収益管理' },
      subtitle: { ko: '수익 현황과 정산 내역을 확인하세요', en: 'Check your earnings and settlement history', jp: '収益状況と精算履歴を確認' },
      
      summary: {
        title: { ko: '수익 요약', en: 'Earnings Summary', jp: '収益要約' },
        totalEarnings: { ko: '총 수익', en: 'Total Earnings', jp: '総収益' },
        thisMonth: { ko: '이번 달', en: 'This Month', jp: '今月' },
        lastMonth: { ko: '지난 달', en: 'Last Month', jp: '先月' },
        pending: { ko: '정산 대기', en: 'Pending', jp: '精算待ち' },
        available: { ko: '출금 가능', en: 'Available', jp: '出金可能' },
        withdrawn: { ko: '출금 완료', en: 'Withdrawn', jp: '出金完了' },
      },
      
      withdrawal: {
        title: { ko: '출금 신청', en: 'Withdrawal Request', jp: '出金申請' },
        amount: { ko: '출금 금액', en: 'Amount', jp: '出金金額' },
        minAmount: { ko: '최소 출금 금액', en: 'Minimum Amount', jp: '最小出金金額' },
        maxAmount: { ko: '최대 출금 가능', en: 'Maximum Available', jp: '最大出金可能' },
        fee: { ko: '수수료', en: 'Fee', jp: '手数料' },
        actualAmount: { ko: '실 수령액', en: 'Actual Amount', jp: '実受取額' },
        accountInfo: { ko: '계좌 정보', en: 'Account Info', jp: '口座情報' },
        bankName: { ko: '은행명', en: 'Bank Name', jp: '銀行名' },
        accountNumber: { ko: '계좌번호', en: 'Account Number', jp: '口座番号' },
        accountHolder: { ko: '예금주', en: 'Account Holder', jp: '口座名義' },
        requestButton: { ko: '출금 신청', en: 'Request Withdrawal', jp: '出金申請' },
        processing: { ko: '처리중...', en: 'Processing...', jp: '処理中...' },
      },
      
      history: {
        title: { ko: '정산 내역', en: 'Settlement History', jp: '精算履歴' },
        date: { ko: '날짜', en: 'Date', jp: '日付' },
        campaign: { ko: '캠페인', en: 'Campaign', jp: 'キャンペーン' },
        amount: { ko: '금액', en: 'Amount', jp: '金額' },
        status: { ko: '상태', en: 'Status', jp: 'ステータス' },
        details: { ko: '상세', en: 'Details', jp: '詳細' },
        
        statuses: {
          pending: { ko: '대기중', en: 'Pending', jp: '待機中' },
          processing: { ko: '처리중', en: 'Processing', jp: '処理中' },
          completed: { ko: '완료', en: 'Completed', jp: '完了' },
          failed: { ko: '실패', en: 'Failed', jp: '失敗' },
          cancelled: { ko: '취소됨', en: 'Cancelled', jp: 'キャンセル' },
        },
        
        empty: { ko: '정산 내역이 없습니다', en: 'No settlement history', jp: '精算履歴がありません' },
      },
      
      tax: {
        title: { ko: '세금 정보', en: 'Tax Information', jp: '税金情報' },
        income: { ko: '소득세', en: 'Income Tax', jp: '所得税' },
        vat: { ko: '부가세', en: 'VAT', jp: '付加価値税' },
        total: { ko: '총 세금', en: 'Total Tax', jp: '総税金' },
        document: { ko: '세금계산서', en: 'Tax Invoice', jp: '税金計算書' },
        download: { ko: '다운로드', en: 'Download', jp: 'ダウンロード' },
      }
    },
    
    // 캠페인 관리
    campaigns: {
      title: { ko: '내 캠페인', en: 'My Campaigns', jp: 'マイキャンペーン' },
      tabs: {
        all: { ko: '전체', en: 'All', jp: '全て' },
        applied: { ko: '지원한 캠페인', en: 'Applied', jp: '応募済み' },
        inProgress: { ko: '진행중', en: 'In Progress', jp: '進行中' },
        completed: { ko: '완료', en: 'Completed', jp: '完了' },
        rejected: { ko: '거절됨', en: 'Rejected', jp: '拒否' },
      },
      
      status: {
        applied: { ko: '지원 완료', en: 'Applied', jp: '応募完了' },
        reviewing: { ko: '검토중', en: 'Under Review', jp: 'レビュー中' },
        accepted: { ko: '승인됨', en: 'Accepted', jp: '承認済み' },
        rejected: { ko: '거절됨', en: 'Rejected', jp: '拒否' },
        inProgress: { ko: '진행중', en: 'In Progress', jp: '進行中' },
        contentSubmitted: { ko: '콘텐츠 제출됨', en: 'Content Submitted', jp: 'コンテンツ提出済み' },
        completed: { ko: '완료', en: 'Completed', jp: '完了' },
        cancelled: { ko: '취소됨', en: 'Cancelled', jp: 'キャンセル' },
      },
      
      actions: {
        viewDetails: { ko: '상세보기', en: 'View Details', jp: '詳細を見る' },
        submitContent: { ko: '콘텐츠 제출', en: 'Submit Content', jp: 'コンテンツ提出' },
        viewFeedback: { ko: '피드백 보기', en: 'View Feedback', jp: 'フィードバック確認' },
        contact: { ko: '문의하기', en: 'Contact', jp: 'お問い合わせ' },
        withdraw: { ko: '지원 취소', en: 'Withdraw', jp: '応募取消' },
      },
      
      submission: {
        title: { ko: '콘텐츠 제출', en: 'Content Submission', jp: 'コンテンツ提出' },
        uploadContent: { ko: '콘텐츠 업로드', en: 'Upload Content', jp: 'コンテンツアップロード' },
        contentUrl: { ko: '콘텐츠 URL', en: 'Content URL', jp: 'コンテンツURL' },
        description: { ko: '설명', en: 'Description', jp: '説明' },
        files: { ko: '파일', en: 'Files', jp: 'ファイル' },
        submit: { ko: '제출', en: 'Submit', jp: '提出' },
        deadline: { ko: '제출 마감일', en: 'Submission Deadline', jp: '提出締切' },
        guidelines: { ko: '가이드라인', en: 'Guidelines', jp: 'ガイドライン' },
      }
    },
    
    // 알림
    notifications: {
      title: { ko: '알림', en: 'Notifications', jp: '通知' },
      markAllRead: { ko: '모두 읽음', en: 'Mark All Read', jp: '全て既読' },
      settings: { ko: '알림 설정', en: 'Notification Settings', jp: '通知設定' },
      
      types: {
        campaignAccepted: { ko: '캠페인 승인', en: 'Campaign Accepted', jp: 'キャンペーン承認' },
        campaignRejected: { ko: '캠페인 거절', en: 'Campaign Rejected', jp: 'キャンペーン拒否' },
        paymentReceived: { ko: '정산 완료', en: 'Payment Received', jp: '精算完了' },
        newMessage: { ko: '새 메시지', en: 'New Message', jp: '新しいメッセージ' },
        deadlineReminder: { ko: '마감일 알림', en: 'Deadline Reminder', jp: '締切リマインダー' },
        profileUpdate: { ko: '프로필 업데이트 필요', en: 'Profile Update Needed', jp: 'プロフィール更新必要' },
      },
      
      empty: { ko: '새로운 알림이 없습니다', en: 'No new notifications', jp: '新しい通知はありません' },
    }
  },
  
  // 비즈니스 대시보드
  business: {
    dashboard: {
      title: { ko: '비즈니스 대시보드', en: 'Business Dashboard', jp: 'ビジネスダッシュボード' },
      
      stats: {
        activeCampaigns: { ko: '진행중인 캠페인', en: 'Active Campaigns', jp: '進行中のキャンペーン' },
        totalSpent: { ko: '총 지출', en: 'Total Spent', jp: '総支出' },
        totalReach: { ko: '총 도달', en: 'Total Reach', jp: '総リーチ' },
        avgEngagement: { ko: '평균 참여율', en: 'Avg Engagement', jp: '平均エンゲージメント' },
        totalApplicants: { ko: '총 지원자', en: 'Total Applicants', jp: '総応募者' },
        contentCreated: { ko: '생성된 콘텐츠', en: 'Content Created', jp: '作成されたコンテンツ' },
      },
      
      quickActions: {
        createCampaign: { ko: '캠페인 만들기', en: 'Create Campaign', jp: 'キャンペーン作成' },
        viewApplicants: { ko: '지원자 보기', en: 'View Applicants', jp: '応募者確認' },
        analytics: { ko: '분석 보기', en: 'View Analytics', jp: '分析確認' },
        payments: { ko: '결제 관리', en: 'Manage Payments', jp: '決済管理' },
      }
    },
    
    campaigns: {
      create: {
        title: { ko: '새 캠페인 만들기', en: 'Create New Campaign', jp: '新しいキャンペーン作成' },
        
        steps: {
          basic: { ko: '기본 정보', en: 'Basic Info', jp: '基本情報' },
          details: { ko: '상세 설정', en: 'Details', jp: '詳細設定' },
          target: { ko: '타겟 설정', en: 'Target Settings', jp: 'ターゲット設定' },
          budget: { ko: '예산 설정', en: 'Budget', jp: '予算設定' },
          review: { ko: '검토 및 게시', en: 'Review & Publish', jp: 'レビュー＆公開' },
        },
        
        fields: {
          campaignTitle: { ko: '캠페인 제목', en: 'Campaign Title', jp: 'キャンペーンタイトル' },
          description: { ko: '캠페인 설명', en: 'Description', jp: 'キャンペーン説明' },
          category: { ko: '카테고리', en: 'Category', jp: 'カテゴリー' },
          platforms: { ko: '플랫폼 선택', en: 'Select Platforms', jp: 'プラットフォーム選択' },
          startDate: { ko: '시작일', en: 'Start Date', jp: '開始日' },
          endDate: { ko: '종료일', en: 'End Date', jp: '終了日' },
          applicationDeadline: { ko: '지원 마감일', en: 'Application Deadline', jp: '応募締切' },
          contentDeadline: { ko: '콘텐츠 제출 마감일', en: 'Content Deadline', jp: 'コンテンツ提出締切' },
          requirements: { ko: '요구사항', en: 'Requirements', jp: '要件' },
          guidelines: { ko: '가이드라인', en: 'Guidelines', jp: 'ガイドライン' },
          targetFollowers: { ko: '최소 팔로워 수', en: 'Min Followers', jp: '最小フォロワー数' },
          targetAge: { ko: '타겟 연령', en: 'Target Age', jp: 'ターゲット年齢' },
          targetGender: { ko: '타겟 성별', en: 'Target Gender', jp: 'ターゲット性別' },
          targetLocation: { ko: '타겟 지역', en: 'Target Location', jp: 'ターゲット地域' },
          budget: { ko: '예산', en: 'Budget', jp: '予算' },
          paymentPerPost: { ko: '포스트당 금액', en: 'Payment per Post', jp: '投稿あたりの金額' },
          maxParticipants: { ko: '최대 참여자 수', en: 'Max Participants', jp: '最大参加者数' },
        },
        
        buttons: {
          previous: { ko: '이전', en: 'Previous', jp: '前へ' },
          next: { ko: '다음', en: 'Next', jp: '次へ' },
          saveDraft: { ko: '임시저장', en: 'Save Draft', jp: '下書き保存' },
          publish: { ko: '게시하기', en: 'Publish', jp: '公開' },
          cancel: { ko: '취소', en: 'Cancel', jp: 'キャンセル' },
        }
      },
      
      manage: {
        title: { ko: '캠페인 관리', en: 'Manage Campaigns', jp: 'キャンペーン管理' },
        
        tabs: {
          all: { ko: '전체', en: 'All', jp: '全て' },
          draft: { ko: '임시저장', en: 'Draft', jp: '下書き' },
          active: { ko: '진행중', en: 'Active', jp: '進行中' },
          completed: { ko: '완료', en: 'Completed', jp: '完了' },
          cancelled: { ko: '취소됨', en: 'Cancelled', jp: 'キャンセル' },
        },
        
        actions: {
          edit: { ko: '수정', en: 'Edit', jp: '編集' },
          duplicate: { ko: '복제', en: 'Duplicate', jp: '複製' },
          pause: { ko: '일시정지', en: 'Pause', jp: '一時停止' },
          resume: { ko: '재개', en: 'Resume', jp: '再開' },
          end: { ko: '종료', en: 'End', jp: '終了' },
          delete: { ko: '삭제', en: 'Delete', jp: '削除' },
          viewApplicants: { ko: '지원자 보기', en: 'View Applicants', jp: '応募者確認' },
          viewAnalytics: { ko: '분석 보기', en: 'View Analytics', jp: '分析確認' },
        }
      },
      
      applicants: {
        title: { ko: '지원자 관리', en: 'Manage Applicants', jp: '応募者管理' },
        
        filters: {
          all: { ko: '전체', en: 'All', jp: '全て' },
          pending: { ko: '검토 대기', en: 'Pending Review', jp: 'レビュー待ち' },
          approved: { ko: '승인됨', en: 'Approved', jp: '承認済み' },
          rejected: { ko: '거절됨', en: 'Rejected', jp: '拒否' },
        },
        
        actions: {
          approve: { ko: '승인', en: 'Approve', jp: '承認' },
          reject: { ko: '거절', en: 'Reject', jp: '拒否' },
          message: { ko: '메시지 보내기', en: 'Send Message', jp: 'メッセージ送信' },
          viewProfile: { ko: '프로필 보기', en: 'View Profile', jp: 'プロフィール確認' },
          viewPortfolio: { ko: '포트폴리오 보기', en: 'View Portfolio', jp: 'ポートフォリオ確認' },
        },
        
        info: {
          followers: { ko: '팔로워', en: 'Followers', jp: 'フォロワー' },
          engagementRate: { ko: '참여율', en: 'Engagement Rate', jp: 'エンゲージメント率' },
          platform: { ko: '주 플랫폼', en: 'Main Platform', jp: 'メインプラットフォーム' },
          appliedDate: { ko: '지원일', en: 'Applied Date', jp: '応募日' },
          status: { ko: '상태', en: 'Status', jp: 'ステータス' },
        }
      }
    }
  },
  
  // 공통 UI 요소 확장
  common: {
    // 페이지네이션
    pagination: {
      first: { ko: '처음', en: 'First', jp: '最初' },
      previous: { ko: '이전', en: 'Previous', jp: '前' },
      next: { ko: '다음', en: 'Next', jp: '次' },
      last: { ko: '마지막', en: 'Last', jp: '最後' },
      page: { ko: '페이지', en: 'Page', jp: 'ページ' },
      of: { ko: '/', en: 'of', jp: '/' },
      showing: { ko: '표시 중', en: 'Showing', jp: '表示中' },
      to: { ko: '~', en: 'to', jp: '〜' },
      results: { ko: '개 결과', en: 'results', jp: '件の結果' },
    },
    
    // 정렬
    sorting: {
      sortBy: { ko: '정렬', en: 'Sort by', jp: '並び替え' },
      newest: { ko: '최신순', en: 'Newest', jp: '新しい順' },
      oldest: { ko: '오래된순', en: 'Oldest', jp: '古い順' },
      popular: { ko: '인기순', en: 'Popular', jp: '人気順' },
      highestPrice: { ko: '높은 가격순', en: 'Highest Price', jp: '高い価格順' },
      lowestPrice: { ko: '낮은 가격순', en: 'Lowest Price', jp: '低い価格順' },
      deadline: { ko: '마감 임박순', en: 'Deadline Soon', jp: '締切間近' },
    },
    
    // 모달
    modal: {
      confirm: { ko: '확인', en: 'Confirm', jp: '確認' },
      cancel: { ko: '취소', en: 'Cancel', jp: 'キャンセル' },
      close: { ko: '닫기', en: 'Close', jp: '閉じる' },
      save: { ko: '저장', en: 'Save', jp: '保存' },
      delete: { ko: '삭제', en: 'Delete', jp: '削除' },
      deleteConfirm: { ko: '정말 삭제하시겠습니까?', en: 'Are you sure you want to delete?', jp: '本当に削除しますか？' },
      unsavedChanges: { ko: '저장하지 않은 변경사항이 있습니다', en: 'You have unsaved changes', jp: '保存されていない変更があります' },
      saveChanges: { ko: '변경사항을 저장하시겠습니까?', en: 'Do you want to save changes?', jp: '変更を保存しますか？' },
    },
    
    // 토스트 메시지
    toast: {
      success: { ko: '성공', en: 'Success', jp: '成功' },
      error: { ko: '오류', en: 'Error', jp: 'エラー' },
      warning: { ko: '경고', en: 'Warning', jp: '警告' },
      info: { ko: '정보', en: 'Info', jp: '情報' },
      loading: { ko: '로딩중...', en: 'Loading...', jp: '読み込み中...' },
      saved: { ko: '저장되었습니다', en: 'Saved successfully', jp: '保存されました' },
      deleted: { ko: '삭제되었습니다', en: 'Deleted successfully', jp: '削除されました' },
      updated: { ko: '업데이트되었습니다', en: 'Updated successfully', jp: '更新されました' },
      copied: { ko: '복사되었습니다', en: 'Copied to clipboard', jp: 'クリップボードにコピーされました' },
    },
    
    // 폼 유효성 검사
    validation: {
      required: { ko: '필수 입력 항목입니다', en: 'This field is required', jp: '必須入力項目です' },
      email: { ko: '올바른 이메일 주소를 입력하세요', en: 'Please enter a valid email', jp: '正しいメールアドレスを入力してください' },
      minLength: { ko: '최소 {min}자 이상 입력하세요', en: 'Minimum {min} characters required', jp: '最小{min}文字以上入力してください' },
      maxLength: { ko: '최대 {max}자까지 입력 가능합니다', en: 'Maximum {max} characters allowed', jp: '最大{max}文字まで入力可能です' },
      pattern: { ko: '올바른 형식으로 입력하세요', en: 'Please enter in correct format', jp: '正しい形式で入力してください' },
      passwordMatch: { ko: '비밀번호가 일치하지 않습니다', en: 'Passwords do not match', jp: 'パスワードが一致しません' },
      number: { ko: '숫자만 입력 가능합니다', en: 'Only numbers allowed', jp: '数字のみ入力可能です' },
      url: { ko: '올바른 URL을 입력하세요', en: 'Please enter a valid URL', jp: '正しいURLを入力してください' },
    },
    
    // 날짜/시간
    datetime: {
      today: { ko: '오늘', en: 'Today', jp: '今日' },
      yesterday: { ko: '어제', en: 'Yesterday', jp: '昨日' },
      tomorrow: { ko: '내일', en: 'Tomorrow', jp: '明日' },
      thisWeek: { ko: '이번 주', en: 'This Week', jp: '今週' },
      lastWeek: { ko: '지난 주', en: 'Last Week', jp: '先週' },
      nextWeek: { ko: '다음 주', en: 'Next Week', jp: '来週' },
      thisMonth: { ko: '이번 달', en: 'This Month', jp: '今月' },
      lastMonth: { ko: '지난 달', en: 'Last Month', jp: '先月' },
      nextMonth: { ko: '다음 달', en: 'Next Month', jp: '来月' },
      selectDate: { ko: '날짜 선택', en: 'Select Date', jp: '日付選択' },
      selectTime: { ko: '시간 선택', en: 'Select Time', jp: '時間選択' },
      
      // 시간 단위
      seconds: { ko: '초', en: 'seconds', jp: '秒' },
      minutes: { ko: '분', en: 'minutes', jp: '分' },
      hours: { ko: '시간', en: 'hours', jp: '時間' },
      days: { ko: '일', en: 'days', jp: '日' },
      weeks: { ko: '주', en: 'weeks', jp: '週' },
      months: { ko: '개월', en: 'months', jp: 'ヶ月' },
      years: { ko: '년', en: 'years', jp: '年' },
      
      ago: { ko: '전', en: 'ago', jp: '前' },
      later: { ko: '후', en: 'later', jp: '後' },
    },
    
    // 파일 업로드
    fileUpload: {
      selectFile: { ko: '파일 선택', en: 'Select File', jp: 'ファイル選択' },
      dragDrop: { ko: '파일을 드래그하거나 클릭하여 업로드', en: 'Drag and drop or click to upload', jp: 'ドラッグ＆ドロップまたはクリックしてアップロード' },
      uploading: { ko: '업로드 중...', en: 'Uploading...', jp: 'アップロード中...' },
      uploadComplete: { ko: '업로드 완료', en: 'Upload Complete', jp: 'アップロード完了' },
      uploadFailed: { ko: '업로드 실패', en: 'Upload Failed', jp: 'アップロード失敗' },
      fileSize: { ko: '파일 크기', en: 'File Size', jp: 'ファイルサイズ' },
      maxSize: { ko: '최대 크기', en: 'Max Size', jp: '最大サイズ' },
      allowedTypes: { ko: '허용 파일 형식', en: 'Allowed Types', jp: '許可されたファイル形式' },
      remove: { ko: '제거', en: 'Remove', jp: '削除' },
    }
  }
};

// 언어팩 데이터를 DB에 저장하는 함수
async function saveAllUITextsToDB() {
  console.log('🚀 전체 UI 텍스트 수집 및 저장 시작...\n');
  
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

  await processObject(ALL_UI_TEXTS);

  console.log('\n📊 UI 텍스트 저장 완료!');
  console.log(`   총 항목: ${totalCount}개`);
  console.log(`   생성됨: ${createdCount}개`);
  console.log(`   업데이트됨: ${updatedCount}개`);
}

// 언어팩 파일 생성 (AI 번역용)
async function createUITextFiles() {
  console.log('\n📁 UI 텍스트 파일 생성 시작...\n');

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
  const allTranslationsContent = `// 전체 UI 텍스트 데이터 (자동 생성됨)
// 생성일: ${new Date().toISOString()}
// 총 ${allPacks.length}개 항목

export const ALL_TRANSLATIONS = ${JSON.stringify(allPacks, null, 2)};

// 카테고리별 분류
export const TRANSLATIONS_BY_CATEGORY = ${JSON.stringify(byCategory, null, 2)};

// 번역이 필요한 항목 (한글만 있는 항목)
export const NEEDS_TRANSLATION = ${JSON.stringify(needsTranslation, null, 2)};
`;

  await fs.writeFile(
    path.join(translationsDir, 'all-ui-texts.ts'),
    allTranslationsContent
  );
  console.log('✅ all-ui-texts.ts 생성 완료');

  // 번역 필요 항목만 모은 파일 (AI 번역용)
  const needsTranslationContent = `// AI 번역이 필요한 UI 텍스트들
// 한글만 있거나 번역이 불완전한 항목들입니다.
// 각 항목의 'ko' 필드를 참고하여 'en'과 'jp' 필드를 번역해주세요.
// 생성일: ${new Date().toISOString()}

export const UI_TEXTS_TO_TRANSLATE = [
${needsTranslation.map(item => `  {
    key: "${item.key}",
    ko: "${item.ko}",
    en: "${item.en || ''}",  // TODO: 번역 필요
    jp: "${item.jp || ''}",  // TODO: 번역 필요
    category: "${item.category}"
  }`).join(',\n')}
];

// 번역 완료 후 DB 업데이트 스크립트
export async function updateUITextTranslations() {
  // 이 함수는 번역 완료 후 실행하세요
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  for (const item of UI_TEXTS_TO_TRANSLATE) {
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
    path.join(translationsDir, 'ui-texts-to-translate.ts'),
    needsTranslationContent
  );
  console.log(`✅ ui-texts-to-translate.ts 생성 완료 (${needsTranslation.length}개 항목 번역 필요)`);

  // 카테고리별 파일 생성
  for (const [category, items] of Object.entries(byCategory)) {
    const categoryContent = `// ${category} 카테고리 UI 텍스트
// 생성일: ${new Date().toISOString()}
// ${items.length}개 항목

export const ${category.toUpperCase().replace(/[.-]/g, '_')}_UI_TEXTS = ${JSON.stringify(items, null, 2)};
`;

    await fs.writeFile(
      path.join(translationsDir, `ui-${category}.ts`),
      categoryContent
    );
    console.log(`✅ ui-${category}.ts 생성 완료 (${items.length}개 항목)`);
  }

  console.log('\n📊 파일 생성 완료!');
  console.log(`   총 ${Object.keys(byCategory).length + 2}개 파일 생성`);
  console.log(`   번역 필요: ${needsTranslation.length}개 항목`);
}

// 메인 실행 함수
async function main() {
  try {
    // 1. DB에 UI 텍스트 저장
    await saveAllUITextsToDB();
    
    // 2. UI 텍스트 파일 생성
    await createUITextFiles();
    
    console.log('\n✨ 모든 작업이 완료되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. src/lib/translations/ui-texts-to-translate.ts 파일을 AI로 번역');
    console.log('2. 번역 완료 후 updateUITextTranslations() 함수 실행하여 DB 업데이트');
    console.log('3. 관리자 페이지에서 언어팩 확인: http://localhost:3000/admin/translations');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
main();