"use client";

import React, { memo } from "react";
// Use lightweight recharts imports to reduce bundle size
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "@/lib/charts/recharts-lite";

interface ChartComponentsProps {
  data: {
    userStats: {
      byType: Array<{ type: string; count: number }>;
      byMonth: Array<{
        month: string;
        influencers: number;
        businesses: number;
      }>;
    };
    campaignStats: {
      byStatus: Array<{ status: string; count: number }>;
      byCategory: Array<{ category: string; count: number }>;
      byMonth: Array<{ month: string; count: number; revenue: number }>;
    };
    revenueStats: {
      byMonth: Array<{ month: string; amount: number }>;
      byPaymentMethod: Array<{ method: string; amount: number }>;
    };
  };
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const ChartComponents = memo<ChartComponentsProps>(({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">사용자 증가 추이</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.userStats.byMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="influencers"
              stroke="#3B82F6"
              name="인플루언서"
            />
            <Line
              type="monotone"
              dataKey="businesses"
              stroke="#10B981"
              name="비즈니스"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">매출 추이</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.revenueStats.byMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `₩${value.toLocaleString()}`}
            />
            <Bar dataKey="amount" fill="#3B82F6" name="매출" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Type Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">사용자 유형 분포</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.userStats.byType}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) =>
                `${entry.name} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.userStats.byType.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">캠페인 상태 분포</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.campaignStats.byStatus}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) =>
                `${entry.status} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.campaignStats.byStatus.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign and Revenue Trend */}
      <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold mb-4">캠페인 및 매출 추이</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.campaignStats.byMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              name="캠페인 수"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              name="매출"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Method Distribution */}
      <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold mb-4">결제 방법별 매출</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.revenueStats.byPaymentMethod}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="method" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `₩${value.toLocaleString()}`}
            />
            <Bar dataKey="amount" fill="#3B82F6" name="매출">
              {data.revenueStats.byPaymentMethod.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

ChartComponents.displayName = "ChartComponents";

export default ChartComponents;
