"use client";

import React, { useState } from "react";
import ImageUploadWithWebP from "./ImageUploadWithWebP";
import { AlertCircle, CheckCircle2, Image, FileImage } from "lucide-react";

interface CampaignImageUploaderProps {
  campaignId?: string;
  onUploadComplete?: (urls: string[]) => void;
  existingImages?: string[];
}

/**
 * 캠페인용 이미지 업로더
 * - 썸네일: 단일 이미지, 최대 1200x800
 * - 상세 이미지: 다중 이미지, 긴 이미지 자동 분할
 */
export default function CampaignImageUploader({
  campaignId,
  onUploadComplete,
  existingImages = [],
}: CampaignImageUploaderProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [detailUrls, setDetailUrls] = useState<string[]>(existingImages);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  /**
   * 서버에 이미지 업로드
   */
  const uploadToServer = async (
    files: File[],
    type: "thumbnail" | "detail",
  ) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("type", type);
    if (campaignId) {
      formData.append("campaignId", campaignId);
    }

    try {
      const response = await fetch("/api/upload/campaign-images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return data.urls as string[];
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  /**
   * 썸네일 업로드 핸들러
   */
  const handleThumbnailUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadStatus("idle");

    try {
      const urls = await uploadToServer(files, "thumbnail");
      setThumbnailUrl(urls[0]);
      setUploadStatus("success");

      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (error) {
      setUploadStatus("error");
      console.error("Thumbnail upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 상세 이미지 업로드 핸들러
   */
  const handleDetailUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadStatus("idle");

    try {
      const urls = await uploadToServer(files, "detail");
      setDetailUrls((prev) => [...prev, ...urls]);
      setUploadStatus("success");

      if (onUploadComplete) {
        onUploadComplete([...detailUrls, ...urls]);
      }

      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (error) {
      setUploadStatus("error");
      console.error("Detail upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 상태 메시지 */}
      {uploadStatus === "success" && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">이미지가 성공적으로 업로드되었습니다!</span>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">
            업로드 중 오류가 발생했습니다. 다시 시도해주세요.
          </span>
        </div>
      )}

      {/* 썸네일 업로드 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">캠페인 썸네일</h3>
          <span className="text-sm text-gray-500">(필수)</span>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <ImageUploadWithWebP
            onUpload={handleThumbnailUpload}
            maxWidth={1200}
            maxHeight={800}
            maxSizeMB={1}
            splitHeight={4000} // 썸네일은 분할 불필요
            multiple={false}
            accept="image/*"
            className="mb-4"
          />

          {thumbnailUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">현재 썸네일:</p>
              <img
                src={thumbnailUrl}
                alt="Campaign thumbnail"
                className="w-48 h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* 상세 이미지 업로드 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileImage className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">캠페인 상세 이미지</h3>
          <span className="text-sm text-gray-500">(선택)</span>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>자동 이미지 처리 기능</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 ml-5">
              <li>
                • 모든 이미지를 WebP 형식으로 자동 변환 (용량 50-70% 감소)
              </li>
              <li>• 4000px 이상 긴 이미지는 자동으로 분할 처리</li>
              <li>• 한국 이커머스 스타일 상세페이지 최적화</li>
              <li>• 이미지 품질 유지하면서 로딩 속도 개선</li>
            </ul>
          </div>

          <ImageUploadWithWebP
            onUpload={handleDetailUpload}
            maxWidth={1200}
            maxHeight={99999} // 상세 이미지는 길이 제한 없음
            maxSizeMB={2}
            splitHeight={4000} // 4000px마다 분할
            multiple={true}
            accept="image/*"
          />

          {detailUrls.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">
                업로드된 상세 이미지 ({detailUrls.length}개)
              </p>
              <div className="grid grid-cols-4 gap-3">
                {detailUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Detail ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute bottom-1 left-1 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                      {url.includes("_part")
                        ? `분할 ${index + 1}`
                        : `이미지 ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 사용 가이드 */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-2">
          📌 이미지 업로드 가이드
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>
            • <strong>썸네일:</strong> 1200x800px 권장, 목록에 표시되는 대표
            이미지
          </li>
          <li>
            • <strong>상세 이미지:</strong> 폭 1200px 권장, 높이 제한 없음
          </li>
          <li>
            • <strong>긴 이미지:</strong> 4000px 이상 이미지는 자동으로 여러
            개로 분할
          </li>
          <li>
            • <strong>파일 형식:</strong> JPG, PNG → WebP로 자동 변환
          </li>
          <li>
            • <strong>용량 절감:</strong> 평균 50-70% 용량 감소, 빠른 로딩
          </li>
        </ul>
      </div>
    </div>
  );
}
