const { PrismaClient } = require('@prisma/client');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// 환경 변수 강제 설정
process.env.DATABASE_URL = 'postgres://linkpick_user:LinkPick2024!@coolify.one-q.xyz:5433/revu_platform';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('Testing database connection...');
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    
    const userCount = await prisma.user.count();
    console.log('Total users:', userCount);
    
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();