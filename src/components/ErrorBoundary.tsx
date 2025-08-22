"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 서비스로 에러 정보 전송
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // 커스텀 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // 프로덕션 환경에서는 에러 추적 서비스로 전송
    if (process.env.NODE_ENV === "production") {
      // TODO: Sentry, LogRocket 등으로 에러 전송
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // 에러 추적 서비스 통합
    try {
      // 예: Sentry.captureException(error, { contexts: { react: errorInfo } })
      fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(console.error);
    } catch (err) {
      console.error("Failed to log error:", err);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-500 mb-4">
                <AlertCircle className="h-full w-full" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                문제가 발생했습니다
              </h2>

              <p className="text-gray-600 mb-6">
                예상치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
              </p>

              {/* 개발 환경에서만 에러 상세 표시 */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-800 mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-red-700">
                      <summary className="cursor-pointer hover:underline">
                        스택 트레이스 보기
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  다시 시도
                </Button>

                <Button variant="outline" asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    홈으로 가기
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                문제가 계속되면 고객센터로 문의해주세요.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 특정 컴포넌트용 에러 바운더리 HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}

// 캠페인 전용 에러 바운더리
export function CampaignErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            캠페인을 불러올 수 없습니다
          </h3>
          <p className="text-gray-600 mb-4">잠시 후 다시 시도해주세요.</p>
          <Button onClick={() => window.location.reload()}>새로고침</Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
