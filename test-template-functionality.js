#!/usr/bin/env node

/**
 * 템플릿 저장/불러오기 기능 테스트 스크립트
 */

const API_BASE = 'http://localhost:3001';

async function authenticate() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'business@test.com',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error('로그인 실패: ' + data.message);
  }
  
  return data.accessToken;
}

async function testTemplateAPI(token) {
  console.log('📋 템플릿 API 테스트 시작\n');
  
  // 1. 템플릿 목록 조회
  console.log('1️⃣ 템플릿 목록 조회...');
  const listResponse = await fetch(`${API_BASE}/api/business/templates`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const listData = await listResponse.json();
  console.log(`✅ 현재 템플릿 개수: ${listData.data?.templates?.length || 0}개\n`);
  
  // 2. 템플릿 생성
  console.log('2️⃣ 새 템플릿 생성...');
  const templateData = {
    name: `테스트 템플릿 ${Date.now()}`,
    description: '테스트용 템플릿입니다',
    data: {
      title: '샘플 캠페인',
      description: '템플릿 테스트용 캠페인',
      platform: 'instagram',
      startDate: '2025-02-01',
      endDate: '2025-02-28',
      budget: 1000000,
      maxApplicants: 10,
      requirements: '테스트 요구사항',
      hashtags: '#test #template',
      dynamicQuestions: [
        { id: '1', question: '질문 1', required: true },
        { id: '2', question: '질문 2', required: false }
      ],
      productImages: [
        { id: '1', url: '/test1.jpg', name: 'test1.jpg' },
        { id: '2', url: '/test2.jpg', name: 'test2.jpg' }
      ]
    }
  };
  
  const createResponse = await fetch(`${API_BASE}/api/business/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(templateData)
  });
  
  const createData = await createResponse.json();
  if (!createData.success) {
    throw new Error('템플릿 생성 실패: ' + createData.message);
  }
  
  const createdTemplateId = createData.data.id;
  console.log(`✅ 템플릿 생성 완료 (ID: ${createdTemplateId})\n`);
  
  // 3. 특정 템플릿 조회
  console.log('3️⃣ 생성된 템플릿 조회...');
  const getResponse = await fetch(`${API_BASE}/api/business/templates/${createdTemplateId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const getData = await getResponse.json();
  if (!getData.success) {
    throw new Error('템플릿 조회 실패: ' + getData.message);
  }
  
  console.log('✅ 템플릿 데이터:');
  console.log(`  - 이름: ${getData.data.name}`);
  console.log(`  - 설명: ${getData.data.description}`);
  console.log(`  - 저장된 데이터 필드: ${Object.keys(getData.data.data).join(', ')}\n`);
  
  // 4. 템플릿 삭제
  console.log('4️⃣ 템플릿 삭제...');
  const deleteResponse = await fetch(`${API_BASE}/api/business/templates/${createdTemplateId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const deleteData = await deleteResponse.json();
  if (!deleteData.success) {
    throw new Error('템플릿 삭제 실패: ' + deleteData.message);
  }
  
  console.log('✅ 템플릿 삭제 완료\n');
  
  // 5. 삭제 확인
  console.log('5️⃣ 삭제 확인...');
  const confirmResponse = await fetch(`${API_BASE}/api/business/templates/${createdTemplateId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const confirmData = await confirmResponse.json();
  if (confirmData.success) {
    throw new Error('템플릿이 삭제되지 않았습니다');
  }
  
  console.log('✅ 템플릿이 정상적으로 삭제되었습니다\n');
  
  return true;
}

async function main() {
  try {
    console.log('🔐 인증 진행 중...');
    const token = await authenticate();
    console.log('✅ 인증 성공\n');
    
    await testTemplateAPI(token);
    
    console.log('🎉 모든 테스트 통과!');
    console.log('📌 템플릿 저장/불러오기 기능이 정상적으로 DB와 연동되어 작동합니다.');
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    process.exit(1);
  }
}

// 서버가 준비될 때까지 대기
setTimeout(main, 3000);