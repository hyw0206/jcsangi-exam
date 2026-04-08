"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWrongQuestions,
  clearWrongQuestions,
  WrongQuestionEntry,
} from "@/lib/storage";
import QuizPlayer, { Question } from "@/components/QuizPlayer";

// Fisher-Yates 셔플
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type ViewMode = "list" | "quiz";

export default function WrongPage() {
  const router = useRouter();
  const [wrongList, setWrongList] = useState<WrongQuestionEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [questionMap, setQuestionMap] = useState<Record<number, Question[]>>({});

  useEffect(() => {
    setWrongList(getWrongQuestions());
  }, []);

  const handleStartQuiz = () => {
    if (wrongList.length === 0) return;
    // 과목별로 그룹화 후 QuizPlayer에 전달
    const grouped: Record<number, Question[]> = {};
    const shuffled = shuffle(wrongList);
    shuffled.forEach(({ question: q }) => {
      if (!grouped[q.theme]) grouped[q.theme] = [];
      grouped[q.theme].push(q as Question);
    });
    setQuestionMap(grouped);
    setViewMode("quiz");
  };

  const handleClearAll = () => {
    if (!confirm("틀린 문제 목록을 모두 삭제하시겠습니까?")) return;
    clearWrongQuestions();
    setWrongList([]);
  };

  // ── 퀴즈 모드 ──────────────────────────────
  if (viewMode === "quiz") {
    return <QuizPlayer questionMap={questionMap} mode="wrong" />;
  }

  // ── 목록 모드 ──────────────────────────────
  const themeNames = ["정보시스템 기반 기술", "프로그래밍 언어 활용", "데이터베이스 활용"];

  const groupedByTheme: Record<number, WrongQuestionEntry[]> = { 1: [], 2: [], 3: [] };
  wrongList.forEach((entry) => {
    if (groupedByTheme[entry.question.theme]) {
      groupedByTheme[entry.question.theme].push(entry);
    }
  });

  return (
    <div className="flex flex-col items-center gap-4 p-4 pb-16 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ← 홈으로
        </button>
        <h1 className="text-2xl font-bold">❌ 틀린 문제 모음</h1>
        <div className="w-16" />
      </div>

      {wrongList.length === 0 ? (
        <div className="flex flex-col items-center gap-4 mt-12 text-gray-400">
          <div className="text-5xl">🎉</div>
          <p className="text-lg">틀린 문제가 없습니다!</p>
          <p className="text-sm">문제를 풀면 틀린 문제가 자동으로 저장됩니다.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
          >
            문제 풀러 가기
          </button>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="w-full grid grid-cols-3 gap-3">
            {[1, 2, 3].map((tn) => (
              <div
                key={tn}
                className="border rounded-xl p-3 text-center bg-white dark:bg-gray-800 shadow-sm"
              >
                <p className="text-xs text-gray-500 mb-1">{tn}과목</p>
                <p className="text-2xl font-bold text-red-500">{groupedByTheme[tn].length}</p>
                <p className="text-xs text-gray-400">문제</p>
              </div>
            ))}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 flex-wrap justify-center w-full">
            <button
              onClick={handleStartQuiz}
              className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl hover:bg-orange-600 font-semibold text-base"
            >
              ✏️ 틀린 문제 모아서 풀기 ({wrongList.length}개)
            </button>
            <button
              onClick={handleClearAll}
              className="bg-red-100 text-red-600 py-3 px-4 rounded-xl hover:bg-red-200 text-sm dark:bg-red-900/30 dark:text-red-400"
            >
              🗑 전체 삭제
            </button>
          </div>

          {/* 과목별 목록 */}
          {[1, 2, 3].map((tn) => {
            const entries = groupedByTheme[tn];
            if (entries.length === 0) return null;
            return (
              <div key={tn} className="w-full">
                <h3 className="text-base font-semibold mb-2 text-blue-600">
                  {tn}과목 : {themeNames[tn - 1]} ({entries.length}개)
                </h3>
                <ul className="space-y-3">
                  {entries.map((entry, idx) => (
                    <li
                      key={idx}
                      className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs text-gray-400">
                          {entry.question.date}회 출제 • 틀린 횟수:{" "}
                          <span className="text-red-500 font-bold">{entry.wrongCount}회</span>
                        </p>
                        <p className="text-xs text-gray-400">
                          마지막:{" "}
                          {new Date(entry.lastWrongAt).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <p className="text-sm font-medium mb-2 leading-relaxed">
                        {entry.question.question}
                      </p>
                      <p className="text-xs text-gray-500">
                        내 답:{" "}
                        <span className="text-red-500 font-semibold">
                          {entry.selectedAnswer}번
                        </span>
                        {" / "}
                        정답:{" "}
                        <span className="text-green-600 font-semibold">
                          {entry.question.correct}번
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
