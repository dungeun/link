"use client";

import { useState } from "react";

export default function AdminPaymentsPage() {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [searchQuery, setSearchQuery] = useState("");

  const payments = [
    {
      id: 1,
      type: "campaign_payment",
      campaignTitle: "2025 신제품 런칭 캠페인",
      influencer: "뷰티크리에이터A",
      brand: "클린뷰티 브랜드 A",
      amount: 850000,
      commission: 127500,
      netAmount: 722500,
      status: "completed",
      paymentDate: "2025-06-25",
      method: "bank_transfer",
      invoiceId: "INV-2025-001",
    },
    {
      id: 2,
      type: "subscription",
      campaignTitle: "Pro 플랜 - 월간 구독",
      influencer: null,
      brand: "패션 브랜드 B",
      amount: 99000,
      commission: 0,
      netAmount: 99000,
      status: "completed",
      paymentDate: "2025-06-20",
      method: "card",
      invoiceId: "SUB-2025-024",
    },
    {
      id: 3,
      type: "campaign_payment",
      campaignTitle: "여름 컬렉션 스타일링",
      influencer: "패션인플루언서B",
      brand: "패션 브랜드 B",
      amount: 650000,
      commission: 97500,
      netAmount: 552500,
      status: "pending",
      paymentDate: "2025-06-28",
      method: "bank_transfer",
      invoiceId: "INV-2025-002",
    },
    {
      id: 4,
      type: "refund",
      campaignTitle: "취소된 푸드 캠페인",
      influencer: "푸드블로거C",
      brand: "레스토랑 C",
      amount: -300000,
      commission: 0,
      netAmount: -300000,
      status: "processing",
      paymentDate: "2025-06-24",
      method: "bank_transfer",
      invoiceId: "REF-2025-003",
    },
    {
      id: 5,
      type: "campaign_payment",
      campaignTitle: "AI 앱 베타 테스트",
      influencer: "테크리뷰어D",
      brand: "테크 스타트업 D",
      amount: 750000,
      commission: 112500,
      netAmount: 637500,
      status: "failed",
      paymentDate: "2025-06-22",
      method: "card",
      invoiceId: "INV-2025-003",
    },
  ];

  const typeOptions = [
    { value: "all", label: "전체", count: payments.length },
    {
      value: "campaign_payment",
      label: "캠페인 결제",
      count: payments.filter((p) => p.type === "campaign_payment").length,
    },
    {
      value: "subscription",
      label: "구독료",
      count: payments.filter((p) => p.type === "subscription").length,
    },
    {
      value: "refund",
      label: "환불",
      count: payments.filter((p) => p.type === "refund").length,
    },
  ];

  const statusOptions = [
    { value: "all", label: "전체 상태" },
    { value: "completed", label: "완료" },
    { value: "pending", label: "대기" },
    { value: "processing", label: "처리중" },
    { value: "failed", label: "실패" },
  ];

  const periodOptions = [
    { value: "7days", label: "최근 7일" },
    { value: "30days", label: "최근 30일" },
    { value: "90days", label: "최근 90일" },
    { value: "1year", label: "1년" },
  ];

  const filteredPayments = payments.filter((payment) => {
    const matchesType = selectedType === "all" || payment.type === selectedType;
    const matchesStatus =
      selectedStatus === "all" || payment.status === selectedStatus;
    const matchesSearch =
      payment.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.influencer &&
        payment.influencer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      payment.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { label: "완료", className: "bg-green-100 text-green-700" },
      pending: { label: "대기", className: "bg-yellow-100 text-yellow-700" },
      processing: { label: "처리중", className: "bg-blue-100 text-blue-700" },
      failed: { label: "실패", className: "bg-red-100 text-red-700" },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      campaign_payment: {
        label: "캠페인",
        className: "bg-indigo-100 text-indigo-700",
      },
      subscription: {
        label: "구독",
        className: "bg-purple-100 text-purple-700",
      },
      refund: { label: "환불", className: "bg-orange-100 text-orange-700" },
    };
    const typeInfo = typeMap[type as keyof typeof typeMap];
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${typeInfo.className}`}
      >
        {typeInfo.label}
      </span>
    );
  };

  const getMethodIcon = (method: string) => {
    return method === "card" ? "💳" : "🏦";
  };

  const totalRevenue = payments
    .filter((p) => p.status === "completed" && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCommission = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.commission, 0);

  const pendingPayments = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결제 관리</h1>
          <p className="text-gray-600">
            모든 결제 내역을 관리하고 모니터링하세요
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
            내보내기
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            수동 결제 처리
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 수익</p>
              <p className="text-2xl font-bold text-green-600">
                ₩{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              💰
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">플랫폼 수수료</p>
              <p className="text-2xl font-bold text-blue-600">
                ₩{totalCommission.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              📊
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">대기 중인 결제</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingPayments}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              ⏳
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번 달 거래</p>
              <p className="text-2xl font-bold text-purple-600">
                {payments.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              📋
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="캠페인명, 인플루언서, 브랜드, 인보이스 ID로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedType(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === option.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>

          {/* Status & Period Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {periodOptions.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  거래 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수수료
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  실 수령액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="payment-card hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.campaignTitle}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.influencer
                          ? `${payment.influencer} ← ${payment.brand}`
                          : payment.brand}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center mt-1">
                        <span className="mr-2">
                          {getMethodIcon(payment.method)}
                        </span>
                        {payment.invoiceId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getTypeBadge(payment.type)}</td>
                  <td className="px-6 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        payment.amount < 0 ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {payment.amount < 0 ? "-" : ""}₩
                      {Math.abs(payment.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.commission > 0
                      ? `₩${payment.commission.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        payment.netAmount < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {payment.netAmount < 0 ? "-" : ""}₩
                      {Math.abs(payment.netAmount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.paymentDate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        상세보기
                      </button>
                      {payment.status === "pending" && (
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                          승인
                        </button>
                      )}
                      {payment.status === "failed" && (
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          재시도
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
