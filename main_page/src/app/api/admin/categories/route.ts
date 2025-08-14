import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/categories - 모든 카테고리 조회 (계층 구조)
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: { id: true, name: true, level: true }
        },
        children: {
          select: { id: true, name: true, level: true, isActive: true }
        },
        categoryPage: {
          select: { id: true, isPublished: true }
        },
        campaigns: {
          select: { id: true }
        }
      },
      orderBy: [
        { level: 'asc' },
        { menuOrder: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        ...cat,
        campaignCount: cat.campaigns.length
      }))
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/admin/categories - 새 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, slug, parentId, description, icon, color, imageUrl } = data

    // slug 중복 체크
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    })
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category slug already exists' },
        { status: 400 }
      )
    }

    // 부모 카테고리가 있는 경우 레벨 계산
    let level = 1
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId }
      })
      if (parent) {
        level = parent.level + 1
        if (level > 3) { // 최대 3단계까지만 허용
          return NextResponse.json(
            { success: false, error: 'Maximum category depth (3 levels) exceeded' },
            { status: 400 }
          )
        }
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId,
        level,
        description,
        icon,
        color,
        imageUrl
      },
      include: {
        parent: {
          select: { id: true, name: true, level: true }
        },
        children: {
          select: { id: true, name: true, level: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}