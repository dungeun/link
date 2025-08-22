"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // 이 레이아웃은 리다이렉트 페이지에서만 사용되므로
    // 실제 사용자 타입별 레이아웃은 각 서브 디렉토리에서 처리
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      router.push("/login");
    }
  }, [router]);

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
