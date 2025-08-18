#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 캠페인 카테고리 정의 (데이터베이스 스키마에 맞춰 수정)
const CATEGORIES = [
  {
    slug: 'beauty',
    name: '뷰티/화장품',
    description: '화장품, 스킨케어, 메이크업 제품',
    icon: '💄',
    color: '#FF6B9D',
    level: 1,
    subcategories: ['스킨케어', '메이크업', '헤어케어', '네일', '향수']
  },
  {
    slug: 'fashion',
    name: '패션/의류',
    description: '의류, 액세서리, 신발, 가방',
    icon: '👗',
    color: '#FF8A80',
    level: 1,
    subcategories: ['여성의류', '남성의류', '액세서리', '신발', '가방']
  },
  {
    slug: 'food',
    name: '식품/음료',
    description: '건강식품, 간식, 음료, 조미료',
    icon: '🥘',
    color: '#FFB74D',
    level: 1,
    subcategories: ['건강식품', '간식', '음료', '생필품', '조미료']
  },
  {
    slug: 'tech',
    name: '전자/IT',
    description: '전자제품, IT기기, 모바일',
    icon: '💻',
    color: '#64B5F6',
    level: 1,
    subcategories: ['모바일', '컴퓨터', '가전제품', '액세서리', '게임']
  },
  {
    slug: 'home',
    name: '홈/리빙',
    description: '인테리어, 주방용품, 생활용품',
    icon: '🏠',
    color: '#81C784',
    level: 1,
    subcategories: ['인테리어', '주방용품', '생활용품', '청소용품', '수납']
  },
  {
    slug: 'health',
    name: '건강/의료',
    description: '건강관리, 의료기기, 운동용품',
    icon: '🏥',
    color: '#A5D6A7',
    level: 1,
    subcategories: ['영양제', '의료기기', '운동용품', '다이어트', '건강관리']
  },
  {
    slug: 'baby',
    name: '육아/유아',
    description: '유아용품, 장난감, 기저귀',
    icon: '🍼',
    color: '#F8BBD9',
    level: 1,
    subcategories: ['기저귀', '이유식', '장난감', '유아용품', '임부용품']
  },
  {
    slug: 'pet',
    name: '반려동물',
    description: '반려동물 용품, 사료, 건강관리',
    icon: '🐕',
    color: '#BCAAA4',
    level: 1,
    subcategories: ['사료', '간식', '용품', '장난감', '건강관리']
  }
]

// HTTP 요청 함수 (Node.js 내장 모듈 사용)
async function makeRequest(url, method = 'GET', data = null) {
  const { default: fetch } = await import('node-fetch')
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  }
  
  if (data) {
    options.body = JSON.stringify(data)
  }
  
  try {
    const response = await fetch(url, options)
    const result = await response.text()
    
    let parsedData = null
    try {
      parsedData = result ? JSON.parse(result) : null
    } catch (parseError) {
      console.error(`JSON parse error for ${url}:`, parseError.message, result.substring(0, 200))
      parsedData = { error: 'Invalid JSON response', responseText: result.substring(0, 200) }
    }
    
    return {
      ok: response.ok,
      status: response.status,
      data: parsedData
    }
  } catch (error) {
    console.error(`Request failed: ${error.message}`)
    return {
      ok: false,
      status: 500,
      error: error.message
    }
  }
}

// 서버 상태 확인
async function checkServerStatus(baseUrl = 'http://localhost:3001') {
  console.log('🔍 서버 상태 확인 중...')
  
  try {
    const response = await makeRequest(baseUrl)
    if (response.ok) {
      console.log('✅ 서버 연결 성공!')
      return true
    } else {
      console.log(`⚠️ 서버 응답 오류: ${response.status}`)
      return false
    }
  } catch (error) {
    console.error('❌ 서버 연결 실패:', error.message)
    return false
  }
}

// 카테고리 업로드 (부모 카테고리부터)
async function uploadMainCategories(baseUrl = 'http://localhost:3001') {
  console.log('📤 메인 카테고리 업로드 중...')
  
  for (const category of CATEGORIES) {
    console.log(`  - ${category.name} 업로드...`)
    
    const categoryData = {
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      level: category.level,
      isActive: true,
      showInMenu: true
    }
    
    const response = await makeRequest(
      `${baseUrl}/api/admin/categories`, 
      'POST', 
      categoryData
    )
    
    if (response.ok) {
      console.log(`  ✅ ${category.name} 업로드 성공`)
    } else {
      console.log(`  ❌ ${category.name} 업로드 실패:`, response.data || response.status)
    }
  }
}

// 서브카테고리 업로드
async function uploadSubCategories(baseUrl = 'http://localhost:3001') {
  console.log('📤 서브카테고리 업로드 중...')
  
  // 먼저 기존 카테고리 조회하여 parent ID 매핑
  const categoriesResponse = await makeRequest(`${baseUrl}/api/admin/categories`)
  if (!categoriesResponse.ok) {
    console.error('❌ 기존 카테고리 조회 실패')
    return false
  }
  
  const existingCategories = categoriesResponse.data.categories || []
  const categoryMap = {}
  existingCategories.forEach(cat => {
    categoryMap[cat.slug] = cat.id
  })
  
  // 각 메인 카테고리의 서브카테고리 생성
  for (const mainCategory of CATEGORIES) {
    const parentId = categoryMap[mainCategory.slug]
    if (!parentId) {
      console.log(`  ⚠️ ${mainCategory.name}의 ID를 찾을 수 없습니다`)
      continue
    }
    
    console.log(`  - ${mainCategory.name}의 서브카테고리 업로드...`)
    
    for (let i = 0; i < mainCategory.subcategories.length; i++) {
      const subCategoryName = mainCategory.subcategories[i]
      const subCategorySlug = `${mainCategory.slug}-${subCategoryName.replace(/[\/\s]/g, '-').toLowerCase()}`
      
      const subCategoryData = {
        slug: subCategorySlug,
        name: subCategoryName,
        parentId: parentId,
        level: 2,
        description: `${mainCategory.name} > ${subCategoryName}`,
        isActive: true,
        showInMenu: false,
        menuOrder: i
      }
      
      const response = await makeRequest(
        `${baseUrl}/api/admin/categories`, 
        'POST', 
        subCategoryData
      )
      
      if (response.ok) {
        console.log(`    ✅ ${subCategoryName} 업로드 성공`)
      } else {
        console.log(`    ❌ ${subCategoryName} 업로드 실패:`, response.data || response.status)
      }
    }
  }
}

// 20개 캠페인은 별도 스크립트에서 처리 (데이터베이스 직접 삽입)
function showCampaignUploadInfo() {
  console.log('📋 캠페인 데이터 업로드 안내:')
  console.log('  - 20개 캠페인 데이터는 final-campaigns 폴더에 준비되어 있습니다')
  console.log('  - SQL 스크립트: final-campaigns/insert-20-campaigns.sql')
  console.log('  - JSON 데이터: final-campaigns/all-20-campaigns.json')
  console.log('  - 데이터베이스에 직접 삽입하거나 별도 관리자 도구를 사용하세요')
}

// 업로드된 데이터 확인
async function verifyUpload(baseUrl = 'http://localhost:3001') {
  console.log('🔍 업로드된 데이터 확인 중...')
  
  // 카테고리 확인
  const categoriesResponse = await makeRequest(`${baseUrl}/api/admin/categories`)
  if (categoriesResponse.ok && categoriesResponse.data) {
    const categories = categoriesResponse.data.categories || []
    const mainCategories = categories.filter(cat => cat.level === 1)
    const subCategories = categories.filter(cat => cat.level === 2)
    
    console.log(`  ✅ 메인 카테고리: ${mainCategories.length}개`)
    console.log(`  ✅ 서브 카테고리: ${subCategories.length}개`)
    console.log(`  ✅ 총 카테고리: ${categories.length}개`)
    
    // 메인 카테고리 목록 출력
    if (mainCategories.length > 0) {
      console.log('  📋 생성된 메인 카테고리:')
      mainCategories.forEach(cat => {
        const subCount = categories.filter(sub => sub.parentId === cat.id).length
        console.log(`    - ${cat.name} (${subCount}개 서브카테고리)`)
      })
    }
  } else {
    console.log('  ❌ 카테고리 확인 실패')
  }
}

// 메인 실행 함수
async function main() {
  console.log('🎯 REVU 플랫폼 카테고리 업로드 시작...\n')
  
  const baseUrl = 'http://localhost:3001'
  
  try {
    // 1. 서버 상태 확인
    const serverOk = await checkServerStatus(baseUrl)
    if (!serverOk) {
      console.error('❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.')
      process.exit(1)
    }
    
    console.log('')
    
    // 2. 메인 카테고리 업로드
    await uploadMainCategories(baseUrl)
    
    console.log('')
    
    // 3. 서브 카테고리 업로드
    await uploadSubCategories(baseUrl)
    
    console.log('')
    
    // 4. 업로드 결과 확인
    await verifyUpload(baseUrl)
    
    console.log('')
    
    // 5. 캠페인 데이터 업로드 안내
    showCampaignUploadInfo()
    
    console.log('\n🎉 카테고리 업로드가 완료되었습니다!')
    console.log(`📱 관리자 페이지: ${baseUrl}/admin/categories`)
    
  } catch (error) {
    console.error('❌ 업로드 실패:', error.message)
    process.exit(1)
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main()
}

module.exports = { 
  uploadMainCategories, 
  uploadSubCategories, 
  checkServerStatus,
  showCampaignUploadInfo
}