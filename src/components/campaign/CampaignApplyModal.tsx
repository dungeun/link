"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUserData } from "@/contexts/UserDataContext";
import { invalidateCache } from "@/hooks/useCachedData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignQuestion {
  id: string;
  question: string;
  type: string;
  required: boolean;
  options?: any;
  order?: number;
}

interface Campaign {
  id: string;
  title: string;
  budget: number | { amount: number; type: string; currency: string };
  campaignQuestions?: CampaignQuestion[];
}

interface ApplyForm {
  message: string;
  name: string;
  birthYear: string;
  gender: string;
  phone: string;
  address: string;
}

interface CampaignApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onSuccess: () => void;
}

export default function CampaignApplyModal({
  isOpen,
  onClose,
  campaign,
  onSuccess,
}: CampaignApplyModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { profileData, refreshProfile } = useUserData();

  const [applying, setApplying] = useState(false);
  const [applyForm, setApplyForm] = useState<ApplyForm>({
    message: "",
    name: "",
    birthYear: "",
    gender: "",
    phone: "",
    address: "",
  });
  const [campaignAnswers, setCampaignAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [useProfileInfo, setUseProfileInfo] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);

  // 모달이 열릴 때 자동으로 프로필 정보 로드
  useEffect(() => {
    if (isOpen && profileData && useProfileInfo) {
      // birthDate가 있으면 년도 추출, 없으면 birthYear 사용
      let birthYear = "";
      if (profileData.profile?.birthDate) {
        const birthDate = new Date(profileData.profile.birthDate);
        if (!isNaN(birthDate.getTime())) {
          birthYear = birthDate.getFullYear().toString();
        }
      } else if (profileData.profile?.birthYear) {
        birthYear = String(profileData.profile.birthYear);
      }

      setApplyForm((prev) => ({
        ...prev,
        name: profileData.profile?.realName || profileData.name || "",
        birthYear: birthYear,
        gender: profileData.profile?.gender || "",
        phone: profileData.profile?.phone || "",
        address: profileData.profile?.address || "",
      }));
    }
  }, [isOpen, profileData, useProfileInfo]);

  // 템플릿 로딩
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/application-templates", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        // API 응답 구조에 따라 templates 배열 추출
        const templatesArray = data.templates || data || [];
        setTemplates(Array.isArray(templatesArray) ? templatesArray : []);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !applyForm.message.trim()) return;

    try {
      const response = await fetch("/api/application-templates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName,
          content: applyForm.message,
          isPublic: false,
          category: "general",
        }),
      });

      if (response.ok) {
        toast({
          title: "템플릿 저장 완료",
          description: "템플릿이 성공적으로 저장되었습니다.",
        });
        setShowSaveTemplate(false);
        setTemplateName("");
        loadTemplates();
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "오류",
        description: "템플릿 저장 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t: any) => t.id === templateId);
    if (template) {
      setApplyForm((prev) => ({ ...prev, message: template.content }));
      setSelectedTemplate(templateId);
    }
  };

  const handleUseProfileInfo = (checked: boolean) => {
    setUseProfileInfo(checked);
    if (checked && profileData) {
      // birthDate가 있으면 년도 추출, 없으면 birthYear 사용
      let birthYear = "";
      if (profileData.profile?.birthDate) {
        const birthDate = new Date(profileData.profile.birthDate);
        if (!isNaN(birthDate.getTime())) {
          birthYear = birthDate.getFullYear().toString();
        }
      } else if (profileData.profile?.birthYear) {
        birthYear = String(profileData.profile.birthYear);
      }

      setApplyForm((prev) => ({
        ...prev,
        name: profileData.name || profileData.profile?.realName || "",
        birthYear: birthYear,
        gender: profileData.profile?.gender || "",
        phone: profileData.profile?.phone || "",
        address: profileData.profile?.address || "",
      }));
    } else if (!checked) {
      setApplyForm((prev) => ({
        ...prev,
        name: "",
        birthYear: "",
        gender: "",
        phone: "",
        address: "",
      }));
    }
  };

  const handleApply = async () => {
    if (!campaign) return;

    // 모달이 열린 후에는 프로필 검증을 완전히 비활성화
    console.log(
      "Profile validation bypassed in handleApply - proceeding with application",
    );

    if (!applyForm.message.trim()) {
      toast({
        title: "오류",
        description: "지원 메시지를 작성해주세요.",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: applyForm.message,
          name: applyForm.name,
          birthYear: applyForm.birthYear
            ? parseInt(applyForm.birthYear)
            : undefined,
          gender: applyForm.gender,
          phone: applyForm.phone,
          address: applyForm.address,
          campaignAnswers: campaignAnswers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply");
      }

      const data = await response.json();

      // 캐시 무효화하여 지원 목록 갱신
      invalidateCache(`influencer_applications_${profileData?.id}`);

      toast({
        title: "지원 완료",
        description: "캠페인 지원이 완료되었습니다.",
      });

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error applying to campaign:", error);
      toast({
        title: "오류",
        description:
          error instanceof Error
            ? error.message
            : "지원 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setApplyForm({
      message: "",
      name: profileData?.name || "",
      birthYear: String(profileData?.profile?.birthYear || ""),
      gender: profileData?.profile?.gender || "",
      phone: profileData?.profile?.phone || "",
      address: profileData?.profile?.address || "",
    });
    setCampaignAnswers({});
    setSelectedTemplate("");
    setUseProfileInfo(true);
    onClose();
  };

  if (!campaign) return null;

  return (
    <>
      {/* 지원 모달 */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>캠페인 지원하기</DialogTitle>
            <DialogDescription>
              지원자 정보와 지원 메시지를 작성해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">기본 정보</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useProfile"
                    checked={useProfileInfo}
                    onCheckedChange={handleUseProfileInfo}
                  />
                  <Label
                    htmlFor="useProfile"
                    className="text-sm font-normal cursor-pointer"
                  >
                    프로필 정보 사용
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름*</Label>
                  <Input
                    id="name"
                    placeholder="이름을 입력하세요"
                    value={applyForm.name}
                    onChange={(e) =>
                      setApplyForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthYear">생년월일*</Label>
                  <Select
                    value={applyForm.birthYear}
                    onValueChange={(value) =>
                      setApplyForm((prev) => ({ ...prev, birthYear: value }))
                    }
                  >
                    <SelectTrigger id="birthYear">
                      <SelectValue placeholder="선택해 주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: 50 },
                        (_, i) => new Date().getFullYear() - 18 - i,
                      ).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}년
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">성별*</Label>
                  <Select
                    value={applyForm.gender}
                    onValueChange={(value) =>
                      setApplyForm((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="선택해 주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">남자</SelectItem>
                      <SelectItem value="female">여자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">연락처*</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={applyForm.phone}
                    onChange={(e) =>
                      setApplyForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">주소</Label>
                  <Input
                    id="address"
                    placeholder="주소를 입력하세요"
                    value={applyForm.address}
                    onChange={(e) =>
                      setApplyForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4" />

            {/* 템플릿 선택 */}
            <div className="space-y-2">
              <Label>템플릿 선택</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
              >
                <option value="">직접 작성</option>
                <optgroup label="기본 템플릿">
                  {Array.isArray(templates) &&
                    templates
                      .filter(
                        (t: any) =>
                          t.isPublic &&
                          (!t.user || t.user.name === "LinkPick System"),
                      )
                      .map((template: any) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                </optgroup>
                {Array.isArray(templates) &&
                  templates.filter(
                    (t: any) =>
                      !t.isPublic ||
                      (t.user && t.user.name !== "LinkPick System"),
                  ).length > 0 && (
                    <optgroup label="내 템플릿">
                      {templates
                        .filter(
                          (t: any) =>
                            !t.isPublic ||
                            (t.user && t.user.name !== "LinkPick System"),
                        )
                        .map((template: any) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
              </select>
            </div>

            {/* 지원 메시지 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message">지원 메시지*</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={!applyForm.message.trim()}
                >
                  템플릿으로 저장
                </Button>
              </div>
              <Textarea
                id="message"
                placeholder="왜 이 캠페인에 적합한지, 어떤 콘텐츠를 만들 계획인지 등을 자유롭게 작성해주세요."
                className="h-64"
                value={applyForm.message}
                onChange={(e) => {
                  setApplyForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }));
                  setSelectedTemplate("");
                }}
                required
              />
              <p className="text-sm text-gray-500">
                캠페인 예산: ₩
                {(() => {
                  const budget = campaign.budget;
                  if (typeof budget === "number") {
                    return budget.toLocaleString();
                  } else if (
                    budget &&
                    typeof budget === "object" &&
                    budget.amount
                  ) {
                    return budget.amount.toLocaleString();
                  }
                  return "0";
                })()}
              </p>
            </div>

            {/* 캠페인 질문사항 */}
            {campaign.campaignQuestions &&
              campaign.campaignQuestions.length > 0 && (
                <>
                  <div className="border-t pt-4" />
                  <div className="space-y-4">
                    <h3 className="font-semibold">캠페인 질문사항</h3>
                    {campaign.campaignQuestions
                      .sort(
                        (a: CampaignQuestion, b: CampaignQuestion) =>
                          (a.order || 0) - (b.order || 0),
                      )
                      .map((question: CampaignQuestion, index: number) => (
                        <div key={question.id} className="space-y-2">
                          <Label htmlFor={`question-${question.id}`}>
                            {question.question}
                            {question.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>

                          {question.type === "TEXT" && (
                            <Input
                              id={`question-${question.id}`}
                              placeholder="답변을 입력하세요"
                              value={campaignAnswers[question.id] || ""}
                              onChange={(e) =>
                                setCampaignAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              required={question.required}
                            />
                          )}

                          {question.type === "TEXTAREA" && (
                            <Textarea
                              id={`question-${question.id}`}
                              placeholder="답변을 입력하세요"
                              className="h-24"
                              value={campaignAnswers[question.id] || ""}
                              onChange={(e) =>
                                setCampaignAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              required={question.required}
                            />
                          )}

                          {question.type === "SELECT" && question.options && (
                            <Select
                              value={campaignAnswers[question.id] || ""}
                              onValueChange={(value) =>
                                setCampaignAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: value,
                                }))
                              }
                            >
                              <SelectTrigger id={`question-${question.id}`}>
                                <SelectValue placeholder="선택해 주세요" />
                              </SelectTrigger>
                              <SelectContent>
                                {(Array.isArray(question.options)
                                  ? question.options
                                  : typeof question.options === "string"
                                    ? JSON.parse(question.options)
                                    : []
                                ).map((option: string, optIndex: number) => (
                                  <SelectItem key={optIndex} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {question.type === "CHECKBOX" && question.options && (
                            <div className="space-y-2">
                              {(Array.isArray(question.options)
                                ? question.options
                                : typeof question.options === "string"
                                  ? JSON.parse(question.options)
                                  : []
                              ).map((option: string, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`question-${question.id}-${optIndex}`}
                                    checked={(
                                      campaignAnswers[question.id] || ""
                                    )
                                      .split(",")
                                      .includes(option)}
                                    onCheckedChange={(checked) => {
                                      const currentAnswers = (
                                        campaignAnswers[question.id] || ""
                                      )
                                        .split(",")
                                        .filter((a) => a);
                                      let newAnswers;
                                      if (checked) {
                                        newAnswers = [
                                          ...currentAnswers,
                                          option,
                                        ];
                                      } else {
                                        newAnswers = currentAnswers.filter(
                                          (a) => a !== option,
                                        );
                                      }
                                      setCampaignAnswers((prev) => ({
                                        ...prev,
                                        [question.id]: newAnswers.join(","),
                                      }));
                                    }}
                                  />
                                  <Label
                                    htmlFor={`question-${question.id}-${optIndex}`}
                                    className="text-sm font-normal"
                                  >
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === "RADIO" && question.options && (
                            <div className="space-y-2">
                              {(Array.isArray(question.options)
                                ? question.options
                                : typeof question.options === "string"
                                  ? JSON.parse(question.options)
                                  : []
                              ).map((option: string, optIndex: number) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <input
                                    type="radio"
                                    id={`question-${question.id}-${optIndex}`}
                                    name={`question-${question.id}`}
                                    value={option}
                                    checked={
                                      campaignAnswers[question.id] === option
                                    }
                                    onChange={(e) =>
                                      setCampaignAnswers((prev) => ({
                                        ...prev,
                                        [question.id]: e.target.value,
                                      }))
                                    }
                                    className="w-4 h-4"
                                  />
                                  <Label
                                    htmlFor={`question-${question.id}-${optIndex}`}
                                    className="text-sm font-normal"
                                  >
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </>
              )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              취소
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={
                applying ||
                !applyForm.message.trim() ||
                !applyForm.name ||
                !applyForm.birthYear ||
                !applyForm.gender ||
                !applyForm.phone
              }
            >
              {applying ? "지원 중..." : "지원하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 템플릿 저장 모달 */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>템플릿 저장</DialogTitle>
            <DialogDescription>
              현재 작성한 메시지를 템플릿으로 저장합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">템플릿 이름</Label>
              <Input
                id="templateName"
                placeholder="예: 뷰티 캠페인용 템플릿"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSaveTemplate(false);
                setTemplateName("");
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
