"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 실제로는 서버에 요청을 보내야 합니다
    // 현재는 시뮬레이션만 합니다
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            {!isSubmitted ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  비밀번호 재설정
                </h1>
                <p className="text-gray-600 mb-6 text-center">
                  가입하신 이메일 주소를 입력해주세요. 비밀번호 재설정 링크를
                  보내드립니다.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      이메일 주소
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="example@email.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? "전송 중..." : "재설정 링크 보내기"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-cyan-600 hover:text-cyan-700 text-sm"
                  >
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  이메일을 확인해주세요
                </h2>
                <p className="text-gray-600 mb-6">
                  <span className="font-medium">{email}</span>로<br />
                  비밀번호 재설정 링크를 보내드렸습니다.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    다른 이메일로 재시도
                  </button>
                  <Link
                    href="/login"
                    className="block w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 text-center transition-colors"
                  >
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
