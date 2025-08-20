const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCampaignFields() {
  try {
    // 특정 캠페인 업데이트 (예시 캠페인)
    const campaignId = 'cmejct5eg0001v81jw92pa0z1';
    
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        provisionDetails: '• 살림백서 딥클린 트리플 캡슐세제 본품 1박스 (30개입)\n• 추가 리필 패키지 1개\n• 브랜드 소개 책자\n• 사용 설명서 및 팁 가이드',
        campaignMission: '1. 제품 사용 후기 작성\n   - 실제 사용 사진 3장 이상 포함\n   - 세탁 전/후 비교 사진 권장\n   - 향, 세정력, 편의성에 대한 솔직한 리뷰\n\n2. 해시태그 필수 포함\n   - #살림백서 #딥클린트리플캡슐세제 #한알로끝 #세탁혁명\n\n3. 스토리 업로드\n   - 제품 언박싱 또는 사용 장면\n   - 24시간 이상 유지',
        keywords: '캡슐세제, 세탁세제, 친환경세제, 살림백서, 딥클린, 트리플캡슐, 편의성, 세탁혁명',
        additionalNotes: '📌 주의사항\n• 제품은 캠페인 선정 후 일주일 이내 발송됩니다\n• 콘텐츠는 선정일로부터 2주 이내 업로드해주세요\n• 광고 표시 규정을 반드시 준수해주세요 (#광고, #협찬)\n• 타사 제품 비교 시 비방하지 않도록 주의해주세요\n\n💡 우수 콘텐츠 선정 시 추가 혜택\n• 베스트 리뷰어 3명 선정\n• 살림백서 전 제품 6개월분 제공\n• 차기 캠페인 우선 선정 기회'
      }
    });
    
    console.log('캠페인 업데이트 완료:', updatedCampaign.id);
    console.log('제공 내역:', updatedCampaign.provisionDetails ? '✓' : '✗');
    console.log('캠페인 미션:', updatedCampaign.campaignMission ? '✓' : '✗');
    console.log('키워드:', updatedCampaign.keywords ? '✓' : '✗');
    console.log('추가 안내사항:', updatedCampaign.additionalNotes ? '✓' : '✗');
    
    // 다른 캠페인들도 샘플 데이터로 업데이트
    const campaigns = await prisma.campaign.findMany({
      where: {
        provisionDetails: null,
        status: 'ACTIVE'
      },
      take: 5
    });
    
    for (const campaign of campaigns) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          provisionDetails: campaign.provisionDetails || '• 체험 제품 본품 1개\n• 브랜드 소개 자료\n• 사용 가이드',
          campaignMission: campaign.campaignMission || '1. 제품 체험 후 솔직한 리뷰 작성\n2. 필수 해시태그 포함\n3. 실제 사용 사진 3장 이상',
          keywords: campaign.keywords || '체험단, 리뷰, 제품리뷰',
          additionalNotes: campaign.additionalNotes || '• 광고 표시 규정을 준수해주세요\n• 콘텐츠는 캠페인 종료 시까지 유지해주세요'
        }
      });
      console.log(`업데이트: ${campaign.title}`);
    }
    
  } catch (error) {
    console.error('Error updating campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaignFields();