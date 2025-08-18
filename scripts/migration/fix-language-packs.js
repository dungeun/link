const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLanguagePacks() {
  try {
    console.log('🔧 Fixing language packs...\n');

    // 번역이 필요한 언어팩들
    const updates = [
      {
        key: 'header.menu.병원',
        ko: '병원',
        en: 'Hospital',
        jp: '病院'
      },
      {
        key: 'header.menu.구매평',
        ko: '구매평',
        en: 'Reviews',
        jp: 'レビュー'
      },
      {
        key: 'header.menu.커뮤니티',
        ko: '커뮤니티',
        en: 'Community',
        jp: 'コミュニティ'
      },
      {
        key: 'header.menu.캠페인_카테고리',
        ko: '캠페인',
        en: 'Campaign',
        jp: 'キャンペーン'
      }
    ];

    for (const update of updates) {
      const existing = await prisma.languagePack.findUnique({
        where: { key: update.key }
      });

      if (existing) {
        // 업데이트
        await prisma.languagePack.update({
          where: { key: update.key },
          data: {
            ko: update.ko,
            en: update.en,
            jp: update.jp
          }
        });
        console.log(`✅ Updated: ${update.key}`);
        console.log(`   KO: ${update.ko} | EN: ${update.en} | JP: ${update.jp}`);
      } else {
        // 새로 생성
        await prisma.languagePack.create({
          data: {
            key: update.key,
            ko: update.ko,
            en: update.en,
            jp: update.jp,
            category: 'header',
            description: '헤더 메뉴'
          }
        });
        console.log(`✅ Created: ${update.key}`);
        console.log(`   KO: ${update.ko} | EN: ${update.en} | JP: ${update.jp}`);
      }
    }

    console.log('\n✅ Language packs fixed successfully!');
    
    // 최종 확인
    console.log('\n📋 Final language packs:');
    const packs = await prisma.languagePack.findMany({
      where: { 
        key: { 
          in: updates.map(u => u.key)
        }
      }
    });
    
    for (const pack of packs) {
      console.log(`${pack.key}: KO="${pack.ko}" EN="${pack.en}" JP="${pack.jp}"`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixLanguagePacks();