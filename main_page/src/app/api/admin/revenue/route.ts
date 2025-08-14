import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, createAuthResponse, createErrorResponse } from '@/lib/auth-middleware'
import { validateRequest, dateRangeSchema } from '@/lib/validation'
import { DEFAULT_PLATFORM_FEE_RATE, ERROR_MESSAGES } from '@/lib/constants'
import { z } from 'zod'

// Revenue query schema
const revenueQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await requireAuth(req, ['ADMIN']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = req.nextUrl.searchParams;
    
    // Validate query parameters
    const queryResult = await validateRequest(
      {
        period: searchParams.get('period'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate')
      },
      revenueQuerySchema
    );
    
    if (!queryResult.success) {
      return createErrorResponse('Invalid query parameters', 400, queryResult.errors);
    }
    
    const { period } = queryResult.data;
    const startDate = queryResult.data.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = queryResult.data.endDate || new Date().toISOString().split('T')[0]

    // 날짜 변환
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // 전체 수익 요약 데이터 조회
    const revenueData = await prisma.revenue.aggregate({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // 지출 데이터 조회
    const expenseData = await prisma.expense.aggregate({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      }
    })

    // 이전 기간 데이터 (성장률 계산용)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - daysDiff)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)

    const prevRevenueData = await prisma.revenue.aggregate({
      where: {
        date: {
          gte: prevStart,
          lte: prevEnd
        }
      },
      _sum: {
        amount: true
      }
    })

    // 성장률 계산
    const currentRevenue = revenueData._sum.amount || 0
    const previousRevenue = prevRevenueData._sum.amount || 0
    const monthlyGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    // 플랫폼 수수료율 설정
    const platformFeeRate = DEFAULT_PLATFORM_FEE_RATE || 0.1 // 10% 기본 수수료

    // 기간별 수익 데이터 조회
    const periodRevenue = await prisma.$queryRaw<Array<{
      period: string
      revenue: number
      expenses: number
      netProfit: number
    }>>`
      WITH revenue_data AS (
        SELECT 
          CASE 
            WHEN ${period} = 'daily' THEN TO_CHAR(date, 'YYYY-MM-DD')
            WHEN ${period} = 'weekly' THEN TO_CHAR(date, 'YYYY-WW')
            WHEN ${period} = 'yearly' THEN TO_CHAR(date, 'YYYY')
            ELSE TO_CHAR(date, 'YYYY-MM')
          END as period,
          SUM(amount) as revenue
        FROM revenues
        WHERE date >= ${start} AND date <= ${end}
        GROUP BY 1
      ),
      expense_data AS (
        SELECT 
          CASE 
            WHEN ${period} = 'daily' THEN TO_CHAR(date, 'YYYY-MM-DD')
            WHEN ${period} = 'weekly' THEN TO_CHAR(date, 'YYYY-WW')
            WHEN ${period} = 'yearly' THEN TO_CHAR(date, 'YYYY')
            ELSE TO_CHAR(date, 'YYYY-MM')
          END as period,
          SUM(amount) as expenses
        FROM expenses
        WHERE date >= ${start} AND date <= ${end}
        GROUP BY 1
      )
      SELECT 
        COALESCE(r.period, e.period) as period,
        COALESCE(r.revenue, 0)::float as revenue,
        COALESCE(e.expenses, 0)::float as expenses,
        (COALESCE(r.revenue, 0) * ${platformFeeRate} - COALESCE(e.expenses, 0))::float as netProfit
      FROM revenue_data r
      FULL OUTER JOIN expense_data e ON r.period = e.period
      ORDER BY 1
    `

    // 카테고리별 수익 데이터 조회 (type으로 그룹화)
    const categoryRevenue = await prisma.revenue.groupBy({
      by: ['type'],
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 10
    })

    // 전체 수익 대비 카테고리별 비율 계산
    const totalCategoryRevenue = categoryRevenue.reduce((sum, cat) => sum + (cat._sum.amount || 0), 0)
    const categoryRevenueWithPercentage = categoryRevenue.map(cat => ({
      category: cat.type,
      revenue: cat._sum.amount || 0,
      percentage: totalCategoryRevenue > 0 ? Math.round(((cat._sum.amount || 0) / totalCategoryRevenue) * 100) : 0
    }))

    // 응답 데이터 구성
    const totalRevenue = revenueData._sum.amount || 0
    const totalExpenses = expenseData._sum.amount || 0
    const platformFee = totalRevenue * platformFeeRate // platformFeeRate is already declared on line 105
    const settlementAmount = totalRevenue * (1 - platformFeeRate)
    const netProfit = platformFee - totalExpenses
    
    const summary = {
      totalRevenue,
      totalExpenses,
      netProfit,
      platformFee,
      settlementAmount,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
    }

    // 기간별 데이터 포맷팅
    const formattedPeriodRevenue = periodRevenue.map(item => ({
      month: item.period,
      revenue: item.revenue,
      expenses: item.expenses,
      netProfit: item.netProfit
    }))

    return NextResponse.json({
      summary,
      monthlyRevenue: formattedPeriodRevenue,
      categoryRevenue: categoryRevenueWithPercentage
    })

  } catch (error) {
    console.error('Revenue API Error:', error);
    return createErrorResponse(
      'Failed to fetch revenue data',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

// Revenue data schema
const revenueDataSchema = z.object({
  campaignId: z.string(),
  amount: z.number().positive(),
  category: z.string().optional(),
  platform: z.string().optional()
});

// 수익 데이터 생성/업데이트 (결제 완료 시 호출)
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    
    // Validate request data
    const validationResult = await validateRequest(body, revenueDataSchema);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid revenue data', 400, validationResult.errors);
    }
    
    const { campaignId, amount, category, platform } = validationResult.data

    // 오늘 날짜의 수익 레코드 찾기 또는 생성
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const platformFeeRate = DEFAULT_PLATFORM_FEE_RATE;
    const platformFee = amount * platformFeeRate
    const settlementAmount = amount * (1 - platformFeeRate)

    // Revenue 레코드 생성
    const revenue = await prisma.revenue.create({
      data: {
        type: 'campaign_fee',
        amount: platformFee, // 플랫폼 수수료가 실제 수익
        referenceId: campaignId,
        description: `Campaign fee for ${campaignId}`,
        metadata: {
          totalAmount: amount,
          platformFeeRate,
          settlementAmount,
          category,
          platform
        },
        date: today
      }
    })

    return createAuthResponse({ success: true, revenue }, 201);

  } catch (error) {
    console.error('Revenue POST Error:', error);
    return createErrorResponse(
      'Failed to create revenue record',
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}