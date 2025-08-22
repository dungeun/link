"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiUpload, apiPost, apiGet } from "@/lib/api/client";

interface SubmitContentPageProps {
  params: {
    id: string;
  };
}

export default function SubmitContentPage({ params }: SubmitContentPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contentUrl, setContentUrl] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 application ID 가져오기
  useEffect(() => {
    const fetchApplicationId = async () => {
      try {
        const response = await apiGet("/api/influencer/applications");
        if (response.ok) {
          const data = await response.json();
          const application = data.applications.find(
            (app: { campaignId: string; status: string; id: string }) =>
              app.campaignId === params.id && app.status === "APPROVED",
          );
          if (application) {
            setApplicationId(application.id);
          } else {
            toast({
              title: "오류",
              description: "승인된 캠페인 지원을 찾을 수 없습니다.",
              variant: "destructive",
            });
            router.push("/mypage?tab=campaigns");
          }
        }
      } catch (error) {
        console.error("Application ID 조회 오류:", error);
      }
    };
    fetchApplicationId();
  }, [params.id, router, toast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "content");

        const response = await apiUpload("/api/upload", formData);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Upload error:", errorData);
          throw new Error(errorData.error || "이미지 업로드에 실패했습니다.");
        }

        const data = await response.json();
        setUploadedImages((prev) => [...prev, data.url]);
      }

      toast({
        title: "성공",
        description: "이미지가 업로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "이미지 업로드에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contentUrl) {
      toast({
        title: "오류",
        description: "콘텐츠 링크를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (!applicationId) {
        toast({
          title: "오류",
          description: "지원 정보를 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // 1. 콘텐츠 제출
      const response = await apiPost(
        `/api/campaigns/applications/${applicationId}/content`,
        {
          contentUrl,
          description,
          platform,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "콘텐츠 제출에 실패했습니다.");
      }

      const content = await response.json();

      // 2. 이미지가 있으면 미디어 추가
      if (uploadedImages.length > 0) {
        for (let i = 0; i < uploadedImages.length; i++) {
          await apiPost(`/api/content/${content.id}/media`, {
            url: uploadedImages[i],
            type: "image",
            order: i,
          });
        }
      }

      toast({
        title: "성공",
        description:
          "콘텐츠가 제출되었습니다. 검토 후 승인 여부를 알려드리겠습니다.",
      });

      router.push("/mypage?tab=campaigns");
    } catch (error) {
      toast({
        title: "오류",
        description:
          error instanceof Error
            ? error.message
            : "콘텐츠 제출에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 max-w-2xl py-8 pt-24">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href="/mypage?tab=campaigns"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />내 캠페인으로
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 제출</h1>
          <p className="text-gray-600 mt-1">캠페인 수행 결과를 제출해주세요</p>
        </div>

        {/* 폼 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          {/* 플랫폼 선택 */}
          <div>
            <Label>플랫폼</Label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="blog">Blog</option>
            </select>
          </div>

          {/* 콘텐츠 링크 */}
          <div>
            <Label htmlFor="contentUrl">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              콘텐츠 링크
            </Label>
            <Input
              id="contentUrl"
              type="url"
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              required
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              게시한 콘텐츠의 링크를 입력해주세요
            </p>
          </div>

          {/* 설명 */}
          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="콘텐츠에 대한 설명을 입력해주세요"
              rows={4}
              className="mt-1"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <Label>
              <ImageIcon className="w-4 h-4 inline mr-1" />
              스크린샷 / 증빙 이미지
            </Label>

            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "업로드 중..." : "이미지 업로드"}
              </Button>
            </div>

            {/* 업로드된 이미지 미리보기 */}
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`증빙 이미지 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
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
                ))}
              </div>
            )}
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>제출 전 확인사항:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>캠페인 요구사항을 모두 충족했는지 확인해주세요</li>
              <li>해시태그와 멘션이 올바르게 포함되었는지 확인해주세요</li>
              <li>콘텐츠가 공개 상태인지 확인해주세요</li>
              <li>승인 후 정산 가능 금액이 자동으로 계산됩니다</li>
            </ul>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading || !contentUrl}>
              {loading ? "제출 중..." : "콘텐츠 제출"}
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
