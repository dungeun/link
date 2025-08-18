const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: { level: 1 },
      include: {
        children: true
      },
      orderBy: { menuOrder: 'asc' }
    });
    
    console.log('=== 현재 카테고리 구조 ===');
    console.log(`총 대분류: ${categories.length}개\n`);
    
    categories.forEach(cat => {
      console.log(`📁 ${cat.name} (${cat.slug}) - 대분류`);
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach(child => {
          console.log(`  └─ ${child.name} (${child.slug})`);
        });
      } else {
        console.log('  └─ [중분류 없음]');
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();