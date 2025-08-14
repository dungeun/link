import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/categories/[id] - 특정 카테고리 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: {
          include: {
            children: true // 3단계까지 조회
          }
        },
        categoryPage: true,
        campaigns: {
          include: {
            campaign: {
              select: { id: true, title: true, status: true, createdAt: true }
            }
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/categories/[id] - 카테고리 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { name, slug, description, icon, color, imageUrl, isActive, showInMenu, menuOrder } = data

    // slug 중복 체크 (자신 제외)
    if (slug) {
      const existingCategory = await prisma.category.findFirst({
        where: { 
          slug,
          NOT: { id: params.id }
        }
      })
      
      if (existingCategory) {
        return NextResponse.json(
          { success: false, error: 'Category slug already exists' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name,
        slug,
        description,
        icon,
        color,
        imageUrl,
        isActive,
        showInMenu,
        menuOrder
      },
      include: {
        parent: true,
        children: true
      }
    })

    return NextResponse.json({
      success: true,
      category
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/categories/[id] - 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 삭제하려는 카테고리 조회
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: { slug: true }
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // campaigns와 all 카테고리는 삭제 불가
    if (category.slug === 'campaigns' || category.slug === 'all') {
      return NextResponse.json(
        { success: false, error: '이 카테고리는 삭제할 수 없습니다. (시스템 기본 카테고리)' },
        { status: 403 }
      )
    }

    // 하위 카테고리가 있는지 체크
    const childrenCount = await prisma.category.count({
      where: { parentId: params.id }
    })

    if (childrenCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with subcategories' },
        { status: 400 }
      )
    }

    // 캠페인이 연결되어 있는지 체크
    const campaignCount = await prisma.campaignCategory.count({
      where: { categoryId: params.id }
    })

    if (campaignCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with linked campaigns' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}