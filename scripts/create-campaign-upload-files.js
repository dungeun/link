#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 크롤링.md 파일에서 캠페인 데이터 파싱
function parseCampaignData() {
  const mdFilePath = path.join(__dirname, '..', '크롤링.md')
  const content = fs.readFileSync(mdFilePath, 'utf8')
  
  const lines = content.split('\n').filter(line => line.trim())
  const campaigns = []
  
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const id = lines[i].trim()
      const title = lines[i + 1].trim()
      const url = lines[i + 2].trim()
      
      if (id && title && url.startsWith('https://')) {
        campaigns.push({
          id: parseInt(id),
          title: title.replace(/^\\[|\\]$/g, ''), // 대괄호 제거
          url: url,
          filename: generateFilename(title)
        })
      }
    }
  }
  
  return campaigns
}

// 파일명 생성 함수
function generateFilename(title) {
  // 브랜드명과 제품명 추출
  const match = title.match(/\\[(.+?)\\](.+)/)
  if (match) {
    const brand = match[1].trim()
    const product = match[2].trim()
    
    // 파일명으로 사용할 수 없는 문자 제거
    const safeBrand = brand.replace(/[^a-zA-Z0-9가-힣\\s]/g, '').trim()
    const safeProduct = product.replace(/[^a-zA-Z0-9가-힣\\s]/g, '').trim()
    
    return `${safeBrand}_${safeProduct}`.replace(/\\s+/g, '_')
  }
  
  return title.replace(/[^a-zA-Z0-9가-힣\\s]/g, '').replace(/\\s+/g, '_')
}

// 업로드 파일 생성
function createUploadFiles(campaigns) {
  const uploadsDir = path.join(__dirname, '..', 'uploads')
  
  // uploads 디렉토리 생성
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log('📁 uploads 디렉토리 생성')
  }
  
  // JSON 형태로 전체 캠페인 데이터 저장
  const campaignDataFile = path.join(uploadsDir, 'campaign-data.json')
  fs.writeFileSync(campaignDataFile, JSON.stringify(campaigns, null, 2), 'utf8')
  console.log(`✅ ${campaignDataFile} 생성`)
  
  // CSV 형태로 캠페인 데이터 저장
  const csvContent = [
    'id,brand,product,title,url,filename',
    ...campaigns.map(c => {
      const titleMatch = c.title.match(/\\[(.+?)\\](.+)/)
      const brand = titleMatch ? titleMatch[1].trim() : ''
      const product = titleMatch ? titleMatch[2].trim() : c.title
      
      return `${c.id},"${brand}","${product}","${c.title}","${c.url}","${c.filename}"`
    })
  ].join('\\n')
  
  const csvFile = path.join(uploadsDir, 'campaign-data.csv')
  fs.writeFileSync(csvFile, csvContent, 'utf8')
  console.log(`✅ ${csvFile} 생성`)
  
  // 각 캠페인별 개별 JSON 파일 생성
  campaigns.forEach(campaign => {
    const campaignFile = path.join(uploadsDir, `${campaign.filename}.json`)
    const campaignData = {
      id: campaign.id,
      title: campaign.title,
      url: campaign.url,
      filename: campaign.filename,
      createdAt: new Date().toISOString(),
      status: 'pending',
      metadata: {
        source: '크롤링.md',
        originalTitle: campaign.title
      }
    }
    
    fs.writeFileSync(campaignFile, JSON.stringify(campaignData, null, 2), 'utf8')
    console.log(`📄 ${campaign.filename}.json 생성`)
  })
  
  return campaigns.length
}

// 메인 실행 함수
function main() {
  console.log('🚀 캠페인 업로드 파일 생성 시작...')
  
  try {
    const campaigns = parseCampaignData()
    console.log(`📊 ${campaigns.length}개 캠페인 파싱 완료`)
    
    const createdCount = createUploadFiles(campaigns)
    
    console.log('\\n🎉 업로드 파일 생성 완료!')
    console.log(`📁 생성된 파일: ${createdCount + 2}개`)
    console.log('   - campaign-data.json (전체 데이터)')
    console.log('   - campaign-data.csv (CSV 형태)')
    console.log(`   - ${createdCount}개 개별 JSON 파일`)
    console.log(`\\n📍 위치: /Users/admin/new_project/revu-platform/uploads/`)
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message)
    process.exit(1)
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main()
}

module.exports = { parseCampaignData, createUploadFiles }