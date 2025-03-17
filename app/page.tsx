"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const [selectedMod, setSelectedMod] = useState("random");
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const handleModChange = (mod: string) => {
    setSelectedMod(mod);
    if (mod !== "select") {
      setSelectedYear(null);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const handleStartQuiz = () => {
    if (selectedMod === "random") {
      router.push('/random');
    } else if (selectedMod === "select") {
      if (selectedYear) {
        router.push(`/select/${selectedYear}`);
      } else {
        alert("년도를 선택해주세요.");
      }
    }
  };

  const yearOptions = [
    "2022-1",
    "2022-2",
    "2022-3",
  ];

  return (
    <div className="flex flex-col justify-center items-center text-xl gap-4 p-4">
      <div>정보처리산업기사 최신 기출</div>

      <div className="w-full max-w-md">
        <div className="text-lg font-semibold mb-2">문제 풀기 방법 선택</div>

        <div className="space-y-2">
          <button
            onClick={() => handleModChange("random")}
            className={`w-full py-2 px-4 rounded-md border border-gray-300 text-left ${
              selectedMod === "random" ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
            }`}
          >
            모의고사 (2021~2024 기출 문제 랜덤 출제)
          </button>
          <button
            onClick={() => handleModChange("select")}
            className={`w-full py-2 px-4 rounded-md border border-gray-300 text-left ${
              selectedMod === "select" ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
            }`}
          >
            선택년도 (지정 회차의 기출 문제)
          </button>
        </div>

        {selectedMod === "select" && (
          <div className="mt-4">
            <div className="text-lg font-semibold mb-2">회차 선택</div>
            <div className="grid grid-cols-2 gap-2">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={`w-full py-2 px-4 rounded-md border border-gray-300 text-left ${
                    selectedYear === year ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={handleStartQuiz}
          className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
        >
          문제 풀기
        </button>
      </div>
    </div>
  );
}