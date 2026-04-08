"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast, Toaster } from "sonner";
import parse from "html-react-parser";
import { useRouter } from "next/navigation";
import {
  addWrongQuestion,
  removeCorrectQuestion,
  saveHistorySession,
  generateSessionId,
  StoredQuestion,
  HistorySession,
} from "@/lib/storage";

// ─────────────────────────────────────────────
//  타입
// ─────────────────────────────────────────────
export interface Question extends StoredQuestion {}

interface QuizResult {
  question: Question;
  isCorrect: boolean;
  selectedAnswer: number | null;
}

interface Props {
  /** 테마(과목) → 문제 배열 맵 */
  questionMap: Record<number, Question[]>;
  /** 'random' | 'select' | 'wrong' */
  mode: "random" | "select" | "wrong";
  /** 선택 회차 (select 모드) */
  examDate?: string;
}

const THEME_NAMES = ["정보시스템 기반 기술", "프로그래밍 언어 활용", "데이터베이스 활용"];

// ─────────────────────────────────────────────
//  메인 컴포넌트
// ─────────────────────────────────────────────
export default function QuizPlayer({ questionMap, mode, examDate }: Props) {
  const router = useRouter();

  // ── 상태 ──────────────────────────────────
  const [currentTheme, setCurrentTheme] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [showResultPage, setShowResultPage] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [isDark, setIsDark] = useState(false);

  // 타이머
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // 키보드
  const answerButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // 세션 ID (히스토리 저장용)
  const sessionIdRef = useRef(generateSessionId());

  // 총 문제 수
  const totalQuestions = Object.values(questionMap).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // ── 초기화 ────────────────────────────────
  useEffect(() => {
    const themes = Object.keys(questionMap).map(Number).sort((a, b) => a - b);
    if (themes.length > 0) setCurrentTheme(themes[0]);

    // 타이머 시작
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // 다크모드 초기값
    setIsDark(document.documentElement.classList.contains("dark"));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── 키보드 단축키 ─────────────────────────
  const handleAnswerClickRef = useRef<(idx: number) => void>(() => {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResultPage) return;
      if (e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        setActiveButtonIndex(idx);
        answerButtonsRef.current[idx]?.focus();
      } else if (e.key === "Enter" && activeButtonIndex !== null) {
        e.preventDefault();
        handleAnswerClickRef.current(activeButtonIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResultPage, activeButtonIndex]);

  // ── 답 선택 ───────────────────────────────
  const handleAnswerClick = useCallback(
    (selectedIdx: number) => {
      if (!currentTheme || !questionMap[currentTheme]) return;
      const currentQuestion = questionMap[currentTheme][currentQuestionIndex];
      if (!currentQuestion) return;

      const isCorrect = selectedIdx === currentQuestion.correct;
      setLastAnswerCorrect(isCorrect);
      setShowExplanation(false);

      // localStorage 업데이트
      if (isCorrect) {
        removeCorrectQuestion(currentQuestion);
      } else {
        addWrongQuestion(currentQuestion, selectedIdx);
      }

      setResults((prev) => [
        ...prev,
        { question: currentQuestion, isCorrect, selectedAnswer: selectedIdx },
      ]);

      toast(isCorrect ? "✅ 정답입니다!" : "❌ 오답입니다!", {
        description: `정답: ${currentQuestion.correct}번`,
        style: {
          backgroundColor: isCorrect ? "#4CAF50" : "#F44336",
          color: "#fff",
        },
        duration: 900,
      });

      handleNextQuestion();
    },
    [currentTheme, currentQuestionIndex, questionMap]
  );

  // ref 최신화
  useEffect(() => {
    handleAnswerClickRef.current = handleAnswerClick;
  }, [handleAnswerClick]);

  // ── 다음 문제 ─────────────────────────────
  const handleNextQuestion = useCallback(() => {
    setActiveButtonIndex(null);
    answerButtonsRef.current = [];
    setShowExplanation(false);

    setCurrentTheme((prevTheme) => {
      if (!prevTheme) return prevTheme;
      const themeQuestions = questionMap[prevTheme];
      if (!themeQuestions) return prevTheme;

      setCurrentQuestionIndex((prevIdx) => {
        if (prevIdx < themeQuestions.length - 1) {
          setCurrentQuestionNumber((n) => n + 1);
          return prevIdx + 1;
        }
        // 다음 과목
        const themes = Object.keys(questionMap).map(Number).sort((a, b) => a - b);
        const themeArrIdx = themes.indexOf(prevTheme);
        if (themeArrIdx < themes.length - 1) {
          setCurrentTheme(themes[themeArrIdx + 1]);
          setCurrentQuestionNumber((n) => n + 1);
          return 0;
        }
        // 종료
        if (timerRef.current) clearInterval(timerRef.current);
        const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);

        toast("🎉 모든 문제를 풀었습니다!", {
          description: "결과 페이지로 이동합니다.",
          style: { backgroundColor: "#1976D2", color: "#fff" },
          duration: 1200,
        });
        setTimeout(() => setShowResultPage(true), 1200);
        return prevIdx;
      });
      return prevTheme;
    });
  }, [questionMap]);

  // ── 히스토리 저장 ─────────────────────────
  useEffect(() => {
    if (!showResultPage) return;
    const themeResults = THEME_NAMES.map((themeName, i) => {
      const tn = i + 1;
      const tq = results.filter((r) => r.question.theme === tn);
      const correct = tq.filter((r) => r.isCorrect).length;
      return {
        theme: tn,
        themeName,
        correct,
        wrong: tq.length - correct,
        score: correct * 5,
      };
    });

    const session: HistorySession = {
      id: sessionIdRef.current,
      mode,
      date: examDate,
      playedAt: new Date().toISOString(),
      totalQuestions,
      correctCount: results.filter((r) => r.isCorrect).length,
      wrongCount: results.filter((r) => !r.isCorrect).length,
      themeResults,
      durationSec: elapsedSec,
    };
    saveHistorySession(session);
  }, [showResultPage]);

  // ── 다크모드 토글 ─────────────────────────
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

  // ── 타이머 포맷 ───────────────────────────
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── 결과 페이지 ───────────────────────────
  if (showResultPage) {
    const wrongAnswers = results.filter((r) => !r.isCorrect);
    const correctAnswers = results.filter((r) => r.isCorrect);

    const themeResults = THEME_NAMES.map((themeName, i) => {
      const tn = i + 1;
      const tq = results.filter((r) => r.question.theme === tn);
      const correct = tq.filter((r) => r.isCorrect).length;
      const wrong = tq.length - correct;
      return { themeName, correct, wrong, score: correct * 5 };
    });

    const validResults = themeResults.filter((r) => r.correct + r.wrong > 0);
    const avgScore =
      validResults.length === 0
        ? 0
        : Math.round(
            validResults.reduce((s, r) => s + r.score, 0) / validResults.length
          );

    const passed = validResults.every((r) => r.score >= 40) && avgScore >= 60;

    return (
      <div className="flex flex-col items-center gap-4 p-4 pb-16">
        <div className="flex items-center gap-3 w-full max-w-xl justify-between">
          <h2 className="text-2xl font-bold">문제 풀이 결과</h2>
          <span className="text-sm text-gray-500">⏱ {formatTime(elapsedSec)}</span>
        </div>

        {/* 합격/불합격 배너 */}
        {validResults.length === 3 && (
          <div
            className={`w-full max-w-xl text-center py-3 rounded-xl font-bold text-lg ${
              passed
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {passed ? "🎉 합격권입니다!" : "😢 불합격 (재도전 화이팅!)"}
          </div>
        )}

        {/* 점수 테이블 */}
        <table className="border-collapse border border-gray-400 w-full max-w-xl text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border border-gray-400 p-2">과목명</th>
              <th className="border border-gray-400 p-2">맞은 개수</th>
              <th className="border border-gray-400 p-2">틀린 개수</th>
              <th className="border border-gray-400 p-2">점수</th>
            </tr>
          </thead>
          <tbody>
            {themeResults.map((r, i) => (
              <tr
                key={i}
                className={r.score < 40 && r.correct + r.wrong > 0 ? "bg-red-50 dark:bg-red-900/30" : ""}
              >
                <td className="border border-gray-400 p-2">{r.themeName}</td>
                <td className="border border-gray-400 p-2">{r.correct}</td>
                <td className="border border-gray-400 p-2">{r.wrong}</td>
                <td className={`border border-gray-400 p-2 font-semibold ${r.score < 40 && r.correct + r.wrong > 0 ? "text-red-600" : ""}`}>
                  {r.score}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <td className="border border-gray-400 p-2 font-bold text-center" colSpan={3}>
                평균 점수
              </td>
              <td className={`border border-gray-400 p-2 font-bold ${avgScore >= 60 ? "text-green-600" : "text-red-600"}`}>
                {avgScore}
              </td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs text-gray-500">한 과목 40점 미만 → 과락 / 평균 60점 이상 → 합격</p>

        {/* 버튼 그룹 */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
            onClick={() => window.location.reload()}
          >
            🔄 다시 풀기
          </button>
          <button
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-700 text-sm"
            onClick={() => router.push("/")}
          >
            🏠 홈으로
          </button>
          <button
            className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-700 text-sm"
            onClick={() => router.push("/wrong")}
          >
            ✏️ 틀린 문제 풀기
          </button>
          <button
            className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-700 text-sm"
            onClick={() => router.push("/history")}
          >
            📋 히스토리
          </button>
        </div>

        {/* 틀린 문제 목록 */}
        {wrongAnswers.length > 0 && (
          <div className="max-w-xl w-full mt-4">
            <h3 className="text-xl font-semibold mb-2">❌ 틀린 문제 ({wrongAnswers.length}개)</h3>
            {THEME_NAMES.map((themeName, i) => {
              const tn = i + 1;
              const twa = wrongAnswers.filter((r) => r.question.theme === tn);
              if (twa.length === 0) return null;
              return (
                <div key={tn}>
                  <h4 className="text-base font-semibold mt-4 mb-2 text-blue-600">
                    {tn}과목 : {themeName}
                  </h4>
                  <ul>
                    {twa.map((result, idx) => (
                      <li key={idx} className="mb-3 border rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                        <p className="text-xs text-gray-500 mb-1">{result.question.date}회 출제</p>
                        <p className="font-medium mb-2">{parse(result.question.question)}</p>
                        <ul className="mb-2 space-y-1">
                          {result.question.answers.map((item, aidx) => (
                            <li
                              key={aidx}
                              className={`text-sm px-2 py-1 rounded ${
                                aidx + 1 === result.question.correct
                                  ? "bg-green-100 text-green-800 font-semibold dark:bg-green-800/40 dark:text-green-300"
                                  : aidx + 1 === result.selectedAnswer
                                  ? "bg-red-100 text-red-700 line-through dark:bg-red-800/40 dark:text-red-300"
                                  : ""
                              }`}
                            >
                              {aidx + 1}. {parse(item)}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs">
                          내 답: <span className="text-red-600 font-bold">{result.selectedAnswer}번</span>
                          {" / "}
                          정답: <span className="text-green-600 font-bold">{result.question.correct}번</span>
                        </p>
                        {result.question.explanation && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs dark:bg-yellow-900/20">
                            <p className="font-semibold mb-1">📖 해설</p>
                            {parse(result.question.explanation)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* 맞은 문제 목록 */}
        {correctAnswers.length > 0 && (
          <div className="max-w-xl w-full mt-4">
            <h3 className="text-xl font-semibold mb-2">✅ 맞은 문제 ({correctAnswers.length}개)</h3>
            {THEME_NAMES.map((themeName, i) => {
              const tn = i + 1;
              const tca = correctAnswers.filter((r) => r.question.theme === tn);
              if (tca.length === 0) return null;
              return (
                <div key={tn}>
                  <h4 className="text-base font-semibold mt-4 mb-2 text-blue-600">
                    {tn}과목 : {themeName}
                  </h4>
                  <ul>
                    {tca.map((result, idx) => (
                      <li key={idx} className="mb-3 border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                        <p className="text-xs text-gray-500 mb-1">{result.question.date}회 출제</p>
                        <p className="font-medium mb-2">{parse(result.question.question)}</p>
                        <ul className="mb-2 space-y-1">
                          {result.question.answers.map((item, aidx) => (
                            <li
                              key={aidx}
                              className={`text-sm px-2 py-1 rounded ${
                                aidx + 1 === result.question.correct
                                  ? "bg-green-100 text-green-800 font-semibold dark:bg-green-800/40 dark:text-green-300"
                                  : ""
                              }`}
                            >
                              {aidx + 1}. {parse(item)}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs">정답: <span className="text-green-600 font-bold">{result.question.correct}번</span></p>
                        {result.question.explanation && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs dark:bg-yellow-900/20">
                            <p className="font-semibold mb-1">📖 해설</p>
                            {parse(result.question.explanation)}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── 문제 풀기 화면 ────────────────────────
  if (!currentTheme || !questionMap[currentTheme]) {
    return (
      <div className="flex justify-center items-center h-screen">문제가 없습니다.</div>
    );
  }

  const currentQuestion = questionMap[currentTheme][currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="flex justify-center items-center h-screen">문제를 불러오는 중...</div>
    );
  }

  const answeredCount = results.length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col min-h-screen">
        {/* 상단 바 */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between gap-2 shadow-sm">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
          >
            🏠 홈
          </button>

          <div className="flex-1 mx-3">
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 mt-0.5">
              {answeredCount} / {totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
              ⏱ {formatTime(elapsedSec)}
            </span>
            <button
              onClick={toggleDark}
              className="text-sm px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              title="다크모드 전환"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* 문제 본문 */}
        <div className="flex flex-col items-center gap-4 p-4 flex-1">
          {/* 과목 배지 */}
          <div className="flex gap-2 flex-wrap justify-center">
            {Object.keys(questionMap)
              .map(Number)
              .sort()
              .map((tn) => (
                <span
                  key={tn}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tn === currentTheme
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                  }`}
                >
                  {tn}과목
                </span>
              ))}
          </div>

          <h2 className="text-xl font-bold text-center">
            {currentTheme}과목 : {THEME_NAMES[currentTheme - 1]}
          </h2>

          {/* 문제 카드 */}
          <div className="border rounded-xl p-5 w-full max-w-2xl shadow-sm bg-white dark:bg-gray-800 dark:border-gray-600">
            <p className="text-xs text-gray-400 mb-2">{currentQuestion.date}회 출제</p>
            <p className="text-lg font-semibold mb-4 leading-relaxed">
              {currentQuestionNumber}. {parse(currentQuestion.question)}
            </p>
            <ul className="space-y-2">
              {currentQuestion.answers.map((answer, index) => (
                <li key={index}>
                  <button
                    ref={(el) => {
                      if (el) answerButtonsRef.current[index] = el;
                    }}
                    onClick={() => handleAnswerClick(index + 1)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-lg border transition-all
                      bg-gray-50 hover:bg-blue-50 hover:border-blue-400
                      dark:bg-gray-700 dark:hover:bg-blue-900/40 dark:border-gray-600
                      ${activeButtonIndex === index ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-200"}
                    `}
                  >
                    <span className="font-bold text-blue-600 min-w-[1.5rem]">{index + 1}</span>
                    <span className="leading-relaxed">{parse(answer)}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* 해설 보기 (해설이 있을 때만) */}
            {currentQuestion.explanation && (
              <div className="mt-4">
                <button
                  onClick={() => setShowExplanation((v) => !v)}
                  className="text-sm text-yellow-600 hover:text-yellow-700 underline"
                >
                  {showExplanation ? "해설 닫기" : "📖 해설 보기"}
                </button>
                {showExplanation && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm dark:bg-yellow-900/20 dark:border-yellow-700">
                    {parse(currentQuestion.explanation)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 키보드 단축키 안내 */}
          <p className="text-xs text-gray-400">
            💡 키보드 1~4 선택, Enter 확인
          </p>
        </div>
      </div>
    </>
  );
}
