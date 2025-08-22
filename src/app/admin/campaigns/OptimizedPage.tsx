"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/admin/AdminLayout";
import { OptimizedCampaignTable } from "@/components/admin/OptimizedCampaignTable";
import { adminApi } from "@/lib/admin-api";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import debounce from "lodash/debounce";

// Dynamic imports for modals and panels - lazy loaded
const CampaignDetailPanel = dynamic(
  () => import("@/components/admin/CampaignDetailPanel"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
    ssr: false,
  },
);

const CampaignCreateModal = dynamic(
  () => import("@/components/admin/CampaignCreateModal"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
    ssr: false,
  },
);

const CampaignEditModal = dynamic(
  () => import("@/components/admin/CampaignEditModal"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
    ssr: false,
  },
);

const CategoryEditPanel = dynamic(
  () => import("@/components/admin/CategoryEditPanel"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    ),
    ssr: false,
  },
);

interface Campaign {
  id: string;
  title: string;
  businessName: string;
  businessEmail: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  applicantCount: number;
  selectedCount: number;
  mainCategory: string;
  category: string | null;
  platform: string;
  targetFollowers: number;
  description: string;
  requirements: string;
  hashtags: string;
  imageUrl: string | null;
  isPaid: boolean;
  platformFeeRate: number;
  createdAt: string;
}

export default function OptimizedCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(
    new Set(),
  );
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mainCategory, setMainCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        setCurrentPage(1);
        fetchCampaigns(1, filter, term, mainCategory);
      }, 300),
    [filter, mainCategory],
  );

  // Fetch campaigns with caching
  const fetchCampaigns = useCallback(
    async (
      page: number = currentPage,
      status: string = filter,
      search: string = searchTerm,
      category: string = mainCategory,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          ...(status !== "all" && { status }),
          ...(search && { search }),
          ...(category !== "all" && { mainCategory: category }),
        });

        const response = await adminApi.get(`/api/admin/campaigns?${params}`);
        const data = await response.json();

        if (data.campaigns) {
          setCampaigns(data.campaigns);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        toast({
          title: "오류",
          description: "캠페인 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, filter, searchTerm, mainCategory],
  );

  // Initial load
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilter: string) => {
      setFilter(newFilter);
      setCurrentPage(1);
      fetchCampaigns(1, newFilter, searchTerm, mainCategory);
    },
    [searchTerm, mainCategory, fetchCampaigns],
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      setMainCategory(newCategory);
      setCurrentPage(1);
      fetchCampaigns(1, filter, searchTerm, newCategory);
    },
    [filter, searchTerm, fetchCampaigns],
  );

  // Handle sorting
  const handleSort = useCallback(
    (field: string) => {
      const newDirection =
        sortField === field && sortDirection === "asc" ? "desc" : "asc";
      setSortField(field);
      setSortDirection(newDirection);

      const sorted = [...campaigns].sort((a, b) => {
        const aVal = a[field as keyof Campaign];
        const bVal = b[field as keyof Campaign];

        if (typeof aVal === "string" && typeof bVal === "string") {
          return newDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return newDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });

      setCampaigns(sorted);
    },
    [campaigns, sortField, sortDirection],
  );

  // Handle selection
  const handleSelectCampaign = useCallback((id: string) => {
    setSelectedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedCampaigns.size === campaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(campaigns.map((c) => c.id)));
    }
  }, [campaigns, selectedCampaigns.size]);

  // Handle campaign actions
  const handleViewCampaign = useCallback(
    (id: string) => {
      const campaign = campaigns.find((c) => c.id === id);
      if (campaign) {
        setSelectedCampaign(campaign);
        setShowDetailPanel(true);
      }
    },
    [campaigns],
  );

  const handleEditCampaign = useCallback(
    (id: string) => {
      const campaign = campaigns.find((c) => c.id === id);
      if (campaign) {
        setSelectedCampaign(campaign);
        setShowEditModal(true);
      }
    },
    [campaigns],
  );

  const handleStatusChange = useCallback(
    async (id: string, newStatus: string) => {
      try {
        await adminApi.put(`/api/admin/campaigns/${id}`, { status: newStatus });
        toast({
          title: "성공",
          description: "캠페인 상태가 변경되었습니다.",
        });
        fetchCampaigns();
      } catch (error) {
        toast({
          title: "오류",
          description: "상태 변경에 실패했습니다.",
          variant: "destructive",
        });
      }
    },
    [fetchCampaigns],
  );

  // Batch operations
  const handleBatchDelete = useCallback(async () => {
    if (selectedCampaigns.size === 0) {
      toast({
        title: "알림",
        description: "선택된 캠페인이 없습니다.",
      });
      return;
    }

    if (!confirm(`${selectedCampaigns.size}개의 캠페인을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedCampaigns).map((id) =>
          adminApi.delete(`/api/admin/campaigns/${id}`),
        ),
      );

      toast({
        title: "성공",
        description: `${selectedCampaigns.size}개의 캠페인이 삭제되었습니다.`,
      });

      setSelectedCampaigns(new Set());
      fetchCampaigns();
    } catch (error) {
      toast({
        title: "오류",
        description: "캠페인 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [selectedCampaigns, fetchCampaigns]);

  const handleExport = useCallback(() => {
    const data = campaigns.map((c) => ({
      ID: c.id,
      캠페인명: c.title,
      비즈니스: c.businessName,
      상태: c.status,
      예산: c.budget,
      시작일: c.startDate,
      종료일: c.endDate,
      지원자수: c.applicantCount,
      선정자수: c.selectedCount,
      카테고리: c.mainCategory,
      생성일: c.createdAt,
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `campaigns_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }, [campaigns]);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">캠페인 관리</h1>
          <p className="text-gray-600 mt-1">전체 {totalCount}개의 캠페인</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="캠페인명, 비즈니스명으로 검색..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">전체 상태</option>
              <option value="PENDING">대기중</option>
              <option value="ACTIVE">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>

            {/* Category Filter */}
            <select
              value={mainCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">전체 카테고리</option>
              <option value="캠페인">캠페인</option>
              <option value="체험단">체험단</option>
              <option value="기자단">기자단</option>
              <option value="프리미엄 리뷰">프리미엄 리뷰</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              <Button
                onClick={() => setShowCategoryPanel(true)}
                variant="outline"
                size="sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                카테고리 관리
              </Button>

              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>

              <Button
                onClick={() => setShowCreateModal(true)}
                variant="default"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />새 캠페인
              </Button>
            </div>
          </div>

          {/* Batch Actions */}
          {selectedCampaigns.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedCampaigns.size}개 선택됨
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleBatchDelete}
                  variant="destructive"
                  size="sm"
                >
                  선택 삭제
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              캠페인이 없습니다.
            </div>
          ) : (
            <OptimizedCampaignTable
              campaigns={campaigns}
              selectedCampaigns={selectedCampaigns}
              onSelectCampaign={handleSelectCampaign}
              onSelectAll={handleSelectAll}
              onViewCampaign={handleViewCampaign}
              onEditCampaign={handleEditCampaign}
              onStatusChange={handleStatusChange}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              onClick={() => {
                setCurrentPage((prev) => Math.max(1, prev - 1));
                fetchCampaigns(Math.max(1, currentPage - 1));
              }}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              이전
            </Button>

            <span className="px-4 py-2 text-sm">
              {currentPage} / {totalPages}
            </span>

            <Button
              onClick={() => {
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                fetchCampaigns(Math.min(totalPages, currentPage + 1));
              }}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              다음
            </Button>
          </div>
        )}

        {/* Dynamic Modals */}
        <Suspense fallback={null}>
          {showCreateModal && (
            <CampaignCreateModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                fetchCampaigns();
              }}
            />
          )}

          {showEditModal && selectedCampaign && (
            <CampaignEditModal
              isOpen={showEditModal}
              campaignId={selectedCampaign?.id || null}
              onClose={() => {
                setShowEditModal(false);
                setSelectedCampaign(null);
              }}
              onSave={() => {
                setShowEditModal(false);
                setSelectedCampaign(null);
                fetchCampaigns();
              }}
            />
          )}

          {showDetailPanel && selectedCampaign && (
            <CampaignDetailPanel
              campaignId={selectedCampaign?.id || null}
              isOpen={showDetailPanel}
              onClose={() => {
                setShowDetailPanel(false);
                setSelectedCampaign(null);
              }}
              onStatusChange={fetchCampaigns}
            />
          )}

          {showCategoryPanel && (
            <CategoryEditPanel
              campaignId={selectedCampaign?.id || null}
              isOpen={showCategoryPanel}
              onClose={() => setShowCategoryPanel(false)}
              onSave={() => fetchCampaigns()}
            />
          )}
        </Suspense>
      </div>
    </AdminLayout>
  );
}
