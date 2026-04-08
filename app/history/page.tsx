"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getHistorySessions, clearHistory, HistorySession } from "@/lib/storage";

const THEME_NAMES = ["정보시스템 기반 기술", "프로그래밍 언어 활용", "데이터베이스 활용"];

const MODE_LABEL: Record<string, string> = {
  random: "🎲 모의고사",
  select: "📅 선택 풀기",
  wrong: "❌ 틀린 문제",
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setSessions(getHistorySessions());
  }, []);

  const handleClear = () => {
    if (!confirm("히스토리를 모두 삭제하시겠습니까?")) return;
    clearHistory();
    setSessions([]);
  };

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

  // ── 통계 요약 ──────────────────────────────────
  const totalSessions = sessions.length;
  const totalCorrect = sessions.reduce((s, sess) => s + sess.correctCount, 0);
  const totalWrong = sessions.reduce((s, sess) => s + sess.wrongCount, 0);
  const overallAccuracy =
    totalCorrect + totalWrong > 0
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
      : 0;

  // 과목별 누적 정답률
  const themeStats = [1, 2, 3].map((tn) => {
    let correct = 0;
    let total = 0;
    sessions.forEach((sess) => {
      const tr = sess.themeResults.find((r) => r.theme === tn);
      if (tr) {
        correct += tr.correct;
        total += tr.correct + tr.wrong;
      }
    });
    const pct = total > 0 ? Math.round((correct / total) * 100) : null;
    return { tn, correct, total, pct };
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
        <h1 className="text-2xl font-bold">📋 풀이 히스토리</h1>
        {sessions.length > 0 ? (
          <button
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700"
          >
            전체 삭제
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 mt-12 text-gray-400">
          <div className="text-5xl">📭</div>
          <p className="text-lg">아직 풀이 기록이 없습니다.</p>
          <p className="text-sm">문제를 풀면 자동으로 기록됩니다.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
          >
            문제 풀러 가기
          </button>
        </div>
      ) : (
        <>
          {/* 전체 통계 */}
          <div className="w-full border rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm">
            <h2 className="text-base font-bold mb-3">📊 누적 통계</h2>
            <div className="grid grid-cols-4 gap-2 text-center mb-4">
              <div>
                <p className="text-xl font-bold text-blue-500">{totalSessions}</p>
                <p className="text-xs text-gray-400">총 세션</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-500">{totalCorrect}</p>
                <p className="text-xs text-gray-400">총 정답</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">{totalWrong}</p>
                <p className="text-xs text-gray-400">총 오답</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-500">{overallAccuracy}%</p>
                <p className="text-xs text-gray-400">정답률</p>
              </div>
            </div>

            {/* 과목별 정답률 바 */}
            <div className="space-y-2">
              {themeStats.map(({ tn, pct, correct, total }) => (
                <div key={tn}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-300">
                      {tn}과목 · {THEME_NAMES[tn - 1]}
                    </span>
                    <span className="text-gray-500">
                      {total > 0 ? `${correct}/${total} (${pct}%)` : "기록 없음"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (pct ?? 0) >= 60 ? "bg-green-500" : "bg-red-400"
                      }`}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 세션 리스트 */}
          <div className="w-full space-y-3">
            {sessions.map((sess, i) => {
              const validThemes = sess.themeResults.filter(
                (r) => r.correct + r.wrong > 0
              );
              const avgScore =
                validThemes.length > 0
                  ? Math.round(
                      validThemes.reduce((s, r) => s + r.score, 0) /
                        validThemes.length
                    )
                  : 0;
              const passed =
                validThemes.length === 3 &&
                validThemes.every((r) => r.score >= 40) &&
                avgScore >= 60;
              const accuracy =
                sess.totalQuestions > 0
                  ? Math.round((sess.correctCount / sess.totalQuestions) * 100)
                  : 0;
              const isOpen = expanded === sess.id;

              return (
                <div
                  key={sess.id}
                  className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                >
                  {/* 세션 헤더 (클릭해서 펼치기) */}
                  <button
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggle(sess.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium shrink-0">
                        {MODE_LABEL[sess.mode] ?? sess.mode}
                        {sess.date ? ` (${sess.date})` : ""}
                      </span>
                      {validThemes.length === 3 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            passed
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40"
                              : "bg-red-100 text-red-600 dark:bg-red-900/40"
                          }`}
                        >
                          {passed ? "합격권" : "불합격"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatDate(sess.playedAt)}</p>
                        <p className="text-xs text-gray-500">
                          {sess.correctCount}/{sess.totalQuestions} ({accuracy}%) ·{" "}
                          {sess.durationSec ? formatTime(sess.durationSec) : "-"}
                        </p>
                      </div>
                      <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {/* 세션 상세 */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t dark:border-gray-700">
                      <table className="w-full text-sm mt-3 border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            <th className="border border-gray-200 dark:border-gray-600 p-2 text-left">과목</th>
                            <th className="border border-gray-200 dark:border-gray-600 p-2">맞은 개수</th>
                            <th className="border border-gray-200 dark:border-gray-600 p-2">틀린 개수</th>
                            <th className="border border-gray-200 dark:border-gray-600 p-2">점수</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sess.themeResults.map((r) => (
                            <tr
                              key={r.theme}
                              className={
                                r.score < 40 && r.correct + r.wrong > 0
                                  ? "bg-red-50 dark:bg-red-900/20"
                                  : ""
                              }
                            >
                              <td className="border border-gray-200 dark:border-gray-600 p-2 text-xs">
                                {r.theme}. {r.themeName}
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 p-2 text-center">
                                {r.correct}
                              </td>
                              <td className="border border-gray-200 dark:border-gray-600 p-2 text-center">
                                {r.wrong}
                              </td>
                              <td
                                className={`border border-gray-200 dark:border-gray-600 p-2 text-center font-semibold ${
                                  r.score < 40 && r.correct + r.wrong > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {r.score}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            <td
                              colSpan={3}
                              className="border border-gray-200 dark:border-gray-600 p-2 text-right font-bold text-xs"
                            >
                              평균
                            </td>
                            <td
                              className={`border border-gray-200 dark:border-gray-600 p-2 text-center font-bold ${
                                avgScore >= 60 ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {avgScore}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
