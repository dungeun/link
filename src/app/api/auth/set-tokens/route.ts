import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * httpOnly 쿠키로 토큰 설정
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken, expiresIn } = await request.json();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Missing required tokens" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ success: true });

    // httpOnly 쿠키 설정 (XSS 공격으로부터 보호)
    const cookieStore = cookies();

    // 액세스 토큰 (짧은 만료 시간)
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: expiresIn || 3600, // 1시간
      path: "/",
    });

    // 리프레시 토큰 (긴 만료 시간)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7일
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error setting tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
