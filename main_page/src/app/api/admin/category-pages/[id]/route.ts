import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/category-pages/[id] - 특정 카테고리 페이지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryPage = await prisma.categoryPage.findUnique({
      where: { id: params.id },
      include: {
        category: {
          include: {
            parent: true,
            children: true
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

// PUT /api/admin/category-pages/[id] - 카테고리 페이지 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const {
      title,
      content,
      layout,
      heroSection,
      featuredSection,
      filterOptions,
      customSections,
      seoSettings,
      isPublished
    } = data

    const categoryPage = await prisma.categoryPage.update({
      where: { id: params.id },
      data: {
        title,
        content,
        layout,
        heroSection,
        featuredSection,
        filterOptions,
        customSections,
        seoSettings,
        isPublished,
        publishedAt: isPublished ? new Date() : null
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      categoryPage
    })
  } catch (error) {
    console.error('Error updating category page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category page' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/category-pages/[id] - 카테고리 페이지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.categoryPage.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category page deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category page' },
      { status: 500 }
    )
  }
}