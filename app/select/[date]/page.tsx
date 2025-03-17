"use client";

import { useEffect, useState, useRef } from "react";
import { toast, Toaster } from "sonner";
import parse from "html-react-parser";
import Head from "next/head";
import { useParams } from "next/navigation";

interface Question {
  question: string;
  answers: string[];
  correct: number;
  theme: number;
  date: string;
  explanation?: string;
}

export default function SelectedYearQuiz() {
  const [questionsByTheme, setQuestionsByTheme] = useState<Record<number, Question[]>>({});
  const [currentTheme, setCurrentTheme] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<
    {
      question: Question;
      isCorrect: boolean;
      selectedAnswer: number | null;
    }[]
  >([]);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const answerButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [showResultPage, setShowResultPage] = useState(false);
  const params = useParams();
  const { date } = params;


  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/questions/${date}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorData.error}`);
        }
        const data: Question[] = await res.json();

        // Group questions by theme
        const groupedQuestions: Record<number, Question[]> = {};
        data.forEach(question => {
          if (!groupedQuestions[question.theme]) {
            groupedQuestions[question.theme] = [];
          }
          groupedQuestions[question.theme].push(question);
        });

        setQuestionsByTheme(groupedQuestions);

        // Set the initial theme if questions are available
        const firstTheme = Object.keys(groupedQuestions)[0];
        if (firstTheme) {
            setCurrentTheme(Number(firstTheme));
        }

      } catch (err) {
        console.error("Failed to fetch questions:", err);
      }
    }

    fetchQuestions();

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key >= "1" && event.key <= "4") {
          const index = parseInt(event.key) - 1;
          setActiveButtonIndex(index);
          if (answerButtonsRef.current[index]) {
            answerButtonsRef.current[index]?.focus();
          }
        } else if (event.key === "Enter" && activeButtonIndex !== null) {
          handleAnswerClick(activeButtonIndex);
        }
      };
  
      window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [date]);



  const handleAnswerClick = (selectedAnswerIndex: number) => {
    if (currentTheme && questionsByTheme[currentTheme]) {
      const currentQuestion = questionsByTheme[currentTheme][currentQuestionIndex];
      const isCorrect = selectedAnswerIndex === currentQuestion.correct;

      setResults([
        ...results,
        {
          question: currentQuestion,
          isCorrect,
          selectedAnswer: selectedAnswerIndex,
        },
      ]);
      toast(isCorrect ? "✅ 정답입니다!" : "❌ 오답입니다!", {
        description: `정답: ${currentQuestion.answers[currentQuestion.correct -1]}`, // Corrected description
        style: { backgroundColor: isCorrect ? "#4CAF50" : "#F44336", color: "#fff" },
        duration: 1000,
      });

      handleNextQuestion();
    }
  };



  const handleNextQuestion = () => {
    if (currentTheme) {
      if (currentQuestionIndex < questionsByTheme[currentTheme].length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setActiveButtonIndex(null); // Reset active button
      } else {
        const themes = Object.keys(questionsByTheme).map(Number);
        const currentThemeIndex = themes.indexOf(currentTheme);
        if (currentThemeIndex < themes.length - 1) {
          setCurrentTheme(themes[currentThemeIndex + 1]);
          setCurrentQuestionIndex(0); // Reset question index for new theme
          setActiveButtonIndex(null); // Reset active button
        } else {
          toast("🎉 모든 문제를 풀었습니다!", {
            description: "결과 페이지로 이동합니다.",
            style: { backgroundColor: "#1976D2", color: "#fff" },
          });
          setShowResultPage(true);
        }
      }
    }
  };



  const showResults = () => {
    const wrongAnswers = results.filter((result) => !result.isCorrect);
    const correctAnswers = results.filter((result) => result.isCorrect);

    const themes = ["정보시스템 기반 기술", "프로그래밍 언어 활용", "데이터베이스 활용"];

    const themeResults = themes.map((themeName, index) => {
      const themeNumber = index + 1;
      const themeQuestions = results.filter(
        (result) => result.question.theme === themeNumber
      );
      const correctCount = themeQuestions.filter(
        (result) => result.isCorrect
      ).length;
      const wrongCount = themeQuestions.length - correctCount;
      const score = correctCount * 5;

      return {
        themeName,
        correctCount,
        wrongCount,
        score,
      };
    });

    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <h2 className="text-2xl font-bold">문제 풀이 결과</h2>

        <table className="border-collapse border border-gray-400">
          <thead>
            <tr>
              <th className="border border-gray-400 p-2">과목명</th>
              <th className="border border-gray-400 p-2">맞은 개수</th>
              <th className="border border-gray-400 p-2">틀린 개수</th>
              <th className="border border-gray-400 p-2">점수</th>
            </tr>
          </thead>
          <tbody>
            {themeResults.map((themeResult, index) => (
              <tr key={index}>
                <td className="border border-gray-400 p-2">{themeResult.themeName}</td>
                <td className="border border-gray-400 p-2">{themeResult.correctCount}</td>
                <td className="border border-gray-400 p-2">{themeResult.wrongCount}</td>
                <td className="border border-gray-400 p-2">{themeResult.score}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="border border-gray-400 p-2 font-bold text-center" colSpan={3}>
                평균 점수
              </td>
              <td className="border border-gray-400 p-2 font-bold">
                {
                  (() => {
                    const validResults = themeResults.filter(
                      (result) => result.correctCount !== 0 || result.wrongCount !== 0
                    );

                    if (validResults.length === 0) return 0;

                    const averageScore = Math.round(
                      validResults.reduce((sum, result) => sum + result.score, 0) / validResults.length
                    );

                    return averageScore;
                  })()
                }
              </td>
            </tr>
          </tfoot>
        </table>
        <div>한 과목 40점 미만일 시 과락</div>
        <div>평균 60점 이상 시 합격</div>

        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          다시 풀기
        </button>

        {wrongAnswers.length > 0 && (
          <div className="max-w-xl w-full mt-4">
            <h3 className="text-2xl font-semibold">틀린 문제</h3>
            {themes.map((themeName, index) => {
              const themeNumber = index + 1;
              const themeWrongAnswers = wrongAnswers.filter(
                (result) => result.question.theme === themeNumber
              );
              if (themeWrongAnswers.length === 0) return null;

              return (
                <div key={themeNumber}>
                  <h4 className="text-lg font-semibold mt-4">{themeNumber}과목 : {themeName}</h4>
                  <ul>
                    {themeWrongAnswers.map((result, index) => (
                      <li key={index} className="mb-2 border p-5">
                        <p>{result.question.date}회 출제 문제</p>
                        <p>{parse(result.question.question)}</p>
                        <ul className="my-4">
                          {result.question.answers.map((item, idx) => (
                            <li key={idx}>
                              {idx + 1}. {parse(item)}
                            </li>
                          ))}
                        </ul>
                        <p>입력한 답: {result.selectedAnswer ? result.question.answers[result.selectedAnswer - 1] : "선택 안함"}</p>
                        <p>정답: {result.question.answers[result.question.correct - 1]}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {correctAnswers.length > 0 && (
          <div className="max-w-xl w-full mt-4">
            <h3 className="text-2xl font-semibold">맞은 문제</h3>
            {themes.map((themeName, index) => {
              const themeNumber = index + 1;
              const themeCorrectAnswers = correctAnswers.filter(
                (result) => result.question.theme === themeNumber
              );
              if (themeCorrectAnswers.length === 0) return null;

              return (
                <div key={themeNumber}>
                  <h4 className="text-lg font-semibold mt-4">{themeNumber}과목 : {themeName}</h4>
                  <ul>
                    {themeCorrectAnswers.map((result, index) => (
                      <li key={index} className="mb-2 border p-5">
                        <p>{result.question.date}회 출제 문제</p>
                        <p>{parse(result.question.question)}</p>
                        <ul className="mt-2">
                          {result.question.answers.map((item, idx) => (
                            <li key={idx}>
                              {idx + 1}. {parse(item)}
                            </li>
                          ))}
                        </ul>
                        <p>정답: {result.question.answers[result.question.correct - 1]}</p>
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
  };

  if (showResultPage) {
    return showResults();
  }

  if (!currentTheme || !questionsByTheme[currentTheme]) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

    const currentQuestion = questionsByTheme[currentTheme][currentQuestionIndex];
    const currentQuestionNumber = results.length + 1; // 전체 문제에서의 현재 문제 번호
    const themes = ["정보시스템 기반 기술", "프로그래밍 언어 활용", "데이터베이스 활용"];

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=0.5, maximum-scale=1.0, user-scalable=yes" />
      </Head>
      <div className="flex flex-col justify-center items-center gap-4 p-4">
        <Toaster position="top-center" />
        <h2 className="text-3xl font-bold">
          {currentTheme}과목 : {themes[currentTheme - 1]}
        </h2>
        <div className="border p-4 rounded-md lg:max-w-full max-w-xl w-xl lg:text-lg text-2xl">
          <p>{currentQuestion.date}회 출제 문제</p>
          <p className="lg:text-2xl text-3xl font-semibold">
          {currentQuestionNumber}. {parse(currentQuestion.question)}
          </p>
          <ul className="mt-2">
            {currentQuestion.answers.map((answer, index) => (
              <li key={index} className="flex items-center mb-1">
                <button
                  ref={(el) => {
                    if (el) {
                      answerButtonsRef.current[index] = el;
                    }
                  }}
                  onClick={() => handleAnswerClick(index + 1)}
                  className={`bg-gray-200 hover:bg-gray-300 px-2 py-2 rounded mr-2 lg:text-2xl text-4xl ${
                    activeButtonIndex === index ? "ring-2 ring-blue-500 ring-opacity-50" : ""
                  }`}
                >
                  {index + 1}
                </button>
                <span className="lg:text-xl text-3xl">
                  {parse(answer)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}