"use client";

import React, { memo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";

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

interface OptimizedCampaignRowProps {
  campaign: Campaign;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const OptimizedCampaignRow = memo<OptimizedCampaignRowProps>(
  ({ campaign, onView, onEdit, onStatusChange, selected, onSelect }) => {
    const handleView = useCallback(
      () => onView(campaign.id),
      [onView, campaign.id],
    );
    const handleEdit = useCallback(
      () => onEdit(campaign.id),
      [onEdit, campaign.id],
    );
    const handleSelect = useCallback(
      () => onSelect(campaign.id),
      [onSelect, campaign.id],
    );
    const handleStatusChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onStatusChange(campaign.id, e.target.value);
      },
      [onStatusChange, campaign.id],
    );

    const statusColor =
      campaign.status === "ACTIVE"
        ? "success"
        : campaign.status === "PENDING"
          ? "warning"
          : "default";

    return (
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelect}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-3 font-medium">
          <button
            onClick={handleView}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {campaign.title}
          </button>
        </td>
        <td className="px-4 py-3 text-gray-600">{campaign.businessName}</td>
        <td className="px-4 py-3">
          <Badge variant={statusColor as any}>{campaign.status}</Badge>
        </td>
        <td className="px-4 py-3">{formatCurrency(campaign.budget)}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {formatDate(campaign.startDate)} ~ {formatDate(campaign.endDate)}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-blue-600 font-medium">
            {campaign.applicantCount}
          </span>
          <span className="text-gray-400"> / </span>
          <span className="text-green-600 font-medium">
            {campaign.selectedCount}
          </span>
        </td>
        <td className="px-4 py-3">{campaign.mainCategory}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              수정
            </button>
            <select
              value={campaign.status}
              onChange={handleStatusChange}
              className="px-2 py-1 text-sm border rounded"
            >
              <option value="PENDING">대기</option>
              <option value="ACTIVE">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
        </td>
      </tr>
    );
  },
  (prevProps, nextProps) => {
    // 커스텀 비교 함수로 최적화
    return (
      prevProps.campaign.id === nextProps.campaign.id &&
      prevProps.campaign.status === nextProps.campaign.status &&
      prevProps.campaign.applicantCount === nextProps.campaign.applicantCount &&
      prevProps.campaign.selectedCount === nextProps.campaign.selectedCount &&
      prevProps.selected === nextProps.selected
    );
  },
);

OptimizedCampaignRow.displayName = "OptimizedCampaignRow";
