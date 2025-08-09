import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { translationService } from '@/lib/services/translation.service';
import { authenticate } from '@/lib/auth';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/campaigns - 캠페인 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    // 공통 인증 함수 사용
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
        { business: { businessProfile: { companyName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // 캠페인 조회
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              email: true,
              businessProfile: {
                select: {
                  companyName: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true
            }
          },
          applications: {
            where: { status: 'APPROVED' },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.campaign.count({ where })
    ]);

    // 응답 데이터 포맷
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      businessName: campaign.business.businessProfile?.companyName || campaign.business.name,
      businessEmail: campaign.business.email,
      platform: campaign.platform,
      budget: campaign.budget,
      targetFollowers: campaign.targetFollowers,
      startDate: campaign.startDate.toISOString().split('T')[0],
      endDate: campaign.endDate.toISOString().split('T')[0],
      status: campaign.status.toLowerCase(),
      applicantCount: campaign._count.applications,
      selectedCount: campaign.applications.length,
      createdAt: campaign.createdAt.toISOString().split('T')[0],
      imageUrl: campaign.imageUrl,
      hashtags: campaign.hashtags,
      requirements: campaign.requirements,
      isPaid: campaign.isPaid,
      platformFeeRate: (campaign as any).platformFeeRate || 0.2
    }));

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('캠페인 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '캠페인 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/campaigns - 캠페인 생성 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toLowerCase();
    if (userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      businessId,
      title,
      description,
      platform,
      budget,
      targetFollowers,
      startDate,
      endDate,
      requirements,
      hashtags,
      imageUrl,
      status = 'PENDING'
    } = body;

    // 필수 필드 검증
    if (!businessId || !title || !description || !platform || !budget || !targetFollowers || !startDate || !endDate) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 자동 번역 수행 (Google Translate API 키가 설정된 경우)
    let translatedData = {};
    const enableTranslation = process.env.GOOGLE_TRANSLATE_API_KEY && body.enableTranslation !== false;
    
    if (enableTranslation) {
      try {
        translatedData = await translationService.translateCampaignData({
          title,
          description,
          requirements,
          hashtags
        });
      } catch (error) {
        console.error('Translation failed:', error);
        // 번역 실패 시에도 캠페인 생성은 계속 진행
      }
    }

    // 캠페인 생성
    const campaign = await prisma.campaign.create({
      data: {
        businessId,
        title,
        description,
        platform: platform || 'general',
        budget: budget || 0,
        targetFollowers: targetFollowers || 0,
        requirements,
        hashtags,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status.toUpperCase(),
        imageUrl,
        // 번역된 데이터를 JSON 필드에 저장
        ...(Object.keys(translatedData).length > 0 && {
          translations: translatedData
        })
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      campaign: {
        ...campaign,
        startDate: campaign.startDate.toISOString().split('T')[0],
        endDate: campaign.endDate.toISOString().split('T')[0],
        status: campaign.status.toLowerCase()
      }
    });

  } catch (error) {
    console.error('캠페인 생성 오류:', error);
    return NextResponse.json(
      { error: '캠페인 생성에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}