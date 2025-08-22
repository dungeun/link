import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/admin/language-packs/[id] - 개별 언어팩 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = params;

    const languagePack = await prisma.languagePack.findUnique({
      where: { id },
    });

    if (!languagePack) {
      return NextResponse.json(
        { error: "존재하지 않는 언어팩입니다." },
        { status: 404 },
      );
    }

    return NextResponse.json(languagePack);
  } catch (error) {
    console.error("언어팩 조회 오류:", error);
    return NextResponse.json(
      { error: "언어팩을 불러오는데 실패했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/admin/language-packs/[id] - 개별 언어팩 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = params;
    const body = await request.json();
    const { ko, en, ja, description, subcategory } = body;

    // 기존 언어팩 확인
    const existing = await prisma.languagePack.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "존재하지 않는 언어팩입니다." },
        { status: 404 },
      );
    }

    // 업데이트할 데이터 준비
    const updateData: Record<string, string> = {};

    if (ko !== undefined) updateData.ko = ko;
    if (en !== undefined) updateData.en = en;
    if (ja !== undefined) updateData.jp = ja; // 데이터베이스에서는 jp 필드 사용
    if (description !== undefined) updateData.description = description;
    if (subcategory !== undefined) updateData.subcategory = subcategory;

    const languagePack = await prisma.languagePack.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(languagePack);
  } catch (error) {
    console.error("언어팩 수정 오류:", error);
    return NextResponse.json(
      { error: "언어팩 수정에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/admin/language-packs/[id] - 개별 언어팩 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = params;

    // 삭제 가능 여부 확인
    const existing = await prisma.languagePack.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "존재하지 않는 언어팩입니다." },
        { status: 404 },
      );
    }

    // isEditable이 false인 경우 삭제 불가
    if (existing.isEditable === false) {
      return NextResponse.json(
        { error: "시스템 언어팩은 삭제할 수 없습니다." },
        { status: 403 },
      );
    }

    await prisma.languagePack.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "언어팩이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("언어팩 삭제 오류:", error);
    return NextResponse.json(
      { error: "언어팩 삭제에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
