"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  FileText,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

interface Earning {
  id: string;
  campaignId: string;
  campaignTitle: string;
  brand: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  submittedDate: string;
  approvedDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  invoiceUrl?: string;
  taxDeducted?: number;
  netAmount?: number;
}

interface EarningStats {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  averagePerCampaign: number;
  totalCampaigns: number;
  growthRate: number;
}

interface PaymentAccount {
  id: string;
  type: "bank" | "paypal" | "stripe";
  name: string;
  accountNumber?: string;
  isDefault: boolean;
  verified: boolean;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<EarningStats | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "month" | "quarter" | "year"
  >("month");
  const [selectedStatus, setSelectedStatus] = useState<"all" | string>("all");
  const [loading, setLoading] = useState(true);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // Mock 데이터
  const mockEarnings: Earning[] = [
    {
      id: "1",
      campaignId: "1",
      campaignTitle: "여름 신제품 뷰티 리뷰 캠페인",
      brand: "글로우 코스메틱",
      amount: 500000,
      status: "completed",
      submittedDate: "2024-06-25",
      approvedDate: "2024-06-28",
      paidDate: "2024-07-05",
      paymentMethod: "계좌이체",
      invoiceUrl: "/invoices/1.pdf",
      taxDeducted: 16500,
      netAmount: 483500,
    },
    {
      id: "2",
      campaignId: "2",
      campaignTitle: "프리미엄 피트니스 웨어 착용 리뷰",
      brand: "액티브 스포츠",
      amount: 300000,
      status: "processing",
      submittedDate: "2024-06-20",
      approvedDate: "2024-06-23",
      taxDeducted: 9900,
      netAmount: 290100,
    },
    {
      id: "3",
      campaignId: "3",
      campaignTitle: "신메뉴 맛집 탐방 리뷰",
      brand: "맛있는 레스토랑",
      amount: 200000,
      status: "completed",
      submittedDate: "2024-05-28",
      approvedDate: "2024-05-30",
      paidDate: "2024-06-05",
      paymentMethod: "계좌이체",
      invoiceUrl: "/invoices/3.pdf",
      taxDeducted: 6600,
      netAmount: 193400,
    },
    {
      id: "4",
      campaignId: "4",
      campaignTitle: "봄 컬렉션 패션 화보",
      brand: "트렌디 패션",
      amount: 450000,
      status: "pending",
      submittedDate: "2024-06-30",
    },
    {
      id: "5",
      campaignId: "5",
      campaignTitle: "스마트폰 액세서리 리뷰",
      brand: "테크 액세서리",
      amount: 250000,
      status: "completed",
      submittedDate: "2024-05-15",
      approvedDate: "2024-05-18",
      paidDate: "2024-05-25",
      paymentMethod: "계좌이체",
      invoiceUrl: "/invoices/5.pdf",
      taxDeducted: 8250,
      netAmount: 241750,
    },
  ];

  const mockStats: EarningStats = {
    totalEarnings: 1700000,
    pendingEarnings: 450000,
    thisMonthEarnings: 1250000,
    lastMonthEarnings: 450000,
    averagePerCampaign: 340000,
    totalCampaigns: 5,
    growthRate: 177.8,
  };

  const mockPaymentAccounts: PaymentAccount[] = [
    {
      id: "1",
      type: "bank",
      name: "국민은행",
      accountNumber: "****-****-****-1234",
      isDefault: true,
      verified: true,
    },
    {
      id: "2",
      type: "paypal",
      name: "PayPal",
      accountNumber: "user@example.com",
      isDefault: false,
      verified: true,
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setEarnings(mockEarnings);
      setStats(mockStats);
      setPaymentAccounts(mockPaymentAccounts);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: Earning["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Earning["status"]) => {
    switch (status) {
      case "pending":
        return "검토중";
      case "processing":
        return "처리중";
      case "completed":
        return "지급완료";
      case "failed":
        return "지급실패";
      default:
        return "";
    }
  };

  const getStatusColor = (status: Earning["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredEarnings = earnings.filter((earning) => {
    if (selectedStatus !== "all" && earning.status !== selectedStatus) {
      return false;
    }

    if (selectedPeriod !== "all") {
      const date = new Date(earning.submittedDate);
      const now = new Date();
      const diffMonths =
        (now.getFullYear() - date.getFullYear()) * 12 +
        now.getMonth() -
        date.getMonth();

      if (selectedPeriod === "month" && diffMonths > 0) return false;
      if (selectedPeriod === "quarter" && diffMonths > 2) return false;
      if (selectedPeriod === "year" && diffMonths > 11) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">수익 관리</h1>
          <p className="text-gray-600">캠페인 수익과 정산 내역을 확인하세요</p>
        </div>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Download className="h-5 w-5" />
          내역 다운로드
        </button>
      </div>

      {/* 수익 통계 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span
                className={`flex items-center gap-1 text-sm ${stats.growthRate > 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.growthRate > 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(stats.growthRate)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">총 수익</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalEarnings)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">대기중 수익</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.pendingEarnings)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">이번 달 수익</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.thisMonthEarnings)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">평균 캠페인 수익</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.averagePerCampaign)}
            </p>
          </div>
        </div>
      )}

      {/* 정산 계좌 정보 */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">정산 계좌</h2>
          <button
            onClick={() => setShowAddAccountModal(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            계좌 관리
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentAccounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-lg p-4 ${account.isDefault ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {account.type === "bank" ? (
                    <Building className="h-5 w-5 text-gray-600" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="font-medium text-gray-900">
                    {account.name}
                  </span>
                  {account.isDefault && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      기본
                    </span>
                  )}
                </div>
                {account.verified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">{account.accountNumber}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체 기간</option>
              <option value="month">이번 달</option>
              <option value="quarter">최근 3개월</option>
              <option value="year">올해</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="pending">검토중</option>
              <option value="processing">처리중</option>
              <option value="completed">지급완료</option>
              <option value="failed">지급실패</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>{filteredEarnings.length}개 항목</span>
          </div>
        </div>
      </div>

      {/* 수익 내역 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  브랜드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제출일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  세금
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  실수령액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEarnings.map((earning) => (
                <tr key={earning.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {earning.campaignTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{earning.brand}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {formatDate(earning.submittedDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(earning.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {earning.taxDeducted
                        ? formatCurrency(earning.taxDeducted)
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {earning.netAmount
                        ? formatCurrency(earning.netAmount)
                        : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(earning.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(earning.status)}`}
                      >
                        {getStatusText(earning.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {earning.invoiceUrl && (
                        <a
                          href={earning.invoiceUrl}
                          className="text-blue-600 hover:text-blue-700"
                          title="인보이스 다운로드"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        className="text-gray-600 hover:text-gray-700"
                        title="도움말"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 빈 상태 */}
      {filteredEarnings.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg">
          <div className="text-gray-400 mb-4">
            <DollarSign className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            수익 내역이 없습니다
          </h3>
          <p className="text-gray-600">
            선택한 기간에 해당하는 수익 내역이 없습니다
          </p>
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          자주 묻는 질문
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  정산은 언제 이루어지나요?
                </h4>
                <p className="text-sm text-gray-600">
                  캠페인 콘텐츠가 승인된 후 영업일 기준 7일 이내에 정산됩니다.
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  세금은 어떻게 계산되나요?
                </h4>
                <p className="text-sm text-gray-600">
                  사업소득세 3.3%가 자동으로 원천징수되며, 실수령액은 세후
                  금액입니다.
                </p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  인보이스는 어떻게 받나요?
                </h4>
                <p className="text-sm text-gray-600">
                  정산 완료 후 인보이스가 자동 생성되며, 다운로드 버튼을 통해
                  받으실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
