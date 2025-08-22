"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  User,
  Heart,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { logger } from "@/lib/logger";

interface MyPageProps {
  user: any;
  initialApplications?: any[];
  initialLikedCampaigns?: any[];
  stats?: {
    totalApplications: number;
    acceptedApplications: number;
    completedCampaigns: number;
    totalEarnings: number;
  };
}

/**
 * 최적화된 마이페이지 컴포넌트
 * 무한 스크롤과 탭 레이지 로딩 적용
 */
const OptimizedMyPage = memo(
  ({
    user,
    initialApplications = [],
    initialLikedCampaigns = [],
    stats = {
      totalApplications: 0,
      acceptedApplications: 0,
      completedCampaigns: 0,
      totalEarnings: 0,
    },
  }: MyPageProps) => {
    const [activeTab, setActiveTab] = useState("applications");

    // 신청 내역 상태
    const [applications, setApplications] = useState(initialApplications);
    const [appCursor, setAppCursor] = useState<string | null>(null);
    const [appHasMore, setAppHasMore] = useState(true);
    const [appLoading, setAppLoading] = useState(false);

    // 좋아요 캠페인 상태
    const [likedCampaigns, setLikedCampaigns] = useState(initialLikedCampaigns);
    const [likeCursor, setLikeCursor] = useState<string | null>(null);
    const [likeHasMore, setLikeHasMore] = useState(true);
    const [likeLoading, setLikeLoading] = useState(false);

    // 신청 내역 추가 로드
    const loadMoreApplications = useCallback(async () => {
      if (appLoading || !appHasMore) return;

      try {
        setAppLoading(true);

        const params = new URLSearchParams();
        if (appCursor) params.append("cursor", appCursor);
        params.append("limit", "20");

        const response = await fetch(`/api/mypage/applications?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to load applications");

        const data = await response.json();

        setApplications((prev) => [...prev, ...data.items]);
        setAppCursor(data.nextCursor);
        setAppHasMore(data.hasMore);

        logger.info(`Loaded more applications - count: ${data.items?.length}`);
      } catch (error) {
        logger.error(
          `Failed to load applications - error: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setAppLoading(false);
      }
    }, [appCursor, appHasMore, appLoading]);

    // 좋아요 캠페인 추가 로드
    const loadMoreLikedCampaigns = useCallback(async () => {
      if (likeLoading || !likeHasMore) return;

      try {
        setLikeLoading(true);

        const params = new URLSearchParams();
        if (likeCursor) params.append("cursor", likeCursor);
        params.append("limit", "20");

        const response = await fetch(`/api/mypage/liked-campaigns?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to load liked campaigns");

        const data = await response.json();

        setLikedCampaigns((prev) => [...prev, ...data.items]);
        setLikeCursor(data.nextCursor);
        setLikeHasMore(data.hasMore);

        logger.info(
          `Loaded more liked campaigns - count: ${data.items?.length}`,
        );
      } catch (error) {
        logger.error(
          `Failed to load liked campaigns - error: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        setLikeLoading(false);
      }
    }, [likeCursor, likeHasMore, likeLoading]);

    // 무한 스크롤 Hooks
    const { sentinelRef: appSentinelRef } = useInfiniteScroll({
      onLoadMore: loadMoreApplications,
      hasMore: appHasMore,
      loading: appLoading,
      threshold: 200,
    });

    const { sentinelRef: likeSentinelRef } = useInfiniteScroll({
      onLoadMore: loadMoreLikedCampaigns,
      hasMore: likeHasMore,
      loading: likeLoading,
      threshold: 200,
    });

    // 상태별 배지 색상
    const getStatusBadge = useCallback((status: string) => {
      switch (status) {
        case "PENDING":
          return (
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              대기중
            </Badge>
          );
        case "ACCEPTED":
          return (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              승인됨
            </Badge>
          );
        case "REJECTED":
          return (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              거절됨
            </Badge>
          );
        case "COMPLETED":
          return (
            <Badge className="bg-blue-100 text-blue-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              완료
            </Badge>
          );
        default:
          return <Badge>{status}</Badge>;
      }
    }, []);

    // 통계 카드 데이터
    const statsCards = useMemo(
      () => [
        {
          title: "총 신청",
          value: stats.totalApplications,
          icon: FileText,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
        {
          title: "승인된 캠페인",
          value: stats.acceptedApplications,
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        },
        {
          title: "완료한 캠페인",
          value: stats.completedCampaigns,
          icon: TrendingUp,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        },
        {
          title: "총 수익",
          value: `₩${stats.totalEarnings.toLocaleString()}`,
          icon: DollarSign,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        },
      ],
      [stats],
    );

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.name}
                  fill
                  className="rounded-full object-cover"
                  unoptimized={user.profileImage.includes(
                    "blob.vercel-storage.com",
                  )}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex gap-4 mt-3">
                <span className="text-sm">
                  <strong>{user.followerCount?.toLocaleString() || 0}</strong>{" "}
                  팔로워
                </span>
                {user.platforms?.map((platform: string) => (
                  <Badge key={platform} variant="outline">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
            <Link href="/mypage/edit">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                프로필 수정
              </Button>
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">신청 내역</TabsTrigger>
            <TabsTrigger value="liked">관심 캠페인</TabsTrigger>
            <TabsTrigger value="reviews">작성한 리뷰</TabsTrigger>
          </TabsList>

          {/* 신청 내역 탭 */}
          <TabsContent value="applications" className="mt-6">
            <div className="space-y-4">
              {applications.map((app: any) => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        {app.campaign?.thumbnailImageUrl && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                            <Image
                              src={app.campaign.thumbnailImageUrl}
                              alt={app.campaign.title}
                              fill
                              className="object-cover"
                              unoptimized={app.campaign.thumbnailImageUrl.includes(
                                "blob.vercel-storage.com",
                              )}
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {app.campaign?.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {app.campaign?.business?.name}
                          </p>
                          <div className="flex gap-3 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              신청일:{" "}
                              {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />₩
                              {app.campaign?.budget?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(app.status)}
                        <Link href={`/campaigns/${app.campaign?.id}`}>
                          <Button variant="outline" size="sm">
                            상세보기
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 무한 스크롤 센티널 */}
              {appHasMore && (
                <div ref={appSentinelRef} className="h-10 flex justify-center">
                  {appLoading && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 관심 캠페인 탭 */}
          <TabsContent value="liked" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {likedCampaigns.map((campaign: any) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      {campaign.thumbnailImageUrl && (
                        <Image
                          src={campaign.thumbnailImageUrl}
                          alt={campaign.title}
                          fill
                          className="object-cover rounded-t-lg"
                          unoptimized={campaign.thumbnailImageUrl.includes(
                            "blob.vercel-storage.com",
                          )}
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500">
                        {campaign.business?.name}
                      </p>
                      <h3 className="font-medium text-sm line-clamp-2">
                        {campaign.title}
                      </h3>
                      <p className="text-sm font-bold mt-2">
                        ₩
                        {(
                          (typeof campaign.budget === "object"
                            ? campaign.budget?.amount
                            : campaign.budget) || 0
                        ).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {/* 무한 스크롤 센티널 */}
              {likeHasMore && (
                <div
                  ref={likeSentinelRef}
                  className="col-span-full h-10 flex justify-center"
                >
                  {likeLoading && (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 작성한 리뷰 탭 */}
          <TabsContent value="reviews" className="mt-6">
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>아직 작성한 리뷰가 없습니다.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);

OptimizedMyPage.displayName = "OptimizedMyPage";

export default OptimizedMyPage;
