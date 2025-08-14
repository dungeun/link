import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 연결 테스트
    const userCount = await prisma.user.count();
    const campaignCount = await prisma.campaign.count();
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      stats: {
        users: userCount,
        campaigns: campaignCount
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured',
        port: process.env.PORT || 3000
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'not configured'
      }
    }, { status: 500 });
  }
}