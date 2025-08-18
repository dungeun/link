#!/usr/bin/env node

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

// 크롤링.md에서 캠페인 URL 목록 가져오기
function getCampaignUrls() {
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
          title: title.replace(/^\[|\]$/g, ''),
          url: url
        })
      }
    }
  }
  
  return campaigns
}

// 단일 캠페인 크롤링
async function scrapeCampaign(page, campaign) {
  try {
    console.log(`🔍 크롤링 중: ${campaign.title}`)
    
    await page.goto(campaign.url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    })
    
    // 페이지 로딩 대기
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 캠페인 정보 추출
    const campaignData = await page.evaluate(() => {
      const data = {}
      
      // 제목
      const titleEl = document.querySelector('h1, .campaign-title, .title')
      data.title = titleEl ? titleEl.textContent.trim() : ''
      
      // 브랜드
      const brandEl = document.querySelector('.brand, .company, .brand-name')
      data.brand = brandEl ? brandEl.textContent.trim() : ''
      
      // 설명
      const descEl = document.querySelector('.description, .campaign-desc, .content')
      data.description = descEl ? descEl.textContent.trim() : ''
      
      // 이미지
      const images = []
      const imgElements = document.querySelectorAll('img')
      imgElements.forEach(img => {
        if (img.src && !img.src.includes('logo') && !img.src.includes('icon')) {
          images.push(img.src)
        }
      })
      data.images = images.slice(0, 5) // 최대 5개
      
      // 가격 정보
      const priceEl = document.querySelector('.price, .amount, .reward')
      data.price = priceEl ? priceEl.textContent.trim() : ''
      
      // 카테고리
      const categoryEl = document.querySelector('.category, .tag')
      data.category = categoryEl ? categoryEl.textContent.trim() : ''
      
      // 기간
      const periodEl = document.querySelector('.period, .date, .deadline')
      data.period = periodEl ? periodEl.textContent.trim() : ''
      
      return data
    })
    
    return {
      ...campaign,
      ...campaignData,
      crawledAt: new Date().toISOString(),
      status: 'success'
    }
    
  } catch (error) {
    console.error(`❌ 크롤링 실패: ${campaign.title} - ${error.message}`)
    return {
      ...campaign,
      error: error.message,
      crawledAt: new Date().toISOString(),
      status: 'failed'
    }
  }
}

// 메인 크롤링 함수
async function crawlAllCampaigns() {
  console.log('🚀 Revu 캠페인 크롤링 시작...')
  
  const campaigns = getCampaignUrls()
  console.log(`📊 총 ${campaigns.length}개 캠페인 크롤링 예정`)
  
  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    })
    
    const page = await browser.newPage()
    
    // 기본 설정
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    const results = []
    
    // 각 캠페인 크롤링 (순차적으로)
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i]
      console.log(`\\n[${i + 1}/${campaigns.length}] 처리 중...`)
      
      const result = await scrapeCampaign(page, campaign)
      results.push(result)
      
      // 요청 간격 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 결과 저장
    const outputDir = path.join(__dirname, '..', 'crawled-data')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 전체 결과 저장
    const allDataFile = path.join(outputDir, 'crawled-campaigns.json')
    fs.writeFileSync(allDataFile, JSON.stringify(results, null, 2), 'utf8')
    console.log(`\\n✅ 전체 데이터 저장: ${allDataFile}`)
    
    // 성공한 캠페인만 저장
    const successResults = results.filter(r => r.status === 'success')
    const successFile = path.join(outputDir, 'successful-campaigns.json')
    fs.writeFileSync(successFile, JSON.stringify(successResults, null, 2), 'utf8')
    console.log(`✅ 성공 데이터 저장: ${successFile}`)
    
    // 요약 출력
    console.log(`\\n📋 크롤링 완료 요약:`)
    console.log(`- 총 캠페인: ${results.length}개`)
    console.log(`- 성공: ${successResults.length}개`)
    console.log(`- 실패: ${results.length - successResults.length}개`)
    
    return results
    
  } catch (error) {
    console.error('❌ 크롤링 중 오류 발생:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  crawlAllCampaigns()
    .then(() => {
      console.log('\\n🎉 모든 크롤링 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 크롤링 실패:', error)
      process.exit(1)
    })
}

module.exports = { crawlAllCampaigns, scrapeCampaign }