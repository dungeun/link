const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePromoSection() {
  try {
    // 현재 프로모션 섹션 찾기
    const promoSection = await prisma.uISection.findFirst({
      where: { sectionId: 'promo' }
    });

    if (promoSection) {
      // content 구조 수정 - banner 중첩 제거
      const newContent = {
        title: '🚀 지금 시작하세요!',
        subtitle: '첫 캠페인은 수수료 50% 할인',
        link: '/business/register',
        icon: '🎯',
        backgroundColor: '#FEF3C7',
        textColor: '#000000',
        backgroundImage: null
      };

      const newTranslations = {
        en: {
          title: '🚀 Start Now!',
          subtitle: '50% off commission for your first campaign',
          link: '/business/register',
          icon: '🎯',
          backgroundColor: '#FEF3C7',
          textColor: '#000000',
          backgroundImage: null
        },
        jp: {
          title: '🚀 今すぐ始めましょう！',
          subtitle: '初回キャンペーンは手数料50％割引',
          link: '/business/register',
          icon: '🎯',
          backgroundColor: '#FEF3C7',
          textColor: '#000000',
          backgroundImage: null
        }
      };

      await prisma.uISection.update({
        where: { id: promoSection.id },
        data: {
          content: newContent,
          translations: newTranslations
        }
      });

      console.log('✅ 프로모션 섹션 구조가 수정되었습니다.');
      console.log('새로운 구조:', JSON.stringify(newContent, null, 2));
    } else {
      console.log('❌ 프로모션 섹션을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePromoSection();