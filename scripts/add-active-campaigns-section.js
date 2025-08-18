const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addActiveCampaignsSection() {
  try {
    console.log('Adding activeCampaigns section to database...');

    // 기존 섹션이 있는지 확인
    const existingSection = await prisma.uISection.findFirst({
      where: { sectionId: 'activeCampaigns' }
    });

    if (existingSection) {
      console.log('activeCampaigns section already exists, skipping...');
      return;
    }

    // activeCampaigns 섹션 생성
    const activeCampaignsSection = await prisma.uISection.create({
      data: {
        sectionId: 'activeCampaigns',
        type: 'activeCampaigns',
        title: '진행 중인 캠페인',
        subtitle: '현재 진행 중인 캠페인 목록',
        content: {
          count: 8,
          showViewAll: true,
          gridLayout: '2x4'
        },
        order: 7,
        visible: true,
        translations: {
          en: {
            title: 'Active Campaigns',
            subtitle: 'Currently running campaigns'
          },
          jp: {
            title: '進行中のキャンペーン',
            subtitle: '現在進行中のキャンペーン一覧'
          }
        }
      }
    });

    console.log('Successfully added activeCampaigns section:', activeCampaignsSection);

    // UI 설정 업데이트
    let uiConfig = await prisma.siteConfig.findFirst();
    
    if (uiConfig) {
      const currentConfig = uiConfig.config || {};
      
      // mainPage 섹션 순서에 activeCampaigns 추가
      const sectionOrder = currentConfig.mainPage?.sectionOrder || [
        { id: 'hero', type: 'hero', order: 1, visible: true },
        { id: 'category', type: 'category', order: 2, visible: true },
        { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
        { id: 'promo', type: 'promo', order: 4, visible: true },
        { id: 'ranking', type: 'ranking', order: 5, visible: true },
        { id: 'recommended', type: 'recommended', order: 6, visible: true }
      ];

      // activeCampaigns가 이미 있는지 확인
      const hasActiveCampaigns = sectionOrder.some(section => section.id === 'activeCampaigns');
      
      if (!hasActiveCampaigns) {
        sectionOrder.push({
          id: 'activeCampaigns',
          type: 'activeCampaigns',
          order: 7,
          visible: true
        });
      }

      const updatedConfig = {
        ...currentConfig,
        mainPage: {
          ...currentConfig.mainPage,
          sectionOrder: sectionOrder
        }
      };

      await prisma.siteConfig.update({
        where: { id: uiConfig.id },
        data: { config: updatedConfig }
      });

      console.log('Successfully updated UI config with activeCampaigns section');
    } else {
      // UI 설정이 없으면 생성
      await prisma.siteConfig.create({
        data: {
          config: {
            mainPage: {
              sectionOrder: [
                { id: 'hero', type: 'hero', order: 1, visible: true },
                { id: 'category', type: 'category', order: 2, visible: true },
                { id: 'quicklinks', type: 'quicklinks', order: 3, visible: true },
                { id: 'promo', type: 'promo', order: 4, visible: true },
                { id: 'ranking', type: 'ranking', order: 5, visible: true },
                { id: 'recommended', type: 'recommended', order: 6, visible: true },
                { id: 'activeCampaigns', type: 'activeCampaigns', order: 7, visible: true }
              ]
            }
          }
        }
      });

      console.log('Successfully created new UI config with activeCampaigns section');
    }

  } catch (error) {
    console.error('Error adding activeCampaigns section:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  addActiveCampaignsSection()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addActiveCampaignsSection };