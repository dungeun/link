const { PrismaClient } = require('@prisma/client');

async function addMypageTranslationKeys() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== MyPage 번역 키 추가 ===\n');
    
    // MyPage 관련 번역 키들
    const mypageKeys = [
      // 탭 메뉴
      {
        key: 'mypage.tab.campaigns',
        ko: '캠페인',
        en: 'Campaigns',
        jp: 'キャンペーン',
        category: 'mypage',
        description: '마이페이지 캠페인 탭'
      },
      {
        key: 'mypage.tab.saved',
        ko: '관심 목록',
        en: 'Saved',
        jp: 'お気に入り',
        category: 'mypage',
        description: '마이페이지 관심 목록 탭'
      },
      {
        key: 'mypage.tab.earnings',
        ko: '수익 관리',
        en: 'Earnings',
        jp: '収益管理',
        category: 'mypage',
        description: '마이페이지 수익 관리 탭'
      },
      {
        key: 'mypage.tab.profile',
        ko: '프로필 설정',
        en: 'Profile',
        jp: 'プロフィール',
        category: 'mypage',
        description: '마이페이지 프로필 설정 탭'
      },
      // 캠페인 서브탭
      {
        key: 'mypage.campaign.all',
        ko: '전체',
        en: 'All',
        jp: '全て',
        category: 'mypage',
        description: '마이페이지 전체 캠페인 탭'
      },
      {
        key: 'mypage.campaign.reviewing',
        ko: '심사중',
        en: 'Under Review',
        jp: '審査中',
        category: 'mypage',
        description: '마이페이지 심사중 캠페인 탭'
      },
      {
        key: 'mypage.campaign.active',
        ko: '진행중',
        en: 'Active',
        jp: '進行中',
        category: 'mypage',
        description: '마이페이지 진행중 캠페인 탭'
      },
      {
        key: 'mypage.campaign.rejected',
        ko: '거절됨',
        en: 'Rejected',
        jp: '拒否済み',
        category: 'mypage',
        description: '마이페이지 거절된 캠페인 탭'
      },
      {
        key: 'mypage.campaign.completed',
        ko: '완료',
        en: 'Completed',
        jp: '完了',
        category: 'mypage',
        description: '마이페이지 완료된 캠페인 탭'
      },
      // 상태 및 라벨
      {
        key: 'mypage.status.pending',
        ko: '심사중',
        en: 'Pending',
        jp: '審査中',
        category: 'mypage',
        description: '캠페인 상태 - 심사중'
      },
      {
        key: 'mypage.status.approved',
        ko: '승인됨',
        en: 'Approved',
        jp: '承認済み',
        category: 'mypage',
        description: '캠페인 상태 - 승인됨'
      },
      {
        key: 'mypage.status.rejected',
        ko: '거절됨',
        en: 'Rejected',
        jp: '拒否済み',
        category: 'mypage',
        description: '캠페인 상태 - 거절됨'
      },
      {
        key: 'mypage.status.completed',
        ko: '완료됨',
        en: 'Completed',
        jp: '完了済み',
        category: 'mypage',
        description: '캠페인 상태 - 완료됨'
      },
      {
        key: 'mypage.status.in_progress',
        ko: '진행중',
        en: 'In Progress',
        jp: '進行中',
        category: 'mypage',
        description: '캠페인 상태 - 진행중'
      },
      {
        key: 'mypage.status.submitted',
        ko: '제출 완료',
        en: 'Submitted',
        jp: '提出済み',
        category: 'mypage',
        description: '캠페인 상태 - 제출 완료'
      },
      // 프로필 섹션
      {
        key: 'mypage.profile.basic_info',
        ko: '기본 정보',
        en: 'Basic Information',
        jp: '基本情報',
        category: 'mypage',
        description: '프로필 기본 정보 섹션'
      },
      {
        key: 'mypage.profile.personal_info',
        ko: '개인 정보',
        en: 'Personal Information',
        jp: '個人情報',
        category: 'mypage',
        description: '프로필 개인 정보 섹션'
      },
      {
        key: 'mypage.profile.profile_image',
        ko: '프로필 이미지',
        en: 'Profile Image',
        jp: 'プロフィール画像',
        category: 'mypage',
        description: '프로필 이미지 섹션'
      },
      // 통계 관련
      {
        key: 'mypage.stats.total_campaigns',
        ko: '총 캠페인',
        en: 'Total Campaigns',
        jp: '総キャンペーン',
        category: 'mypage',
        description: '총 캠페인 수 라벨'
      },
      {
        key: 'mypage.stats.total_earnings',
        ko: '총 수익',
        en: 'Total Earnings',
        jp: '総収益',
        category: 'mypage',
        description: '총 수익 라벨'
      },
      // 수익 관리 관련
      {
        key: 'mypage.earnings.withdrawable_amount',
        ko: '출금 가능 금액',
        en: 'Withdrawable Amount',
        jp: '出金可能金額',
        category: 'mypage',
        description: '출금 가능 금액 라벨'
      },
      {
        key: 'mypage.earnings.pending_amount',
        ko: '출금 대기중',
        en: 'Pending Withdrawal',
        jp: '出金待機中',
        category: 'mypage',
        description: '출금 대기중 금액 라벨'
      },
      {
        key: 'mypage.earnings.withdraw_request',
        ko: '출금 신청',
        en: 'Withdrawal Request',
        jp: '出金申請',
        category: 'mypage',
        description: '출금 신청 버튼'
      },
      {
        key: 'mypage.earnings.bank_info',
        ko: '출금 계좌 정보',
        en: 'Bank Account Information',
        jp: '出金口座情報',
        category: 'mypage',
        description: '출금 계좌 정보 섹션'
      },
      // 공통 액션
      {
        key: 'mypage.action.view_details',
        ko: '상세보기',
        en: 'View Details',
        jp: '詳細表示',
        category: 'mypage',
        description: '상세보기 버튼'
      },
      {
        key: 'mypage.action.submit_content',
        ko: '콘텐츠 제출',
        en: 'Submit Content',
        jp: 'コンテンツ提出',
        category: 'mypage',
        description: '콘텐츠 제출 버튼'
      },
      {
        key: 'mypage.action.save_profile',
        ko: '프로필 저장하기',
        en: 'Save Profile',
        jp: 'プロフィール保存',
        category: 'mypage',
        description: '프로필 저장 버튼'
      },
      // 빈 상태 메시지
      {
        key: 'mypage.empty.no_campaigns',
        ko: '캠페인이 없습니다',
        en: 'No campaigns found',
        jp: 'キャンペーンがありません',
        category: 'mypage',
        description: '캠페인 없음 메시지'
      },
      {
        key: 'mypage.empty.no_saved_campaigns',
        ko: '저장한 캠페인이 없습니다',
        en: 'No saved campaigns',
        jp: '保存されたキャンペーンがありません',
        category: 'mypage',
        description: '저장된 캠페인 없음 메시지'
      },
      {
        key: 'mypage.saved.title',
        ko: '관심 캠페인',
        en: 'Saved Campaigns',
        jp: 'お気に入りキャンペーン',
        category: 'mypage',
        description: '관심 캠페인 제목'
      }
    ];
    
    // 언어팩에 키 추가
    for (const keyData of mypageKeys) {
      try {
        const existing = await prisma.languagePack.findUnique({
          where: { key: keyData.key }
        });
        
        if (existing) {
          console.log(`✅ [이미 존재] ${keyData.key}: "${keyData.ko}"`);
        } else {
          await prisma.languagePack.create({
            data: keyData
          });
          console.log(`✅ [새로 추가] ${keyData.key}: "${keyData.ko}"`);
        }
      } catch (error) {
        console.log(`❌ [오류] ${keyData.key}: ${error.message}`);
      }
    }
    
    console.log('\n✅ MyPage 번역 키 추가 완료!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMypageTranslationKeys();