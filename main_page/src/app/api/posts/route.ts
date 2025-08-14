import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


// GET /api/posts - 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || 'latest'
    const skip = (page - 1) * limit

    const where: any = {
      status: 'PUBLISHED'
    }

    if (category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { author: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // 정렬 옵션 설정
    let orderBy: any = [
      { isPinned: 'desc' },
      { createdAt: 'desc' }
    ]

    if (sort === 'popular') {
      // 인기순: 조회수 기준
      orderBy = [
        { isPinned: 'desc' },
        { views: 'desc' },
        { createdAt: 'desc' }
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profile: {
                select: {
                  profileImage: true
                }
              }
            }
          },
          _count: {
            select: {
              comments: {
                where: { status: 'PUBLISHED' }
              },
              postLikes: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.post.count({ where })
    ])

    return NextResponse.json({
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        views: post.views,
        likes: post._count.postLikes,
        comments: post._count.comments,
        isPinned: post.isPinned,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
          id: post.author.id,
          name: post.author.name,
          avatar: post.author.profile?.profileImage
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/posts - 게시글 생성
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = await verifyJWT(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { title, content, category } = await request.json()

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validCategories = ['notice', 'tips', 'review', 'question', 'free']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        category,
        authorId: user.id,
        isPinned: category === 'notice' && (user.type === 'ADMIN' || user.type === 'admin')
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                profileImage: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: {
              where: { status: 'PUBLISHED' }
            },
            postLikes: true
          }
        }
      }
    })

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      views: post.views,
      likes: post._count.postLikes,
      comments: post._count.comments,
      isPinned: post.isPinned,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.name,
        avatar: post.author.profile?.profileImage
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}