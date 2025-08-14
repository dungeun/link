import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/category-pages - 모든 카테고리 페이지 조회
export async function GET() {
  try {
    const categoryPages = await prisma.categoryPage.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true, level: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      categoryPages
    })
  } catch (error) {
    console.error('Error fetching category pages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category pages' },
      { status: 500 }
    )
  }
}

// POST /api/admin/category-pages - 새 카테고리 페이지 생성
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      categoryId, 
      title, 
      content, 
      layout = 'grid',
      heroSection,
      featuredSection,
      filterOptions,
      customSections,
      seoSettings
    } = data

    // 카테고리가 존재하는지 확인
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 400 }
      )
    }

    // 이미 페이지가 존재하는지 확인
    const existingPage = await prisma.categoryPage.findUnique({
      where: { categoryId }
    })

    if (existingPage) {
      return NextResponse.json(
        { success: false, error: 'Category page already exists' },
        { status: 400 }
      )
    }

    const categoryPage = await prisma.categoryPage.create({
      data: {
        categoryId,
        title,
        content,
        layout,
        heroSection,
        featuredSection,
        filterOptions,
        customSections,
        seoSettings
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      categoryPage
    })
  } catch (error) {
    console.error('Error creating category page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category page' },
      { status: 500 }
    )
  }
}