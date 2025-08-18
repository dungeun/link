const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRealHospitalCampaigns() {
  try {
    console.log('실제 병원 캠페인 생성 시작...');
    
    // 병원 카테고리 찾기
    const hospitalCategory = await prisma.category.findFirst({
      where: { slug: 'hospital' }
    });

    if (!hospitalCategory) {
      console.error('병원 카테고리를 찾을 수 없습니다.');
      return;
    }

    // 비즈니스 사용자 찾기 또는 생성
    let businessUser = await prisma.user.findFirst({
      where: { type: 'BUSINESS' }
    });

    if (!businessUser) {
      // 테스트용 비즈니스 사용자 생성
      businessUser = await prisma.user.create({
        data: {
          email: 'hospital-business@test.com',
          name: '헬스케어 마케팅',
          phoneNumber: '010-1234-5678',
          type: 'BUSINESS',
          businessProfile: {
            create: {
              companyName: '헬스케어 마케팅',
              businessNumber: '123-45-67890',
              businessCategory: 'hospital',
              businessAddress: '서울시 강남구'
            }
          }
        }
      });
      console.log('✅ 비즈니스 사용자 생성됨');
    }

    // 실제 병원 캠페인 데이터 (이미지 없음)
    const hospitalCampaigns = [
      {
        title: '강남 피부과 여드름 치료 체험단',
        description: '최신 레이저 장비를 활용한 여드름 치료 프로그램을 체험하고 솔직한 후기를 작성해주실 체험단을 모집합니다. 치료 전후 사진과 함께 상세한 경험을 공유해주세요.',
        requirements: '- 여드름 고민이 있으신 분\n- 주 1회 병원 방문 가능자\n- 치료 전후 사진 촬영 동의\n- SNS 활발히 운영하시는 분',
        hashtags: '#강남피부과 #여드름치료 #피부과체험단 #여드름개선 #피부관리',
        budget: 300000,
        rewardAmount: 300000,
        maxApplicants: 5,
        targetFollowers: 1000,
        platform: 'INSTAGRAM',
        status: 'ACTIVE'
      },
      {
        title: '서울 치과 임플란트 상담 후기',
        description: '디지털 임플란트 시스템을 활용한 정밀 진단 및 상담 과정을 체험하고, 전문적인 리뷰를 작성해주실 분을 모집합니다.',
        requirements: '- 임플란트 관심자\n- 상담 내용 상세 기록 가능자\n- 블로그 또는 유튜브 운영자 우대',
        hashtags: '#임플란트 #치과상담 #디지털임플란트 #치과추천 #서울치과',
        budget: 200000,
        rewardAmount: 200000,
        maxApplicants: 10,
        targetFollowers: 500,
        platform: 'BLOG',
        status: 'ACTIVE'
      },
      {
        title: '한의원 다이어트 한약 체험단',
        description: '체질별 맞춤 한약 다이어트 프로그램을 4주간 체험하고, 변화 과정을 기록해주실 체험단을 모집합니다.',
        requirements: '- 다이어트 필요자\n- 4주간 꾸준한 기록 가능자\n- 주 1회 한의원 방문 가능\n- 체중 변화 공개 가능자',
        hashtags: '#한약다이어트 #한의원 #다이어트체험단 #체질개선 #건강다이어트',
        budget: 500000,
        rewardAmount: 500000,
        maxApplicants: 3,
        targetFollowers: 3000,
        platform: 'YOUTUBE',
        status: 'ACTIVE'
      },
      {
        title: '안과 라식/라섹 무료 상담 체험',
        description: '최신 검사 장비를 통한 정밀 시력 검사와 맞춤 상담을 체험하고 후기를 작성해주실 분을 모집합니다.',
        requirements: '- 시력교정술 관심자\n- 검사 과정 상세 리뷰 가능자\n- SNS 활동 활발한 분',
        hashtags: '#라식 #라섹 #시력교정 #안과 #무료상담',
        budget: 100000,
        rewardAmount: 100000,
        maxApplicants: 20,
        targetFollowers: 1000,
        platform: 'INSTAGRAM',
        status: 'ACTIVE'
      },
      {
        title: '정형외과 도수치료 체험 리뷰',
        description: '전문 물리치료사의 도수치료를 체험하고, 치료 과정과 효과를 상세히 리뷰해주실 체험단을 모집합니다.',
        requirements: '- 근골격계 통증이 있으신 분\n- 주 2회 방문 가능자(2주간)\n- 치료 경과 기록 가능자',
        hashtags: '#도수치료 #정형외과 #물리치료 #통증치료 #재활치료',
        budget: 400000,
        rewardAmount: 400000,
        maxApplicants: 8,
        targetFollowers: 2000,
        platform: 'BLOG',
        status: 'ACTIVE'
      }
    ];

    // 캠페인 생성
    for (const campaignData of hospitalCampaigns) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30일 후 마감
      
      const campaign = await prisma.campaign.create({
        data: {
          ...campaignData,
          businessId: businessUser.id,
          startDate: startDate,
          endDate: endDate,
          isPaid: false,
          categories: {
            create: {
              categoryId: hospitalCategory.id,
              isPrimary: true
            }
          }
        }
      });
      console.log(`✅ 생성됨: ${campaign.title}`);
    }

    console.log(`\n✅ 병원 카테고리에 ${hospitalCampaigns.length}개의 실제 캠페인이 생성되었습니다!`);

  } catch (error) {
    console.error('캠페인 생성 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRealHospitalCampaigns();