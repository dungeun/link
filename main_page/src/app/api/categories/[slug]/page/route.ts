import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/categories/[slug]/page - 카테고리 슬러그로 페이지 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 먼저 카테고리 찾기
    const category = await prisma.category.findUnique({
      where: { 
        slug: params.slug,
        isActive: true
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // 카테고리 페이지 찾기
    const categoryPage = await prisma.categoryPage.findUnique({
      where: { 
        categoryId: category.id,
        isPublished: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            color: true,
            level: true
          }
        }
      }
    })

    if (!categoryPage) {
      return NextResponse.json(
        { success: false, error: 'Category page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      categoryPage
    })
  } catch (error) {
    console.error('Error fetching category page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category page' },
      { status: 500 }
    )
  }
}