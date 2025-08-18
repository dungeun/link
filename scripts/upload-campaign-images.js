#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function uploadCampaignImages() {
  console.log('🖼️  캠페인 이미지 업로드 시작...')
  
  try {
    // 모든 캠페인 조회
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        businessId: true
      }
    })
    
    console.log(`📊 총 ${campaigns.length}개 캠페인에 이미지 업로드`)
    
    const imagesDir = path.join(__dirname, '..', '첨부사진')
    const imageFiles = fs.readdirSync(imagesDir, { encoding: 'utf8' }).filter(file => 
      file.match(/\.(png|jpg|jpeg)$/i) && !file.startsWith('.')
    )
    
    
    console.log(`📁 총 ${imageFiles.length}개 이미지 파일 발견`)
    
    let successCount = 0
    let failCount = 0
    
    // 브랜드명 매핑 (캠페인 제목에서 브랜드 추출)
    const getBrandFromTitle = (title) => {
      const match = title.match(/\[(.+?)\]/)
      return match ? match[1].trim() : null
    }
    
    // 이미지 파일명에서 브랜드명 추출
    const getBrandFromFileName = (filename) => {
      // 파일 확장자와 숫자 제거 (01, 02)
      return filename.replace(/\d+\.(png|jpg|jpeg)$/i, '').trim()
    }
    
    // 브랜드별 직접 파일 매핑 (인코딩 문제 해결)
    const brandFileMapping = {
      '션리': ['션리01.png', '션리02.jpg'],
      '콰트': ['콰트01.png', '콰트02.jpg'], 
      '스터디파이': ['스터디파이01.png', '스터디파이02.jpg'],
      '육식미가': ['육식미가01.png', '육식미가02.jpg'],
      '레터치': ['레터치01.png', '레터치02.jpg'],
      '글램벅스': ['글램벅스01.png', '글램벅스02.jpg'],
      '쿡세라': ['쿡세라01.png', '쿡세라02.jpg'],
      '파우': ['파우01.png', '파우02.jpg'],
      '스웰': ['스웰01.png', '스웰02.jpg'],
      '오스템': ['오스템01.png', '오스템02.jpg'],
      '메디콕': ['메디콕01.png', '메디콕02.jpg'],
      '카멜마운트': ['카멜마운트01.png', '카멜마운트02.jpg'],
      '네스틱': ['네스틱01.png', '네스틱02.jpg'],
      '소유': ['소유01.png', '소유02.jpg'],
      '마르마르디': ['마르마르디01.png', '마르마르디02.jpg'],
      '비큐셀': ['비큐셀01.png', '비큐셀02.jpg'],
      'TOKEBI': ['TOKEBI01.png', 'TOKEBI02.jpg'],
      '아리얼': ['아리얼01.png', '아리얼02.jpg'],
      'Suoui': ['Suoui01.png', 'Suoui02.jpg'],
      'khiho': ['khiho01.png', 'khiho02.jpg']
    }
    
    for (const campaign of campaigns) {
      try {
        const brand = getBrandFromTitle(campaign.title)
        if (!brand) {
          console.log(`⚠️  브랜드명을 찾을 수 없음: ${campaign.title}`)
          failCount++
          continue
        }
        
        // 직접 매핑 테이블에서 파일명 가져오기
        const brandFiles = brandFileMapping[brand]
        if (!brandFiles) {
          console.log(`❌ [${brand}] 브랜드 매핑을 찾을 수 없음`)
          failCount++
          continue
        }
        
        const thumbnailFile = brandFiles[0] // 01 파일
        const detailFile = brandFiles[1]    // 02 파일
        
        // 실제 파일 존재 확인
        const thumbnailExists = fs.existsSync(path.join(imagesDir, thumbnailFile))
        const detailExists = fs.existsSync(path.join(imagesDir, detailFile))
        
        if (!thumbnailExists || !detailExists) {
          console.log(`❌ [${brand}] 파일 존재 확인 실패 - 썸네일: ${thumbnailExists}, 상세: ${detailExists}`)
          failCount++
          continue
        }
        
        
        console.log(`📤 [${brand}] 이미지 업로드 중...`)
        console.log(`  - 썸네일: ${thumbnailFile}`)
        console.log(`  - 상세: ${detailFile}`)
        
        // 이미지 파일 경로
        const thumbnailPath = `/images/campaigns/${thumbnailFile}`
        const detailPath = `/images/campaigns/${detailFile}`
        
        // 이미지 파일을 public/images/campaigns/ 폴더로 먼저 복사
        const publicDir = path.join(__dirname, '..', 'public', 'images', 'campaigns')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }
        
        fs.copyFileSync(
          path.join(imagesDir, thumbnailFile),
          path.join(publicDir, thumbnailFile)
        )
        fs.copyFileSync(
          path.join(imagesDir, detailFile),
          path.join(publicDir, detailFile)
        )
        
        // File 테이블에 이미지 등록 (url 필드 추가)
        const thumbnailFileRecord = await prisma.file.create({
          data: {
            userId: campaign.businessId,
            originalName: thumbnailFile,
            filename: thumbnailFile,
            path: thumbnailPath,
            url: thumbnailPath,
            size: fs.statSync(path.join(imagesDir, thumbnailFile)).size,
            mimetype: thumbnailFile.endsWith('.png') ? 'image/png' : 'image/jpeg',
            type: 'campaign_thumbnail'
          }
        })
        
        const detailFileRecord = await prisma.file.create({
          data: {
            userId: campaign.businessId,
            originalName: detailFile,
            filename: detailFile,
            path: detailPath,
            url: detailPath,
            size: fs.statSync(path.join(imagesDir, detailFile)).size,
            mimetype: detailFile.endsWith('.png') ? 'image/png' : 'image/jpeg',
            type: 'campaign_detail'
          }
        })
        
        // 캠페인 이미지 URL 업데이트
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            imageUrl: thumbnailPath,        // 썸네일 (01)
            imageId: thumbnailFileRecord.id,
            headerImageUrl: detailPath,     // 상세 이미지 (02)
            thumbnailImageUrl: thumbnailPath,
            detailImages: JSON.stringify([
              {
                id: detailFileRecord.id,
                url: detailPath,
                filename: detailFile,
                type: 'detail'
              }
            ]),
            productImages: JSON.stringify([
              {
                id: thumbnailFileRecord.id,
                url: thumbnailPath,
                filename: thumbnailFile,
                type: 'thumbnail'
              },
              {
                id: detailFileRecord.id,
                url: detailPath,
                filename: detailFile,
                type: 'detail'
              }
            ])
          }
        })
        
        
        console.log(`  ✅ [${brand}] 이미지 업로드 완료`)
        successCount++
        
      } catch (error) {
        console.log(`  ❌ 캠페인 이미지 업로드 실패: ${campaign.title} - ${error.message}`)
        failCount++
      }
    }
    
    console.log('\n📊 이미지 업로드 완료!')
    console.log(`✅ 성공: ${successCount}개`)
    console.log(`❌ 실패: ${failCount}개`)
    
    // 이미지가 있는 캠페인 개수 확인
    const campaignsWithImages = await prisma.campaign.count({
      where: {
        imageUrl: {
          not: null
        }
      }
    })
    
    console.log(`🖼️  이미지가 있는 캠페인: ${campaignsWithImages}개`)
    
  } catch (error) {
    console.error('❌ 이미지 업로드 실패:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
if (require.main === module) {
  uploadCampaignImages()
}

module.exports = { uploadCampaignImages }