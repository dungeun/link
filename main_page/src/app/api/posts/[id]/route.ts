import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'


// GET /api/posts/[id] - 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 사용자 인증 확인 (선택적)
    let userId: string | null = null
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) {
      try {
        const user = await verifyJWT(token)
        if (user) {
          userId = user.userId || user.id
        }
      } catch (error) {
        // 토큰이 잘못되어도 게시글은 볼 수 있음
        console.log('Token validation error:', error)
      }
    }
    const post = await prisma.post.findUnique({
      where: {
        id: params.id,
        status: 'PUBLISHED'
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
        comments: {
          where: {
            status: 'PUBLISHED',
            parentId: null // 최상위 댓글만
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
            replies: {
              where: { status: 'PUBLISHED' },
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
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            postLikes: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 조회수 증가
    await prisma.post.update({
      where: { id: params.id },
      data: { views: { increment: 1 } }
    })

    // 사용자가 로그인한 경우 좋아요 상태 확인
    let isLiked = false
    if (userId) {
      const userLike = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: params.id,
            userId: userId
          }
        }
      })
      isLiked = !!userLike
    }

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      views: post.views + 1,
      likes: post._count.postLikes,
      isLiked: isLiked,
      isPinned: post.isPinned,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        name: post.author.name,
        avatar: post.author.profile?.profileImage
      },
      comments: post.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.id,
          name: comment.author.name,
          avatar: comment.author.profile?.profileImage
        },
        replies: comment.replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          author: {
            id: reply.author.id,
            name: reply.author.name,
            avatar: reply.author.profile?.profileImage
          }
        }))
      }))
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/posts/[id] - 게시글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingPost = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 작성자 또는 관리자만 수정 가능
    if (existingPost.authorId !== user.id && user.type !== 'ADMIN' && user.type !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const validCategories = ['notice', 'tips', 'review', 'question', 'free']
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category })
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
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      category: updatedPost.category,
      views: updatedPost.views,
      likes: updatedPost._count.postLikes,
      comments: updatedPost._count.comments,
      isPinned: updatedPost.isPinned,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      author: {
        id: updatedPost.author.id,
        name: updatedPost.author.name,
        avatar: updatedPost.author.profile?.profileImage
      }
    })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/posts/[id] - 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingPost = await prisma.post.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 작성자 또는 관리자만 삭제 가능
    if (existingPost.authorId !== user.id && user.type !== 'ADMIN' && user.type !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { status: 'DELETED' }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}