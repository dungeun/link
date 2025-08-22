"use client";

import { useReducer, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { debounce } from "lodash";

// Lazy load heavy components
const CampaignDetailPanel = dynamic(
  () => import("@/components/admin/CampaignDetailPanel"),
  {
    loading: () => <div className="animate-pulse">Loading...</div>,
    ssr: false,
  },
);

const CampaignCreateModal = dynamic(
  () => import("@/components/admin/CampaignCreateModal"),
  {
    loading: () => <div className="animate-pulse">Loading...</div>,
    ssr: false,
  },
);

const CategoryEditPanel = dynamic(
  () => import("@/components/admin/CategoryEditPanel"),
  {
    loading: () => <div className="animate-pulse">Loading...</div>,
    ssr: false,
  },
);

const CampaignEditModal = dynamic(
  () => import("@/components/admin/CampaignEditModal"),
  {
    loading: () => <div className="animate-pulse">Loading...</div>,
    ssr: false,
  },
);

interface Campaign {
  id: string;
  title: string;
  description: string;
  businessName: string;
  businessEmail: string;
  platform: string;
  budget: number;
  targetFollowers: number;
  startDate: string;
  endDate: string;
  status: string;
  applicantCount: number;
  selectedCount: number;
  createdAt: string;
  imageUrl?: string;
  isPaid: boolean;
  platformFeeRate?: number;
  mainCategory?: string;
  category?: string;
}

// Consolidated state type
interface PageState {
  campaigns: Campaign[];
  loading: boolean;
  filter: string;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  selectedCampaignId: string | null;
  isPanelOpen: boolean;
  isCreateModalOpen: boolean;
  activeTab: string;
  selectedCampaigns: string[];
  selectedMainCategory: string;
  statusMenuOpen: string | null;
  editCategoryId: string | null;
  isCategoryEditOpen: boolean;
  editCampaignId: string | null;
  isEditModalOpen: boolean;
}

// Action types
type PageAction =
  | {
      type: "SET_CAMPAIGNS";
      payload: {
        campaigns: Campaign[];
        totalPages: number;
        totalCount: number;
      };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_FILTER"; payload: string }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_MAIN_CATEGORY"; payload: string }
  | { type: "TOGGLE_CAMPAIGN_SELECTION"; payload: string }
  | { type: "CLEAR_SELECTIONS" }
  | { type: "OPEN_CAMPAIGN_DETAIL"; payload: string }
  | { type: "CLOSE_CAMPAIGN_DETAIL" }
  | { type: "TOGGLE_CREATE_MODAL" }
  | { type: "OPEN_CATEGORY_EDIT"; payload: string }
  | { type: "CLOSE_CATEGORY_EDIT" }
  | { type: "OPEN_CAMPAIGN_EDIT"; payload: string }
  | { type: "CLOSE_CAMPAIGN_EDIT" }
  | { type: "SET_STATUS_MENU"; payload: string | null }
  | { type: "UPDATE_CAMPAIGN_STATUS"; payload: { id: string; status: string } }
  | { type: "REMOVE_CAMPAIGN"; payload: string };

// Reducer function
function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "SET_CAMPAIGNS":
      return {
        ...state,
        campaigns: action.payload.campaigns,
        totalPages: action.payload.totalPages,
        totalCount: action.payload.totalCount,
        loading: false,
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_FILTER":
      return { ...state, filter: action.payload, currentPage: 1 };

    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload, currentPage: 1 };

    case "SET_PAGE":
      return { ...state, currentPage: action.payload };

    case "SET_ACTIVE_TAB":
      return {
        ...state,
        activeTab: action.payload,
        currentPage: 1,
        selectedCampaigns: [],
        filter:
          action.payload !== "all" && action.payload !== "trash"
            ? action.payload
            : "all",
      };

    case "SET_MAIN_CATEGORY":
      return { ...state, selectedMainCategory: action.payload, currentPage: 1 };

    case "TOGGLE_CAMPAIGN_SELECTION":
      return {
        ...state,
        selectedCampaigns: state.selectedCampaigns.includes(action.payload)
          ? state.selectedCampaigns.filter((id) => id !== action.payload)
          : [...state.selectedCampaigns, action.payload],
      };

    case "CLEAR_SELECTIONS":
      return { ...state, selectedCampaigns: [] };

    case "OPEN_CAMPAIGN_DETAIL":
      return {
        ...state,
        selectedCampaignId: action.payload,
        isPanelOpen: true,
      };

    case "CLOSE_CAMPAIGN_DETAIL":
      return { ...state, isPanelOpen: false, selectedCampaignId: null };

    case "TOGGLE_CREATE_MODAL":
      return { ...state, isCreateModalOpen: !state.isCreateModalOpen };

    case "OPEN_CATEGORY_EDIT":
      return {
        ...state,
        editCategoryId: action.payload,
        isCategoryEditOpen: true,
      };

    case "CLOSE_CATEGORY_EDIT":
      return { ...state, isCategoryEditOpen: false, editCategoryId: null };

    case "OPEN_CAMPAIGN_EDIT":
      return {
        ...state,
        editCampaignId: action.payload,
        isEditModalOpen: true,
      };

    case "CLOSE_CAMPAIGN_EDIT":
      return { ...state, isEditModalOpen: false, editCampaignId: null };

    case "SET_STATUS_MENU":
      return { ...state, statusMenuOpen: action.payload };

    case "UPDATE_CAMPAIGN_STATUS":
      return {
        ...state,
        campaigns: state.campaigns.map((campaign) =>
          campaign.id === action.payload.id
            ? { ...campaign, status: action.payload.status }
            : campaign,
        ),
      };

    case "REMOVE_CAMPAIGN":
      return {
        ...state,
        campaigns: state.campaigns.filter((c) => c.id !== action.payload),
      };

    default:
      return state;
  }
}

// Initial state
const initialState: PageState = {
  campaigns: [],
  loading: true,
  filter: "all",
  searchTerm: "",
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  selectedCampaignId: null,
  isPanelOpen: false,
  isCreateModalOpen: false,
  activeTab: "all",
  selectedCampaigns: [],
  selectedMainCategory: "all",
  statusMenuOpen: null,
  editCategoryId: null,
  isCategoryEditOpen: false,
  editCampaignId: null,
  isEditModalOpen: false,
};

export default function OptimizedAdminCampaignsPage() {
  const [state, dispatch] = useReducer(pageReducer, initialState);

  // Memoized fetch function
  const fetchCampaigns = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const params = new URLSearchParams({
        page: state.currentPage.toString(),
        limit: "20",
        ...(state.activeTab === "trash"
          ? { status: "deleted" }
          : state.filter !== "all" && { status: state.filter }),
        ...(state.searchTerm && { search: state.searchTerm }),
        ...(state.selectedMainCategory !== "all" && {
          mainCategory: state.selectedMainCategory,
        }),
      });

      const response = await adminApi.get(`/api/admin/campaigns?${params}`);
      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: "SET_CAMPAIGNS",
          payload: {
            campaigns: data.campaigns || [],
            totalPages: data.pagination?.totalPages || 1,
            totalCount: data.pagination?.total || 0,
          },
        });
      } else {
        console.error("Failed to fetch campaigns:", response.status);
        dispatch({
          type: "SET_CAMPAIGNS",
          payload: { campaigns: [], totalPages: 1, totalCount: 0 },
        });
      }
    } catch (error) {
      console.error("캠페인 데이터 로드 실패:", error);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    state.currentPage,
    state.filter,
    state.searchTerm,
    state.activeTab,
    state.selectedMainCategory,
  ]);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch({ type: "SET_SEARCH", payload: value });
      }, 300),
    [],
  );

  // Effect to fetch campaigns
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Close status menu on outside click
  useEffect(() => {
    if (state.statusMenuOpen) {
      const handleClickOutside = () =>
        dispatch({ type: "SET_STATUS_MENU", payload: null });
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [state.statusMenuOpen]);

  // Memoized handlers
  const handleStatusChange = useCallback(
    async (campaignId: string, newStatus: string) => {
      try {
        const response = await adminApi.put(
          `/api/admin/campaigns/${campaignId}/status`,
          { status: newStatus },
        );

        if (response.ok) {
          dispatch({
            type: "UPDATE_CAMPAIGN_STATUS",
            payload: { id: campaignId, status: newStatus.toLowerCase() },
          });
        } else {
          const errorData = await response.json();
          alert(
            `상태 변경에 실패했습니다: ${errorData.error || "알 수 없는 오류"}`,
          );
          fetchCampaigns();
        }
      } catch (error) {
        console.error("상태 변경 중 오류:", error);
        alert("상태 변경 중 오류가 발생했습니다.");
        fetchCampaigns();
      }
    },
    [fetchCampaigns],
  );

  const handleDeleteCampaign = useCallback(async (campaignId: string) => {
    if (
      !confirm(
        "이 캠페인을 삭제하시겠습니까?\\n삭제된 캠페인은 휴지통으로 이동됩니다.",
      )
    ) {
      return;
    }

    try {
      const response = await adminApi.put(
        `/api/admin/campaigns/${campaignId}/status`,
        { status: "deleted" },
      );

      if (response.ok) {
        dispatch({ type: "REMOVE_CAMPAIGN", payload: campaignId });
        alert("캠페인이 휴지통으로 이동되었습니다.");
      } else {
        alert("캠페인 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("캠페인 삭제 실패:", error);
      alert("캠페인 삭제 중 오류가 발생했습니다.");
    }
  }, []);

  // Memoized utility functions
  const getStatusColor = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
      PAUSED: "bg-orange-100 text-orange-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return statusMap[status.toUpperCase()] || "bg-gray-100 text-gray-800";
  }, []);

  const getStatusText = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: "진행중",
      DRAFT: "초안",
      PENDING_REVIEW: "승인대기",
      PAUSED: "일시중지",
      COMPLETED: "완료",
      REJECTED: "거절됨",
      CANCELLED: "취소",
    };
    return statusMap[status.toUpperCase()] || "알 수 없음";
  }, []);

  // Render optimized with memoization
  return (
    <AdminLayout>
      {/* Rest of the component JSX would go here - keeping structure but with optimized state management */}
      <div>
        {/* Header, filters, campaign list, etc. */}
        {state.loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div>
            {/* Campaign list and other UI elements */}
            <p>Optimized campaigns page with consolidated state management</p>
            <p>Total campaigns: {state.totalCount}</p>
            <p>
              Current page: {state.currentPage} / {state.totalPages}
            </p>
          </div>
        )}

        {/* Lazy-loaded modals */}
        {state.isPanelOpen && state.selectedCampaignId && (
          <CampaignDetailPanel
            campaignId={state.selectedCampaignId}
            isOpen={state.isPanelOpen}
            onClose={() => dispatch({ type: "CLOSE_CAMPAIGN_DETAIL" })}
            onStatusChange={() => fetchCampaigns()}
          />
        )}

        {state.isCreateModalOpen && (
          <CampaignCreateModal
            isOpen={state.isCreateModalOpen}
            onClose={() => dispatch({ type: "TOGGLE_CREATE_MODAL" })}
            onSuccess={() => {
              dispatch({ type: "TOGGLE_CREATE_MODAL" });
              dispatch({ type: "SET_PAGE", payload: 1 });
              fetchCampaigns();
            }}
          />
        )}

        {state.isCategoryEditOpen && state.editCategoryId && (
          <CategoryEditPanel
            campaignId={state.editCategoryId}
            isOpen={state.isCategoryEditOpen}
            onClose={() => dispatch({ type: "CLOSE_CATEGORY_EDIT" })}
            onSave={() => {
              dispatch({ type: "CLOSE_CATEGORY_EDIT" });
              fetchCampaigns();
            }}
          />
        )}

        {state.isEditModalOpen && state.editCampaignId && (
          <CampaignEditModal
            campaignId={state.editCampaignId}
            isOpen={state.isEditModalOpen}
            onClose={() => dispatch({ type: "CLOSE_CAMPAIGN_EDIT" })}
            onSave={() => {
              dispatch({ type: "CLOSE_CAMPAIGN_EDIT" });
              fetchCampaigns();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
