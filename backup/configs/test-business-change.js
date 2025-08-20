// Test script for business change functionality
const fetch = require('node-fetch');

const TEST_URL = 'http://localhost:3001';

async function testBusinessChange() {
  try {
    console.log('=== 업체 변경 저장 문제 테스트 ===');
    
    // 1. 업체 목록 조회
    console.log('\n1. 업체 목록 조회 테스트...');
    const businessResponse = await fetch(`${TEST_URL}/api/admin/businesses`, {
      headers: {
        'Authorization': 'Bearer test-admin-token',  // Mock token
        'Content-Type': 'application/json'
      }
    });
    
    if (businessResponse.ok) {
      const businesses = await businessResponse.json();
      console.log('업체 목록 조회 성공:', businesses);
    } else {
      console.log('업체 목록 조회 실패 - 상태 코드:', businessResponse.status);
      const errorText = await businessResponse.text();
      console.log('오류 메시지:', errorText);
    }
    
    // 2. 캠페인 목록 조회 (첫 번째 캠페인 ID 확인)
    console.log('\n2. 캠페인 목록 조회 테스트...');
    const campaignsResponse = await fetch(`${TEST_URL}/api/admin/campaigns`, {
      headers: {
        'Authorization': 'Bearer test-admin-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (campaignsResponse.ok) {
      const campaigns = await campaignsResponse.json();
      console.log('캠페인 목록 조회 성공. 캠페인 수:', campaigns.campaigns?.length || 0);
      
      if (campaigns.campaigns && campaigns.campaigns.length > 0) {
        const firstCampaign = campaigns.campaigns[0];
        console.log('첫 번째 캠페인:', {
          id: firstCampaign.id,
          title: firstCampaign.title,
          businessId: firstCampaign.businessId
        });
        
        // 3. 캠페인 상세 조회
        console.log('\n3. 캠페인 상세 조회 테스트...');
        const campaignDetailResponse = await fetch(`${TEST_URL}/api/admin/campaigns/${firstCampaign.id}`, {
          headers: {
            'Authorization': 'Bearer test-admin-token',
            'Content-Type': 'application/json'
          }
        });
        
        if (campaignDetailResponse.ok) {
          const campaignDetail = await campaignDetailResponse.json();
          console.log('캠페인 상세 조회 성공:', {
            id: campaignDetail.campaign.id,
            title: campaignDetail.campaign.title,
            businessId: campaignDetail.campaign.businessId,
            businessName: campaignDetail.campaign.business?.name
          });
          
          // 4. 업체 변경 시뮬레이션 (mock business ID)
          console.log('\n4. 업체 변경 테스트...');
          const testBusinessId = 'mock-business-id-test';
          
          const updateResponse = await fetch(`${TEST_URL}/api/admin/campaigns/${firstCampaign.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer test-admin-token',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...campaignDetail.campaign,
              businessId: testBusinessId
            })
          });
          
          const updateResult = await updateResponse.json();
          console.log('업체 변경 테스트 결과:', {
            status: updateResponse.status,
            success: updateResult.success,
            error: updateResult.error
          });
          
        } else {
          console.log('캠페인 상세 조회 실패:', campaignDetailResponse.status);
        }
      }
    } else {
      console.log('캠페인 목록 조회 실패 - 상태 코드:', campaignsResponse.status);
    }
    
  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
  }
}

// 테스트 실행
testBusinessChange();