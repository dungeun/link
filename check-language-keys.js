const { PrismaClient } = require('@prisma/client');

async function checkLanguageKeys() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== 현재 언어팩 데이터 분석 ===\n');
    
    // 모든 언어팩 조회
    const languagePacks = await prisma.languagePack.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });
    
    console.log(`전체 언어팩 수: ${languagePacks.length}\n`);
    
    // 카테고리별 분류
    const categories = {};
    const untranslatedItems = [];
    
    languagePacks.forEach(pack => {
      if (!categories[pack.category]) {
        categories[pack.category] = [];
      }
      categories[pack.category].push(pack);
      
      // 번역되지 않은 항목 체크
      if (!pack.en || pack.en === pack.ko || !pack.jp || pack.jp === pack.ko) {
        untranslatedItems.push(pack);
      }
    });
    
    // 카테고리별 출력
    console.log('=== 카테고리별 언어팩 ===');
    Object.keys(categories).sort().forEach(category => {
      console.log(`\n📁 ${category} (${categories[category].length}개)`);
      categories[category].forEach(pack => {
        const enStatus = pack.en && pack.en !== pack.ko ? '✅' : '❌';
        const jpStatus = pack.jp && pack.jp !== pack.ko ? '✅' : '❌';
        console.log(`  ${pack.key}: KO="${pack.ko}" EN=${enStatus} JP=${jpStatus}`);
      });
    });
    
    // 번역되지 않은 항목
    console.log(`\n=== 번역이 필요한 항목 (${untranslatedItems.length}개) ===`);
    untranslatedItems.forEach(pack => {
      const enMissing = !pack.en || pack.en === pack.ko;
      const jpMissing = !pack.jp || pack.jp === pack.ko;
      console.log(`🔸 [${pack.category}] ${pack.key}: "${pack.ko}"`);
      if (enMissing) console.log(`    - 영어 번역 누락`);
      if (jpMissing) console.log(`    - 일본어 번역 누락`);
    });
    
    // 헤더에서 사용되는 키 체크
    console.log('\n=== 헤더에서 사용되는 주요 키 확인 ===');
    const headerKeys = [
      'menu.login',
      'menu.logout', 
      'menu.signup',
      'menu.mypage',
      'menu.dashboard',
      'menu.user_management',
      'menu.campaign_management',
      'notification.title',
      'notification.empty'
    ];
    
    headerKeys.forEach(key => {
      const pack = languagePacks.find(p => p.key === key);
      if (pack) {
        const enStatus = pack.en && pack.en !== pack.ko ? '✅' : '❌';
        const jpStatus = pack.jp && pack.jp !== pack.ko ? '✅' : '❌';
        console.log(`${key}: EN=${enStatus} JP=${jpStatus} - "${pack.ko}"`);
      } else {
        console.log(`${key}: ❌ 언어팩 없음`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLanguageKeys();