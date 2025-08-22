"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TestLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("business@company.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 쿠키를 포함하도록 설정
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("로그인 성공! 쿠키가 설정되었습니다.");

        // localStorage에도 저장 (호환성을 위해)
        if (data.token) {
          localStorage.setItem("auth-token", data.token);
          localStorage.setItem("accessToken", data.token);
        }

        // 사용자 정보 저장
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push("/business/dashboard?tab=applicants");
        }, 2000);
      } else {
        setMessage(`로그인 실패: ${data.error}`);
      }
    } catch (error) {
      setMessage(`오류 발생: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/business/applicants", {
        method: "GET",
        credentials: "include", // 쿠키를 포함하도록 설정
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          `인증 성공! 지원자 ${data.applicants?.length || 0}명을 찾았습니다.`,
        );
      } else {
        setMessage(`인증 실패: ${data.error}`);
      }
    } catch (error) {
      setMessage(`오류 발생: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">테스트 로그인</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 mb-4"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <button
          onClick={checkAuth}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          인증 확인 (지원자 API 테스트)
        </button>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.includes("성공")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p>테스트 계정:</p>
          <ul className="mt-2">
            <li>• business@company.com / password123</li>
            <li>• test.business@example.com / password123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
