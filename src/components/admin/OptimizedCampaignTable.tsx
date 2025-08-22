"use client";

import React, { memo, useCallback, useMemo } from "react";
import { OptimizedCampaignRow } from "./OptimizedCampaignRow";
import { ChevronUp, ChevronDown } from "lucide-react";

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

interface OptimizedCampaignTableProps {
  campaigns: Campaign[];
  selectedCampaigns: Set<string>;
  onSelectCampaign: (id: string) => void;
  onSelectAll: () => void;
  onViewCampaign: (id: string) => void;
  onEditCampaign: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  sortField: string | null;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

export const OptimizedCampaignTable = memo<OptimizedCampaignTableProps>(
  ({
    campaigns,
    selectedCampaigns,
    onSelectCampaign,
    onSelectAll,
    onViewCampaign,
    onEditCampaign,
    onStatusChange,
    sortField,
    sortDirection,
    onSort,
  }) => {
    const allSelected = useMemo(
      () =>
        campaigns.length > 0 &&
        campaigns.every((c) => selectedCampaigns.has(c.id)),
      [campaigns, selectedCampaigns],
    );

    const renderSortIcon = useCallback(
      (field: string) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? (
          <ChevronUp className="w-4 h-4 inline ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 inline ml-1" />
        );
      },
      [sortField, sortDirection],
    );

    const handleSort = useCallback(
      (field: string) => () => onSort(field),
      [onSort],
    );

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={handleSort("title")}
              >
                캠페인명 {renderSortIcon("title")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={handleSort("businessName")}
              >
                비즈니스 {renderSortIcon("businessName")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={handleSort("status")}
              >
                상태 {renderSortIcon("status")}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={handleSort("budget")}
              >
                예산 {renderSortIcon("budget")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기간
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                지원/선정
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                카테고리
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <OptimizedCampaignRow
                key={campaign.id}
                campaign={campaign}
                selected={selectedCampaigns.has(campaign.id)}
                onSelect={onSelectCampaign}
                onView={onViewCampaign}
                onEdit={onEditCampaign}
                onStatusChange={onStatusChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);

OptimizedCampaignTable.displayName = "OptimizedCampaignTable";
