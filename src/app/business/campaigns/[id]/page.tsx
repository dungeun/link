"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function BusinessCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    // 통합된 캠페인 상세 페이지로 리다이렉트
    router.replace(`/campaigns/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">리다이렉트 중...</p>
      </div>
    </div>
  );
}
