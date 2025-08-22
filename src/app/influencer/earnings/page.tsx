"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";

interface Settlement {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  processedAt?: string;
  items: SettlementItem[];
}

interface SettlementItem {
  id: string;
  campaignTitle: string;
  amount: number;
  createdAt: string;
}

interface BankAccount {
  bank: string;
  accountNumber: string;
  accountHolder: string;
}

export default function InfluencerEarningsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [completedAmount, setCompletedAmount] = useState(0);
  const [availableAmount, setAvailableAmount] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    bank: "",
    accountNumber: "",
    accountHolder: "",
  });

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const response = await fetch("/api/influencer/settlements", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("정산 정보를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setSettlements(data.settlements || []);

      // 금액 계산
      let pending = 0;
      let completed = 0;
      let available = 0;

      data.settlements?.forEach((settlement: Settlement) => {
        if (settlement.status === "PENDING") {
          available += settlement.totalAmount;
        } else if (settlement.status === "REQUESTED") {
          pending += settlement.totalAmount;
        } else if (settlement.status === "COMPLETED") {
          completed += settlement.totalAmount;
        }
      });

      setPendingAmount(pending);
      setCompletedAmount(completed);
      setAvailableAmount(available);
    } catch (error) {
      toast({
        title: "오류",
        description: "정산 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async () => {
    const amount = parseInt(withdrawAmount);

    if (!amount || amount <= 0) {
      toast({
        title: "오류",
        description: "올바른 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (amount > availableAmount) {
      toast({
        title: "오류",
        description: "출금 가능 금액을 초과했습니다.",
        variant: "destructive",
      });
      return;
    }

    if (
      !bankAccount.bank ||
      !bankAccount.accountNumber ||
      !bankAccount.accountHolder
    ) {
      toast({
        title: "오류",
        description: "계좌 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/influencer/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          amount,
          bankAccount,
        }),
      });

      if (!response.ok) {
        throw new Error("출금 신청에 실패했습니다.");
      }

      toast({
        title: "성공",
        description:
          "출금 신청이 완료되었습니다. 영업일 기준 2-3일 내에 입금됩니다.",
      });

      setShowWithdrawModal(false);
      fetchSettlements();
    } catch (error) {
      toast({
        title: "오류",
        description: "출금 신청에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">수익 관리</h1>
          <p className="text-gray-600 mt-1">
            캠페인 수익과 정산 내역을 확인하세요
          </p>
        </div>

        {/* 수익 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">출금 가능</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₩{availableAmount.toLocaleString()}
            </p>
            <Button
              size="sm"
              className="mt-4 w-full"
              onClick={() => setShowWithdrawModal(true)}
              disabled={availableAmount === 0}
            >
              출금 신청
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">처리 중</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₩{pendingAmount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-4">영업일 2-3일 소요</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">누적 수익</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₩{completedAmount.toLocaleString()}
            </p>
            <Link
              href="/influencer/earnings/history"
              className="text-sm text-blue-600 hover:underline mt-4 inline-block"
            >
              상세 내역 보기
            </Link>
          </div>
        </div>

        {/* 최근 정산 항목 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              최근 정산 항목
            </h2>
          </div>

          <div className="divide-y">
            {settlements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                아직 정산 내역이 없습니다
              </div>
            ) : (
              settlements.slice(0, 5).map((settlement) => (
                <div key={settlement.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        정산 #{settlement.id.slice(-6)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(settlement.createdAt).toLocaleDateString()}{" "}
                        신청
                      </p>
                      <div className="mt-2">
                        {settlement.items.map((item, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            • {item.campaignTitle}: ₩
                            {item.amount.toLocaleString()}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ₩{settlement.totalAmount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          settlement.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : settlement.status === "REQUESTED"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {settlement.status === "COMPLETED"
                          ? "완료"
                          : settlement.status === "REQUESTED"
                            ? "처리중"
                            : "대기중"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 출금 신청 모달 */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                출금 신청
              </h2>

              <div className="space-y-4">
                <div>
                  <Label>출금 금액</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      ₩
                    </span>
                    <Input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0"
                      className="pl-8"
                      max={availableAmount}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    최대 출금 가능: ₩{availableAmount.toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label>은행</Label>
                  <select
                    value={bankAccount.bank}
                    onChange={(e) =>
                      setBankAccount({ ...bankAccount, bank: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">은행 선택</option>
                    <option value="KB국민은행">KB국민은행</option>
                    <option value="신한은행">신한은행</option>
                    <option value="우리은행">우리은행</option>
                    <option value="하나은행">하나은행</option>
                    <option value="기업은행">기업은행</option>
                    <option value="농협은행">농협은행</option>
                    <option value="카카오뱅크">카카오뱅크</option>
                    <option value="토스뱅크">토스뱅크</option>
                  </select>
                </div>

                <div>
                  <Label>계좌번호</Label>
                  <Input
                    type="text"
                    value={bankAccount.accountNumber}
                    onChange={(e) =>
                      setBankAccount({
                        ...bankAccount,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="계좌번호 입력"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>예금주</Label>
                  <Input
                    type="text"
                    value={bankAccount.accountHolder}
                    onChange={(e) =>
                      setBankAccount({
                        ...bankAccount,
                        accountHolder: e.target.value,
                      })
                    }
                    placeholder="예금주명 입력"
                    className="mt-1"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">출금 안내</p>
                      <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li>영업일 기준 2-3일 내에 입금됩니다</li>
                        <li>최소 출금 금액은 10,000원입니다</li>
                        <li>출금 수수료는 없습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowWithdrawModal(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleWithdrawRequest}
                  disabled={!withdrawAmount || parseInt(withdrawAmount) <= 0}
                >
                  출금 신청
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
