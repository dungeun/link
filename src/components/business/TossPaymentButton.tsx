"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TossPaymentButtonProps {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export default function TossPaymentButton({
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  onSuccess,
  onError,
}: TossPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile">("card");
  const { toast } = useToast();

  useEffect(() => {
    // TossPayments SDK 로드
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      // TossPayments 객체 확인
      const tossPayments = (window as any).TossPayments;
      if (!tossPayments) {
        throw new Error("TossPayments SDK가 로드되지 않았습니다.");
      }

      // 클라이언트 키 (환경변수에서 가져오기)
      const clientKey =
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ||
        "test_ck_DnyRpQWGrNzO1Ek5W9eVKwv1M9EN";

      // TossPayments 인스턴스 생성
      const tossPaymentsInstance = tossPayments(clientKey);

      // 결제창 호출
      await tossPaymentsInstance.requestPayment(
        paymentMethod === "card" ? "카드" : "휴대폰",
        {
          amount,
          orderId,
          orderName,
          customerName,
          customerEmail,
          successUrl: `${window.location.origin}/api/payments/callback/success`,
          failUrl: `${window.location.origin}/api/payments/callback/fail`,
        },
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "결제 실패",
        description: error.message || "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={paymentMethod === "card" ? "default" : "outline"}
          onClick={() => setPaymentMethod("card")}
          className="flex-1"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          카드 결제
        </Button>
        <Button
          type="button"
          variant={paymentMethod === "mobile" ? "default" : "outline"}
          onClick={() => setPaymentMethod("mobile")}
          className="flex-1"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          휴대폰 결제
        </Button>
      </div>

      <Button
        type="button"
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            결제 처리 중...
          </>
        ) : (
          <>₩{amount.toLocaleString()} 결제하기</>
        )}
      </Button>

      <p className="text-sm text-gray-500 text-center">
        결제 시 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
      </p>
    </div>
  );
}
