import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/categories/[slug]/campaigns - 카테고리별 캠페인 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'latest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

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

    // 검색 및 정렬 조건 설정
    const whereConditions: any = {
      categories: {
        some: {
          categoryId: category.id
        }
      },
      status: 'ACTIVE'
    }

    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 정렬 조건 설정
    let orderBy: any = { createdAt: 'desc' } // 기본값: 최신 순

    switch (sort) {
      case 'budget_high':
        orderBy = { budget: 'desc' }
        break
      case 'budget_low':
        orderBy = { budget: 'asc' }
        break
      case 'popular':
        orderBy = { viewCount: 'desc' }
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 캠페인 조회
    const [campaigns, totalCount] = await Promise.all([
      prisma.campaign.findMany({
        where: whereConditions,
        include: {
          business: {
            select: { name: true }
          },
          categories: {
            include: {
              category: {
                select: { name: true, icon: true }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.campaign.count({ where: whereConditions })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      campaigns,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching category campaigns:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}