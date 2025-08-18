const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestMenus() {
  try {
    console.log('🧹 Cleaning up test menus...\n');

    // 테스트 메뉴 삭제 (테스트 관련 메뉴들)
    const allMenus = await prisma.uISection.findMany({
      where: {
        type: 'header'
      }
    });

    const testMenus = allMenus.filter(menu => {
      const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
      return (
        menu.sectionId?.includes('test') || 
        menu.sectionId?.includes('테스트') ||
        content?.href === '/test' ||
        content?.name?.includes('테스트') ||
        content?.name?.includes('test')
      );
    });

    console.log(`Found ${testMenus.length} test menus to delete`);

    for (const menu of testMenus) {
      const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
      console.log(`  - Deleting: ${content.name || content.label} (${menu.id})`);
      
      // 메뉴 삭제
      await prisma.uISection.delete({
        where: { id: menu.id }
      });

      // 관련 언어팩도 삭제
      if (menu.sectionId) {
        await prisma.languagePack.deleteMany({
          where: { key: menu.sectionId }
        });
      }
    }

    console.log('\n✅ Test menus cleaned up successfully');

    // 최종 메뉴 목록 확인
    const finalMenus = await prisma.uISection.findMany({
      where: { type: 'header' },
      orderBy: { order: 'asc' }
    });

    console.log(`\n📋 Final menu list (${finalMenus.length} menus):`);
    finalMenus.forEach((menu, i) => {
      const content = typeof menu.content === 'string' ? JSON.parse(menu.content) : menu.content;
      console.log(`   ${i + 1}. ${content.name || content.label} → ${content.href}`);
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestMenus();