#!/usr/bin/env node

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

// 단일 캠페인 테스트 크롤링
async function testSingleCrawl() {
  console.log('🔍 단일 캠페인 테스트 크롤링 시작...')
  
  const testUrl = 'https://www.revu.net/campaign/1199320'
  const testTitle = '[스웰] 프리미엄 텀블러 익스플로러'
  
  let browser
  try {
    browser = await puppeteer.launch({
      headless: false, // 헤드리스 모드 비활성화하여 브라우저 확인
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security'
      ]
    })
    
    const page = await browser.newPage()
    
    // 사용자 에이전트 설정
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
    
    console.log(`📍 접속 중: ${testUrl}`)
    
    // 페이지 접속
    const response = await page.goto(testUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })
    
    console.log(`📡 응답 상태: ${response.status()}`)
    
    // 페이지 로딩 완료 대기
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // 페이지 제목 확인
    const pageTitle = await page.title()
    console.log(`📄 페이지 제목: ${pageTitle}`)
    
    // 페이지 내용 추출
    const campaignData = await page.evaluate(() => {
      const data = {
        extractedAt: new Date().toISOString(),
        pageTitle: document.title,
        url: window.location.href
      }
      
      // 모든 텍스트 요소 찾기
      const allTexts = Array.from(document.querySelectorAll('*'))
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 3)
        .slice(0, 50) // 첫 50개만
      
      data.allTexts = allTexts
      
      // 이미지 찾기
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height
        }))
        .filter(img => img.src && !img.src.includes('data:'))
        .slice(0, 10)
      
      data.images = images
      
      // 특정 선택자들 시도
      const selectors = [
        'h1', 'h2', 'h3',
        '.title', '.campaign-title', '.product-title',
        '.description', '.content', '.campaign-content',
        '.price', '.amount', '.reward',
        '.brand', '.company',
        '.category', '.tag'
      ]
      
      data.elementsBySelector = {}
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          data.elementsBySelector[selector] = Array.from(elements)
            .map(el => el.textContent?.trim())
            .filter(text => text)
            .slice(0, 3)
        }
      })
      
      return data
    })
    
    // 스크린샷 촬영
    const screenshotDir = path.join(__dirname, '..', 'screenshots')
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }
    
    const screenshotPath = path.join(screenshotDir, 'test-crawl.png')
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    })
    console.log(`📸 스크린샷 저장: ${screenshotPath}`)
    
    // 결과 저장
    const outputDir = path.join(__dirname, '..', 'crawled-data')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const resultData = {
      testUrl,
      testTitle,
      responseStatus: response.status(),
      campaignData,
      success: true
    }
    
    const outputFile = path.join(outputDir, 'test-crawl-result.json')
    fs.writeFileSync(outputFile, JSON.stringify(resultData, null, 2), 'utf8')
    console.log(`💾 결과 저장: ${outputFile}`)
    
    console.log('\\n✅ 테스트 크롤링 완료!')
    console.log(`- 응답 상태: ${response.status()}`)
    console.log(`- 페이지 제목: ${pageTitle}`)
    console.log(`- 추출된 텍스트: ${campaignData.allTexts?.length || 0}개`)
    console.log(`- 이미지: ${campaignData.images?.length || 0}개`)
    
    return resultData
    
  } catch (error) {
    console.error('❌ 테스트 크롤링 실패:', error.message)
    
    const errorResult = {
      testUrl,
      testTitle,
      error: error.message,
      success: false
    }
    
    // 에러 결과도 저장
    const outputDir = path.join(__dirname, '..', 'crawled-data')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    const errorFile = path.join(outputDir, 'test-crawl-error.json')
    fs.writeFileSync(errorFile, JSON.stringify(errorResult, null, 2), 'utf8')
    
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  testSingleCrawl()
    .then(() => {
      console.log('🎉 테스트 완료!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 테스트 실패:', error.message)
      process.exit(1)
    })
}

module.exports = { testSingleCrawl }