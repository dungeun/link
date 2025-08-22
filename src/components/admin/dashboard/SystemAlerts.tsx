"use client";

import { memo } from "react";

interface SystemAlert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  time: string;
}

interface SystemAlertsProps {
  alerts: SystemAlert[];
}

function SystemAlerts({ alerts }: SystemAlertsProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">시스템 알림</h2>
      </div>
      <div className="p-6 space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg ${
              alert.type === "warning"
                ? "bg-yellow-50 border border-yellow-200"
                : alert.type === "error"
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {alert.type === "warning" ? (
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : alert.type === "error" ? (
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm ${
                    alert.type === "warning"
                      ? "text-yellow-800"
                      : alert.type === "error"
                        ? "text-red-800"
                        : "text-blue-800"
                  }`}
                >
                  {alert.message}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    alert.type === "warning"
                      ? "text-yellow-600"
                      : alert.type === "error"
                        ? "text-red-600"
                        : "text-blue-600"
                  }`}
                >
                  {alert.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(SystemAlerts);
