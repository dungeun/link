"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import BankingInfo from "./BankingInfo";

interface BankInfo {
  accountType: "domestic" | "international";
  domestic: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  international: {
    englishName: string;
    englishAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    accountNumber: string;
    internationalCode: string;
    bankEnglishName: string;
    swiftCode: string;
    branchCode: string;
  };
}

interface WithdrawalForm {
  amount: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Withdrawals {
  withdrawableAmount: number;
  settlements: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    processedAt?: string;
    items?: Array<{
      id: string;
      campaignTitle: string;
      amount: number;
      createdAt: string;
    }>;
  }>;
}

interface BankAccountSettingsProps {
  bankInfo: BankInfo;
  setBankInfo: (info: BankInfo) => void;
  withdrawals: Withdrawals;
  withdrawalForm: WithdrawalForm;
  setWithdrawalForm: (form: WithdrawalForm) => void;
  submittingWithdrawal: boolean;
  onWithdrawalSubmit: () => void;
  userId: string;
}

export default function BankAccountSettings({
  bankInfo,
  setBankInfo,
  withdrawals,
  withdrawalForm,
  setWithdrawalForm,
  submittingWithdrawal,
  onWithdrawalSubmit,
  userId,
}: BankAccountSettingsProps) {
  const { t } = useLanguage();
  const [showBankModal, setShowBankModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* 출금 가능 금액 */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">출금 가능 금액</p>
            <p className="text-3xl font-bold">
              ₩{withdrawals.withdrawableAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-4xl opacity-50">💰</div>
        </div>
      </div>

      {/* 계좌 정보 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900">계좌 정보</h4>
          <button
            onClick={() => setShowBankModal(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            계좌 정보 {bankInfo.domestic.bankName ? "수정" : "등록"}
          </button>
        </div>

        {bankInfo.domestic.bankName ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">은행명:</span>
              <span className="font-medium">{bankInfo.domestic.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">계좌번호:</span>
              <span className="font-medium">
                {bankInfo.domestic.accountNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예금주:</span>
              <span className="font-medium">
                {bankInfo.domestic.accountHolder}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">계좌 정보가 등록되지 않았습니다.</p>
        )}
      </div>

      {/* 출금 신청 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">출금 신청</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              출금 금액 (원)
            </label>
            <input
              type="number"
              value={withdrawalForm.amount}
              onChange={(e) =>
                setWithdrawalForm({
                  ...withdrawalForm,
                  amount: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="출금할 금액을 입력하세요"
              min="50000"
              max={withdrawals.withdrawableAmount}
            />
            <p className="text-sm text-gray-500 mt-1">
              최소 출금 금액: 50,000원
            </p>
          </div>

          <button
            onClick={onWithdrawalSubmit}
            disabled={
              submittingWithdrawal ||
              !bankInfo.domestic.bankName ||
              !withdrawalForm.amount
            }
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {submittingWithdrawal ? "신청 중..." : "출금 신청"}
          </button>
        </div>
      </div>

      {/* 정산 내역 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">정산 내역</h4>
        {withdrawals.settlements.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.settlements.map((settlement) => (
              <div
                key={settlement.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      ₩{settlement.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      신청일:{" "}
                      {new Date(settlement.createdAt).toLocaleDateString(
                        "ko-KR",
                      )}
                    </p>
                    {settlement.processedAt && (
                      <p className="text-sm text-gray-600">
                        처리일:{" "}
                        {new Date(settlement.processedAt).toLocaleDateString(
                          "ko-KR",
                        )}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      settlement.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : settlement.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {settlement.status === "COMPLETED"
                      ? "완료"
                      : settlement.status === "PENDING"
                        ? "처리중"
                        : "거절"}
                  </span>
                </div>

                {settlement.items && settlement.items.length > 0 && (
                  <div className="space-y-1">
                    {settlement.items.map((item) => (
                      <div key={item.id} className="text-sm text-gray-600 pl-4">
                        • {item.campaignTitle}: ₩{item.amount.toLocaleString()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">정산 내역이 없습니다.</p>
        )}
      </div>

      {/* 은행 정보 수정 모달 */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                출금 계좌 정보 등록
              </h3>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <BankingInfo
                userId={userId}
                initialData={bankInfo}
                onSave={async (data) => {
                  const accountData =
                    data.accountType === "domestic"
                      ? data.domestic
                      : data.international;

                  if (data.accountType === "domestic") {
                    if (
                      !(accountData as any).bankName ||
                      !(accountData as any).accountNumber ||
                      !(accountData as any).accountHolder
                    ) {
                      alert("모든 필수 정보를 입력해주세요.");
                      return;
                    }
                  } else {
                    if (
                      !(accountData as any).englishName ||
                      !(accountData as any).accountNumber ||
                      !(accountData as any).bankEnglishName ||
                      !(accountData as any).swiftCode
                    ) {
                      alert("모든 필수 정보를 입력해주세요.");
                      return;
                    }
                  }

                  try {
                    const token =
                      localStorage.getItem("accessToken") ||
                      localStorage.getItem("auth-token");
                    const response = await fetch("/api/influencer/profile", {
                      method: "PUT",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        bankingInfo: data,
                      }),
                    });

                    if (response.ok) {
                      setBankInfo(data);
                      // 출금 폼에도 반영
                      if (data.accountType === "domestic") {
                        (setWithdrawalForm as any)((prev: any) => ({
                          ...prev,
                          bankName: data.domestic.bankName,
                          accountNumber: data.domestic.accountNumber,
                          accountHolder: data.domestic.accountHolder,
                        }));
                      }
                      setShowBankModal(false);
                      alert("계좌 정보가 저장되었습니다.");
                    } else {
                      alert("계좌 정보 저장에 실패했습니다.");
                    }
                  } catch (error) {
                    console.error("계좌 정보 저장 오류:", error);
                    alert("계좌 정보 저장 중 오류가 발생했습니다.");
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
