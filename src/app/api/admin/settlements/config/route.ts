// 정산 설정 API
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/db/prisma';

// 정산 설정 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    // SiteConfig에서 정산 관련 설정 조회
    const [
      platformFeeRate,
      minSettlementAmount,
      settlementPeriod,
      autoSettlementEnabled
    ] = await Promise.all([
      prisma.siteConfig.findUnique({
        where: { key: 'settlement.platformFeeRate' }
      }),
      prisma.siteConfig.findUnique({
        where: { key: 'settlement.minAmount' }
      }),
      prisma.siteConfig.findUnique({
        where: { key: 'settlement.periodDays' }
      }),
      prisma.siteConfig.findUnique({
        where: { key: 'settlement.autoEnabled' }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        platformFeeRate: platformFeeRate ? parseFloat(platformFeeRate.value) : 0.2,
        minSettlementAmount: minSettlementAmount ? parseInt(minSettlementAmount.value) : 10000,
        settlementPeriodDays: settlementPeriod ? parseInt(settlementPeriod.value) : 7,
        autoSettlementEnabled: autoSettlementEnabled ? autoSettlementEnabled.value === 'true' : false
      }
    });
  } catch (error) {
    console.error('정산 설정 조회 오류:', error);
    return NextResponse.json(
      { error: '정산 설정 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 정산 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const {
      platformFeeRate,
      minSettlementAmount,
      settlementPeriodDays,
      autoSettlementEnabled
    } = body;

    const updates = [];

    if (platformFeeRate !== undefined) {
      updates.push(
        prisma.siteConfig.upsert({
          where: { key: 'settlement.platformFeeRate' },
          update: { value: platformFeeRate.toString() },
          create: { 
            key: 'settlement.platformFeeRate',
            value: platformFeeRate.toString()
          }
        })
      );
    }

    if (minSettlementAmount !== undefined) {
      updates.push(
        prisma.siteConfig.upsert({
          where: { key: 'settlement.minAmount' },
          update: { value: minSettlementAmount.toString() },
          create: { 
            key: 'settlement.minAmount',
            value: minSettlementAmount.toString()
          }
        })
      );
    }

    if (settlementPeriodDays !== undefined) {
      updates.push(
        prisma.siteConfig.upsert({
          where: { key: 'settlement.periodDays' },
          update: { value: settlementPeriodDays.toString() },
          create: { 
            key: 'settlement.periodDays',
            value: settlementPeriodDays.toString()
          }
        })
      );
    }

    if (autoSettlementEnabled !== undefined) {
      updates.push(
        prisma.siteConfig.upsert({
          where: { key: 'settlement.autoEnabled' },
          update: { value: autoSettlementEnabled.toString() },
          create: { 
            key: 'settlement.autoEnabled',
            value: autoSettlementEnabled.toString()
          }
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: '정산 설정이 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('정산 설정 업데이트 오류:', error);
    return NextResponse.json(
      { error: '정산 설정 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}