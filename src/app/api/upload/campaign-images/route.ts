import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";

/**
 * 캠페인 이미지 업로드 API
 * WebP 형식으로 변환된 이미지를 저장
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const type = formData.get("type") as string;
    const campaignId = formData.get("campaignId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    // 업로드 디렉토리 생성
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "images",
      "campaigns",
      type,
    );
    await mkdir(uploadDir, { recursive: true });

    // 각 파일 저장
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 파일명 생성 (타임스탬프 + 원본 이름)
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = path.join(uploadDir, fileName);

      // 파일 저장
      await writeFile(filePath, buffer);

      // 공개 URL 생성
      const publicUrl = `/images/campaigns/${type}/${fileName}`;
      uploadedUrls.push(publicUrl);

      // 데이터베이스에 이미지 정보 저장 (campaignId가 있는 경우)
      if (campaignId) {
        await prisma.campaignImage.create({
          data: {
            campaignId,
            imageUrl: publicUrl,
            type: type as "THUMBNAIL" | "DETAIL",
            order: uploadedUrls.length - 1,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
