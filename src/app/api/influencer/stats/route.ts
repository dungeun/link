import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/influencer/stats - 인플루언서 통계 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (user.type?.toUpperCase() !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서만 접근 가능합니다.' },
        { status: 403 }
      );
    }

    // 인플루언서 정보 조회
    const influencer = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        applications: {
          include: {
            campaign: {
              include: {
                business: {
                  include: {
                    businessProfile: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!influencer) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 통계 계산
    const applications = influencer.applications || [];
    
    // 승인된 캠페인들 중 완료된 것들 (캠페인이 COMPLETED 상태거나 현재 날짜가 endDate를 지났으면 완료로 간주)
    const completedCampaigns = applications.filter(app => {
      if (app.status !== 'APPROVED') return false;
      
      const campaign = app.campaign;
      if (!campaign) return false;
      
      // 캠페인이 COMPLETED 상태이거나
      if (campaign.status === 'COMPLETED') return true;
      
      // 캠페인 종료일이 지났거나
      if (new Date(campaign.endDate) < new Date()) return true;
      
      // 콘텐츠가 승인되었으면
      if (app.contents && Array.isArray(app.contents) && app.contents.some((content: { status: string }) => content.status === 'APPROVED')) return true;
      
      return false;
    });
    
    // 진행 중인 캠페인들
    const activeCampaigns = applications.filter(app => {
      if (app.status !== 'APPROVED') return false;
      
      const campaign = app.campaign;
      if (!campaign) return false;
      
      // 캠페인이 아직 진행중이고 종료일이 지나지 않았으면
      return campaign.status === 'ACTIVE' && new Date(campaign.endDate) >= new Date();
    });

    // 총 수익 계산 (완료된 캠페인 예산의 80%)
    const totalEarnings = completedCampaigns.reduce((sum, app) => {
      return sum + (app.campaign?.budget || 0) * 0.8; // 인플루언서는 80% 수령
    }, 0);

    // 평균 평점 계산 (실제로는 리뷰 테이블에서 계산)
    const averageRating = 4.8; // TODO: 실제 리뷰 데이터에서 계산

    // 총 조회수 (임시)
    const totalViews = Math.floor(Math.random() * 100000) + 50000;

    // 팔로워 수
    const followers = influencer.profile?.followerCount || 0;

    // 활동 중인 캠페인 데이터
    const activeCampaignData = activeCampaigns.map(app => {
      const hasSubmittedContent = app.contents && app.contents.length > 0;
      const hasPendingContent = app.contents && Array.isArray(app.contents) && app.contents.some((content: { status: string }) => content.status === 'PENDING_REVIEW');
      
      let campaignStatus = 'pending';
      if (hasSubmittedContent && hasPendingContent) {
        campaignStatus = 'submitted'; // 콘텐츠 제출 후 검토 대기
      } else if (hasSubmittedContent) {
        campaignStatus = 'in_progress';
      }
      
      return {
        id: app.campaign.id,
        title: app.campaign.title,
        brand: app.campaign.business.businessProfile?.companyName || app.campaign.business.name,
        deadline: app.campaign.endDate,
        reward: app.campaign.budget * 0.8, // 인플루언서 수령 예정 금액
        progress: hasSubmittedContent ? 80 : 20, // 콘텐츠 제출했으면 80%, 아니면 20%
        status: campaignStatus
      };
    });

    // 최근 수익 내역
    const recentEarnings = completedCampaigns.slice(0, 5).map(app => {
      const approvedContent = app.contents && Array.isArray(app.contents) ? 
        app.contents.find((content: { status: string; reviewedAt?: Date }) => content.status === 'APPROVED') : 
        null;
      return {
        id: app.id,
        campaignTitle: app.campaign.title,
        amount: app.campaign.budget * 0.8, // 인플루언서는 80% 수령
        date: approvedContent?.reviewedAt ? 
          new Date(approvedContent.reviewedAt).toISOString().split('T')[0] :
          app.updatedAt.toISOString().split('T')[0],
        status: 'paid'
      };
    });

    return NextResponse.json({
      stats: {
        totalCampaigns: applications.length,
        activeCampaigns: activeCampaigns.length,
        totalEarnings,
        averageRating,
        totalViews,
        followers
      },
      activeCampaigns: activeCampaignData,
      recentEarnings
    });
  } catch (error) {
    console.error('인플루언서 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}