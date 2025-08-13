const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// DATABASE_URL은 환경 변수에서 읽어야 합니다
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  console.error('.env.local 또는 .env 파일에 DATABASE_URL을 설정해주세요.');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testCampaignQuery() {
  try {
    console.log('Testing campaign query...');
    
    // 간단한 쿼리 먼저 테스트
    const simpleCount = await prisma.campaign.count();
    console.log('Campaign count:', simpleCount);
    
    // 복잡한 쿼리 테스트
    const campaigns = await prisma.campaign.findMany({
      include: {
        business: {
          select: {
            id: true,
            email: true,
            name: true,
            businessProfile: {
              select: {
                businessName: true,
                businessCategory: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      take: 5
    });
    
    console.log('Found campaigns:', campaigns.length);
    console.log('First campaign:', JSON.stringify(campaigns[0], null, 2));
    
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCampaignQuery();