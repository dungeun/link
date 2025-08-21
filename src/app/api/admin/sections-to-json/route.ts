import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// Admin 섹션 데이터를 JSON으로 직접 저장하는 API
export async function POST(request: NextRequest) {
  try {
    const { sectionId, data } = await request.json()
    
    // JSON 파일 경로
    const jsonPath = path.join(process.cwd(), 'public/cache/homepage-unified.json')
    
    // 현재 JSON 읽기
    const currentData = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
    
    // 섹션 데이터 업데이트
    if (!currentData.sections) {
      currentData.sections = {}
    }
    
    // 섹션별 데이터 변환
    switch (sectionId) {
      case 'category':
        currentData.sections.category = {
          type: 'category',
          visible: data.visible ?? true,
          data: {
            categories: data.categories.map((cat: any) => ({
              id: cat.id,
              name: {
                ko: cat.name,
                en: cat.nameEn || cat.name,
                jp: cat.nameJp || cat.name
              },
              slug: cat.link?.replace('/category/', '') || cat.link?.replace('/', ''),
              icon: cat.icon || '📁',
              href: cat.link,
              order: cat.order,
              visible: cat.visible,
              badge: cat.badge || null,
              badgeColor: cat.badgeColor || null
            }))
          }
        }
        break
        
      case 'hero':
        currentData.sections.hero = {
          type: 'hero',
          visible: data.visible ?? true,
          data: {
            slides: data.slides || []
          }
        }
        break
        
      case 'quicklinks':
        currentData.sections.quicklinks = {
          type: 'quicklinks',
          visible: data.visible ?? true,
          data: {
            links: data.links || []
          }
        }
        break
        
      case 'promo':
        currentData.sections.promo = {
          type: 'promo',
          visible: data.visible ?? true,
          data: data.content || {}
        }
        break
        
      default:
        currentData.sections[sectionId] = {
          type: sectionId,
          visible: data.visible ?? true,
          data: data.content || data
        }
    }
    
    // 메타데이터 업데이트
    currentData.metadata = {
      ...currentData.metadata,
      lastUpdated: new Date().toISOString(),
      version: `2025.${new Date().getMonth() + 1}.${new Date().getDate()}.${new Date().getHours()}${new Date().getMinutes()}`
    }
    
    // JSON 파일 저장
    await fs.writeFile(jsonPath, JSON.stringify(currentData, null, 2))
    
    // 백업 생성
    const backupDir = path.join(process.cwd(), 'public/cache/backups/homepage')
    await fs.mkdir(backupDir, { recursive: true })
    const backupPath = path.join(backupDir, `homepage-${new Date().toISOString().replace(/:/g, '-')}.json`)
    await fs.writeFile(backupPath, JSON.stringify(currentData, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Section saved to JSON successfully',
      section: sectionId 
    })
    
  } catch (error) {
    console.error('Error saving section to JSON:', error)
    return NextResponse.json(
      { error: 'Failed to save section to JSON' },
      { status: 500 }
    )
  }
}

// 섹션 데이터 가져오기
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('section')
    
    const jsonPath = path.join(process.cwd(), 'public/cache/homepage-unified.json')
    const data = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))
    
    if (sectionId && data.sections?.[sectionId]) {
      return NextResponse.json(data.sections[sectionId])
    }
    
    return NextResponse.json(data.sections || {})
    
  } catch (error) {
    console.error('Error reading section from JSON:', error)
    return NextResponse.json(
      { error: 'Failed to read section from JSON' },
      { status: 500 }
    )
  }
}