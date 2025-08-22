"use client";

import React, { memo, useCallback, useRef, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { OptimizedCampaignRow } from "./OptimizedCampaignRow";
import { Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  businessName: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  applicantCount: number;
  selectedCount: number;
  mainCategory: string;
}

interface VirtualizedCampaignListProps {
  campaigns: Campaign[];
  selectedCampaigns: Set<string>;
  onSelectCampaign: (id: string) => void;
  onViewCampaign: (id: string) => void;
  onEditCampaign: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  hasNextPage: boolean;
  isNextPageLoading: boolean;
  loadNextPage: () => Promise<void>;
  totalCount: number;
}

const ITEM_HEIGHT = 60; // Height of each row
const OVERSCAN_COUNT = 5; // Number of items to render outside visible area

export const VirtualizedCampaignList = memo<VirtualizedCampaignListProps>(
  ({
    campaigns,
    selectedCampaigns,
    onSelectCampaign,
    onViewCampaign,
    onEditCampaign,
    onStatusChange,
    hasNextPage,
    isNextPageLoading,
    loadNextPage,
    totalCount,
  }) => {
    const listRef = useRef<List>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate list height based on container
    const [listHeight, setListHeight] = React.useState(600);

    useEffect(() => {
      const updateHeight = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const availableHeight = window.innerHeight - rect.top - 100; // 100px for pagination
          setListHeight(Math.min(availableHeight, 800)); // Max 800px height
        }
      };

      updateHeight();
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }, []);

    // Count of items (including loading indicator)
    const itemCount = hasNextPage ? campaigns.length + 1 : campaigns.length;

    // Check if item is loaded
    const isItemLoaded = useCallback(
      (index: number) => {
        return !hasNextPage || index < campaigns.length;
      },
      [hasNextPage, campaigns.length],
    );

    // Load more items
    const loadMoreItems = useCallback(() => {
      if (isNextPageLoading) return Promise.resolve();
      return loadNextPage();
    }, [isNextPageLoading, loadNextPage]);

    // Row renderer
    const Row = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        // Loading row
        if (!isItemLoaded(index)) {
          return (
            <div
              style={style}
              className="flex items-center justify-center p-4 border-b"
            >
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">
                더 많은 캠페인 로딩 중...
              </span>
            </div>
          );
        }

        const campaign = campaigns[index];
        if (!campaign) return null;

        return (
          <div style={style} className="border-b border-gray-200">
            <table className="w-full">
              <tbody>
                <OptimizedCampaignRow
                  campaign={campaign}
                  selected={selectedCampaigns.has(campaign.id)}
                  onSelect={onSelectCampaign}
                  onView={onViewCampaign}
                  onEdit={onEditCampaign}
                  onStatusChange={onStatusChange}
                />
              </tbody>
            </table>
          </div>
        );
      },
      [
        campaigns,
        selectedCampaigns,
        onSelectCampaign,
        onViewCampaign,
        onEditCampaign,
        onStatusChange,
        isItemLoaded,
      ],
    );

    return (
      <div ref={containerRef} className="w-full">
        {/* Table Header */}
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  선택
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비즈니스
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  예산
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  지원/선정
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  카테고리
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  액션
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Virtualized List */}
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                ref(list);
                // @ts-ignore
                listRef.current = list;
              }}
              height={listHeight}
              itemCount={itemCount}
              itemSize={ITEM_HEIGHT}
              onItemsRendered={onItemsRendered}
              overscanCount={OVERSCAN_COUNT}
              width="100%"
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              {Row}
            </List>
          )}
        </InfiniteLoader>

        {/* Status Bar */}
        <div className="mt-2 text-sm text-gray-500 text-center">
          {campaigns.length}개 표시 / 전체 {totalCount}개
        </div>
      </div>
    );
  },
);

VirtualizedCampaignList.displayName = "VirtualizedCampaignList";
