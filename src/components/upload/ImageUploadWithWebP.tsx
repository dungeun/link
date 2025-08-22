"use client";

import React, { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";

interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
  splitHeight?: number; // 이미지 분할 기준 높이 (기본 4000px)
  accept?: string;
  multiple?: boolean;
  className?: string;
}

/**
 * WebP 자동 변환 및 긴 이미지 분할 업로드 컴포넌트
 * 한국 이커머스 스타일 상세페이지 이미지 처리
 */
export default function ImageUploadWithWebP({
  onUpload,
  maxWidth = 1200,
  maxHeight = 4000,
  maxSizeMB = 1,
  splitHeight = 4000,
  accept = "image/*",
  multiple = true,
  className = "",
}: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string[]>([]);
  const [processedFiles, setProcessedFiles] = useState<File[]>([]);

  /**
   * Canvas를 사용한 이미지 분할
   */
  const splitLongImage = async (
    img: HTMLImageElement,
    originalFile: File,
  ): Promise<Blob[]> => {
    const chunks: Blob[] = [];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const imageHeight = img.height;
    const imageWidth = img.width;

    // 분할이 필요한지 확인
    if (imageHeight <= splitHeight) {
      // 분할 불필요 - WebP로만 변환
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      ctx.drawImage(img, 0, 0);

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob ? [blob] : []),
          "image/webp",
          0.85,
        );
      });
    }

    // 긴 이미지 분할
    const numChunks = Math.ceil(imageHeight / splitHeight);

    for (let i = 0; i < numChunks; i++) {
      const startY = i * splitHeight;
      const chunkHeight = Math.min(splitHeight, imageHeight - startY);

      canvas.width = imageWidth;
      canvas.height = chunkHeight;

      // 이미지의 특정 부분만 그리기
      ctx.drawImage(
        img,
        0,
        startY, // 원본에서 시작 위치
        imageWidth,
        chunkHeight, // 원본에서 크기
        0,
        0, // 캔버스 시작 위치
        imageWidth,
        chunkHeight, // 캔버스 크기
      );

      // WebP로 변환
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          "image/webp",
          0.85, // 품질 85%
        );
      });

      chunks.push(blob);

      // 진행률 업데이트
      setProgress(Math.round(((i + 1) / numChunks) * 50 + 50));
    }

    return chunks;
  };

  /**
   * 이미지 처리 (압축, WebP 변환, 분할)
   */
  const processImage = async (file: File): Promise<File[]> => {
    const processedFiles: File[] = [];

    try {
      // 1단계: 이미지 압축
      setProgress(10);
      const compressOptions = {
        maxSizeMB,
        maxWidthOrHeight: Math.max(maxWidth, maxHeight),
        useWebWorker: true,
        fileType: "image/webp",
      };

      const compressedFile = await imageCompression(file, compressOptions);
      setProgress(30);

      // 2단계: 이미지 로드 및 크기 확인
      const img = new Image();
      const imageUrl = URL.createObjectURL(compressedFile);

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      setProgress(50);

      // 3단계: 긴 이미지 분할 처리
      const chunks = await splitLongImage(img, compressedFile);

      // 4단계: File 객체로 변환
      chunks.forEach((chunk, index) => {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const chunkFileName =
          chunks.length > 1
            ? `${fileName}_part${index + 1}.webp`
            : `${fileName}.webp`;

        const webpFile = new File([chunk], chunkFileName, {
          type: "image/webp",
          lastModified: Date.now(),
        });

        processedFiles.push(webpFile);
      });

      // 메모리 정리
      URL.revokeObjectURL(imageUrl);

      return processedFiles;
    } catch (error) {
      console.error("Image processing error:", error);
      throw error;
    }
  };

  /**
   * 파일 선택 처리
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setIsProcessing(true);
      setProgress(0);

      try {
        const allProcessedFiles: File[] = [];
        const allPreviews: string[] = [];

        // 각 파일 처리
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setProgress(Math.round((i / files.length) * 100));

          // 이미지 파일만 처리
          if (!file.type.startsWith("image/")) {
            console.warn(`Skipping non-image file: ${file.name}`);
            continue;
          }

          // 이미지 처리 (압축, WebP 변환, 분할)
          const processed = await processImage(file);
          allProcessedFiles.push(...processed);

          // 프리뷰 생성
          processed.forEach((f) => {
            allPreviews.push(URL.createObjectURL(f));
          });
        }

        setProcessedFiles(allProcessedFiles);
        setPreview(allPreviews);
        setProgress(100);

        // 자동 업로드 (옵션)
        if (onUpload && allProcessedFiles.length > 0) {
          await onUpload(allProcessedFiles);
        }
      } catch (error) {
        console.error("File processing failed:", error);
        alert("이미지 처리 중 오류가 발생했습니다.");
      } finally {
        setIsProcessing(false);
      }
    },
    [onUpload],
  );

  /**
   * 드래그 앤 드롭 처리
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      const input = document.createElement("input");
      input.type = "file";
      input.files = e.dataTransfer.files;

      handleFileSelect({ target: input } as any);
    },
    [handleFileSelect],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * 프리뷰 이미지 제거
   */
  const removePreview = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
    setProcessedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 업로드 영역 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          ${isProcessing ? "border-gray-300 bg-gray-50" : "border-blue-300 bg-blue-50 hover:bg-blue-100"}
          transition-colors cursor-pointer
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600 mb-2">이미지 처리 중...</p>
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{progress}%</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-gray-500">
                자동으로 WebP로 변환되며, 4000px 이상 이미지는 자동 분할됩니다
              </p>
              <p className="text-xs text-gray-400 mt-2">
                최대 크기: {maxWidth}x{maxHeight}px | 분할 기준: {splitHeight}px
              </p>
            </>
          )}
        </div>
      </div>

      {/* 처리된 이미지 프리뷰 */}
      {preview.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              처리된 이미지 ({processedFiles.length}개)
            </h3>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="w-4 h-4" />
              WebP 변환 완료
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {preview.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg" />
                <button
                  onClick={() => removePreview(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-1 left-1 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                  {processedFiles[index]?.name.includes("_part")
                    ? `분할 ${processedFiles[index].name.match(/_part(\d+)/)?.[1]}`
                    : "WebP"}
                </div>
                <div className="absolute bottom-1 right-1 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                  {(processedFiles[index]?.size / 1024).toFixed(0)}KB
                </div>
              </div>
            ))}
          </div>

          {/* 파일 정보 */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              총 {processedFiles.length}개 파일 | 총 크기:{" "}
              {(
                processedFiles.reduce((acc, f) => acc + f.size, 0) /
                1024 /
                1024
              ).toFixed(2)}
              MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
