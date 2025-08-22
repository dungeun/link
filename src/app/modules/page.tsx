"use client";

import { useState, useEffect } from "react";

export default function ModulesPage() {
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verdaccio에서 @company 모듈 목록 가져오기
    fetch("http://141.164.60.51:4873/-/all")
      .then((res) => res.json())
      .then((data) => {
        const companyModules = Object.keys(data)
          .filter((name) => name.startsWith("@company/"))
          .sort();
        setModules(companyModules);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch modules:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">@company 모듈 목록</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-6">
            총 {modules.length}개의 자체 모듈이 사용 가능합니다.
          </p>

          {loading ? (
            <p>모듈 목록을 불러오는 중...</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <div
                  key={module}
                  className="p-3 border rounded hover:bg-gray-50"
                >
                  <span className="font-mono text-sm">{module}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
