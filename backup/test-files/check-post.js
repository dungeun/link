const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPost() {
  try {
    const postId = 'cmdkvgxpo0005es2ogkymn5c9';
    
    // 특정 게시글 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true
      }
    });
    
    if (post) {
      console.log('게시글 발견:');
      console.log('- ID:', post.id);
      console.log('- 제목:', post.title);
      console.log('- 상태:', post.status);
      console.log('- 작성자:', post.author.name);
      console.log('- 생성일:', post.createdAt);
    } else {
      console.log('게시글을 찾을 수 없습니다:', postId);
    }
    
    // 전체 게시글 수 확인
    const totalPosts = await prisma.post.count();
    const publishedPosts = await prisma.post.count({
      where: { status: 'PUBLISHED' }
    });
    
    console.log('\n게시글 통계:');
    console.log('- 전체:', totalPosts);
    console.log('- 게시됨:', publishedPosts);
    
    // 최근 게시글 5개 확인
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('\n최근 게시글들:');
    recentPosts.forEach(post => {
      console.log(`- ${post.id}: "${post.title}" (${post.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPost();