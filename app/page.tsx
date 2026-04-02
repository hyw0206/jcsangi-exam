"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getWrongCount, getHistorySessions } from "@/lib/storage";

const YEAR_OPTIONS = [
  "2022-1", "2022-2", "2022-3",
  "2023-1", "2023-2", "2023-3",
  "2024-1", "2024-2", "2024-3",
];

export default function Home() {
  const router = useRouter();
  const [selectedMod, setSelectedMod] = useState<"random" | "select">("random");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // localStorage 통계
  const [wrongCount, setWrongCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    setWrongCount(getWrongCount());
    setSessionCount(getHistorySessions().length);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      setIsDark(false);
      try { localStorage.setItem("jcsangi_theme", "light"); } catch {}
    } else {
      html.classList.add("dark");
      setIsDark(true);
      try { localStorage.setItem("jcsangi_theme", "dark"); } catch {}
    }
  };

  const handleStartQuiz = () => {
    if (selectedMod === "random") {
      router.push("/random");
    } else {
      if (!selectedYear) {
        alert("회차를 선택해주세요.");
        return;
      }
      router.push(`/select/${selectedYear}`);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 gap-5">
      {/* 상단 바 */}
      <div className="w-full max-w-md flex justify-between items-center pt-2">
        <h1 className="text-xl font-bold text-blue-600">정보처리산업기사</h1>
        <button
          onClick={toggleDark}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          {isDark ? "☀️ 라이트" : "🌙 다크"}
        </button>
      </div>

      {/* 서브 타이틀 */}
      <p className="text-gray-500 text-sm -mt-2">최신 기출 문제 학습 앱</p>

      {/* 바로가기 카드 */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/wrong")}
          className="relative flex flex-col items-center justify-center gap-1 border rounded-xl py-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 transition-colors"
        >
          <span className="text-2xl">❌</span>
          <span className="text-sm font-semibold text-orange-600">틀린 문제</span>
          <span className="text-xs text-gray-400">모아서 풀기</span>
          {wrongCount > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {wrongCount > 99 ? "99+" : wrongCount}
            </span>
          )}
        </button>

        <button
          onClick={() => router.push("/history")}
          className="flex flex-col items-center justify-center gap-1 border rounded-xl py-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 transition-colors"
        >
          <span className="text-2xl">📋</span>
          <span className="text-sm font-semibold text-purple-600">히스토리</span>
          <span className="text-xs text-gray-400">{sessionCount}회 풀이</span>
        </button>
      </div>

      {/* 풀기 방법 선택 */}
      <div className="w-full max-w-md">
        <p className="text-base font-semibold mb-3">문제 풀기 방법 선택</p>
        <div className="space-y-2">
          <button
            onClick={() => { setSelectedMod("random"); setSelectedYear(null); }}
            className={`w-full py-3 px-4 rounded-xl border text-left transition-all ${
              selectedMod === "random"
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
            }`}
          >
            <div className="font-semibold">🎲 모의고사 모드</div>
            <div className={`text-xs mt-0.5 ${selectedMod === "random" ? "text-blue-100" : "text-gray-400"}`}>
              2022~2024 기출 문제 랜덤 출제 (과목별 20문항)
            </div>
          </button>

          <button
            onClick={() => setSelectedMod("select")}
            className={`w-full py-3 px-4 rounded-xl border text-left transition-all ${
              selectedMod === "select"
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
            }`}
          >
            <div className="font-semibold">📅 회차 선택 모드</div>
            <div className={`text-xs mt-0.5 ${selectedMod === "select" ? "text-blue-100" : "text-gray-400"}`}>
              특정 연도·회차의 기출 문제 풀기
            </div>
          </button>
        </div>

        {/* 회차 선택 그리드 */}
        {selectedMod === "select" && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">회차 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {YEAR_OPTIONS.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`py-2.5 px-2 rounded-xl border text-sm font-medium transition-all ${
                    selectedYear === year
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={handleStartQuiz}
        className="w-full max-w-md py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 font-bold text-lg shadow-md transition-all"
      >
        🚀 문제 풀기 시작
      </button>

      {/* 과목 안내 */}
      <div className="w-full max-w-md border rounded-xl p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <p className="text-sm font-semibold mb-2 text-gray-600 dark:text-gray-300">📚 시험 과목 안내</p>
        <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <li>1과목 · 정보시스템 기반 기술</li>
          <li>2과목 · 프로그래밍 언어 활용</li>
          <li>3과목 · 데이터베이스 활용</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">각 과목 40점 이상 + 평균 60점 이상 → 합격</p>
      </div>
    </div>
  );
}
