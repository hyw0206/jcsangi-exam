"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from 'next/navigation';
import { toast, Toaster } from "sonner";
import parse from 'html-react-parser';
import Head from "next/head";

interface Question {
  question: string;
  answers: string[];
  correct: number;
  theme: number;
  date: string;
  explanation?: string;
}

export default function Home() {
  const params = useParams();
  const [groupedQuestions, setGroupedQuestions] = useState<Record<number, Question[]>>({});
  const [currentTheme, setCurrentTheme] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const examDate = params?.date as string | null;

  useEffect(() => {
    let isMounted = true;
    setError(null);

    if (!examDate) {
      console.log("Waiting for examDate parameter...");
      setLoading(true);
      return;
    }

    console.log(`Workspaceing data for date: ${examDate}`);
    setLoading(true);
    setGroupedQuestions({});
    setCurrentTheme(null);
    setCurrentQuestionIndex(0);
    setCurrentQuestionNumber(1);
    setResults([]);
    setShowResultPage(false);


    fetch(`/api/questions/${examDate}`)
      .then(async (res) => {
        if (!res.ok) {
          let errorData = { error: `HTTP error ${res.status}` };
          try {
            errorData = await res.json();
          } catch (e) { /* Ignore JSON parsing error */ }
          throw new Error(errorData.error || `HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data: Question[]) => {
        if (isMounted) {
          if (Array.isArray(data)) {
            const grouped: Record<number, Question[]> = {};
            data.forEach(q => {
              if (!grouped[q.theme]) {
                grouped[q.theme] = [];
              }
              q.date = examDate;
              grouped[q.theme].push(q);
            });

            setGroupedQuestions(grouped);

            const themes = Object.keys(grouped).map(Number).sort((a, b) => a - b);
            if (themes.length > 0) {
              setCurrentTheme(themes[0]);
            } else {
              setError("No questions found in the fetched data.");
            }
          } else {
            throw new Error("API returned unexpected data format. Expected an array.");
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to fetch or process questions:", err);
          setError(err.message || "An unknown error occurred.");
          setLoading(false);
        }
      });

    const handleKeyDown = (event: KeyboardEvent) => {
       if (showResultPage) return;
      if (event.key >= "1" && event.key <= "4") {
         event.preventDefault(); 
        const index = parseInt(event.key) - 1;
        setActiveButtonIndex(index);
        if (answerButtonsRef.current[index]) {
          answerButtonsRef.current[index]?.focus();
        }
      } else if (event.key === "Enter" && activeButtonIndex !== null) {
         event.preventDefault();
         if (document.activeElement === answerButtonsRef.current[activeButtonIndex]) {
            handleAnswerClick(activeButtonIndex + 1);
         }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [examDate, showResultPage]);


  const handleAnswerClick = (selectedAnswerIndex: number) => {
    if (currentTheme && groupedQuestions[currentTheme]) {
      const currentQuestion = groupedQuestions[currentTheme][currentQuestionIndex];
      if (!currentQuestion) return;

      const isCorrect = selectedAnswerIndex === currentQuestion.correct;

      setResults(prevResults => [
        ...prevResults,
        {
          question: currentQuestion,
          isCorrect,
          selectedAnswer: selectedAnswerIndex,
        },
      ]);

      toast(isCorrect ? "✅ 정답입니다!" : "❌ 오답입니다!", {
        description: `정답: ${currentQuestion.correct}번`,
        style: { backgroundColor: isCorrect ? "#4CAF50" : "#F44336", color: "#fff" },
        duration: 1000,
      });

  
      handleNextQuestion();
 
    }
  };

  const handleNextQuestion = () => {
     setActiveButtonIndex(null);
     answerButtonsRef.current = [];

    if (currentTheme && groupedQuestions[currentTheme]) {
       const currentThemeQuestions = groupedQuestions[currentTheme];
       if (currentQuestionIndex < currentThemeQuestions.length - 1) {
         setCurrentQuestionIndex(prevIndex => prevIndex + 1);
         setCurrentQuestionNumber(prevNumber => prevNumber + 1);
       } else {
         const themes = Object.keys(groupedQuestions).map(Number).sort((a, b) => a - b);
         const currentThemeArrayIndex = themes.indexOf(currentTheme);
         if (currentThemeArrayIndex < themes.length - 1) {
           setCurrentTheme(themes[currentThemeArrayIndex + 1]);
           setCurrentQuestionIndex(0);
           setCurrentQuestionNumber(prevNumber => prevNumber + 1);
         } else {
           toast("🎉 모든 문제를 풀었습니다!", {
             description: "결과 페이지로 이동합니다.",
             style: { backgroundColor: "#1976D2", color: "#fff" },
             duration: 1500,
           });
           setTimeout(() => {
              setShowResultPage(true);
           }, 1500);
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
      const totalQuestionsInTheme = themeQuestions.length;
      const score = totalQuestionsInTheme > 0 ? Math.round((correctCount / totalQuestionsInTheme) * 100) : 0;

      return {
        themeName,
        correctCount,
        wrongCount,
        score,
        totalQuestions: totalQuestionsInTheme
      };
    });

    const totalCorrect = results.filter(r => r.isCorrect).length;
    const totalQuestions = results.length;
    const validThemeScores = themeResults.filter(r => r.totalQuestions > 0);
    const overallAverage = validThemeScores.length > 0 ? Math.round(validThemeScores.reduce((sum, r) => sum + r.score, 0) / validThemeScores.length) : 0;

    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <h2 className="text-2xl font-bold">문제 풀이 결과</h2>

        <table className="border-collapse border border-gray-400 w-full max-w-xl text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-2">과목명</th>
              <th className="border border-gray-400 p-2">맞은 개수</th>
              <th className="border border-gray-400 p-2">틀린 개수</th>
               <th className="border border-gray-400 p-2">총 문제</th>
              <th className="border border-gray-400 p-2">점수</th>
            </tr>
          </thead>
          <tbody>
            {themeResults.map((themeResult, index) => (
              <tr key={index}>
                <td className="border border-gray-400 p-2">{themeResult.themeName}</td>
                <td className="border border-gray-400 p-2">{themeResult.correctCount}</td>
                <td className="border border-gray-400 p-2">{themeResult.wrongCount}</td>
                 <td className="border border-gray-400 p-2">{themeResult.totalQuestions}</td>
                <td className={`border border-gray-400 p-2 ${themeResult.score < 40 && themeResult.totalQuestions > 0 ? 'text-red-600 font-bold' : ''}`}>{themeResult.score}</td>
              </tr>
            ))}
          </tbody>
           <tfoot>
             <tr className="bg-gray-100">
                <td className="border border-gray-400 p-2 font-bold text-center" colSpan={3}>
                    총계 / 평균
                </td>
                 <td className="border border-gray-400 p-2 font-bold">
                    {totalQuestions}
                 </td>
                 <td className={`border border-gray-400 p-2 font-bold ${overallAverage < 60 ? 'text-red-600' : 'text-green-600'}`}>
                    {overallAverage}
                 </td>
             </tr>
          </tfoot>
        </table>
         <div className="text-sm text-gray-600">한 과목 40점 미만 시 과락</div>
         <div className={`text-sm font-bold ${overallAverage < 60 ? 'text-red-600' : 'text-green-600'}`}>
            {overallAverage < 60 ? `평균 60점 미만 불합격` : `평균 60점 이상 합격`}
         </div>

        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mt-4"
          onClick={() => window.location.reload()}
        >
          다시 풀기
        </button>

        {wrongAnswers.length > 0 && (
          <div className="max-w-xl w-full mt-6">
            <h3 className="text-2xl font-semibold mb-3 text-center">틀린 문제 다시보기</h3>
            {themes.map((themeName, index) => {
              const themeNumber = index + 1;
              const themeWrongAnswers = wrongAnswers.filter(
                (result) => result.question.theme === themeNumber
              );
              if (themeWrongAnswers.length === 0) return null;

              return (
                <div key={themeNumber} className="mb-6">
                  <h4 className="text-xl font-semibold mt-4 mb-2">{themeNumber}과목 : {themeName}</h4>
                  <ul>
                    {themeWrongAnswers.map((result, idx) => (
                      <li key={idx} className="mb-4 border p-4 rounded-md bg-red-50">
                        <p className="text-sm text-gray-600 mb-2">{result.question.date}회 출제 문제</p>
                        <div className="font-medium mb-3">{parse(result.question.question)}</div>
                        <ul className="mb-3 space-y-1">
                          {result.question.answers.map((item, ansIdx) => (
                            <li key={ansIdx} className={`pl-4 ${ansIdx + 1 === result.question.correct ? 'text-green-700 font-bold' : ''} ${ansIdx + 1 === result.selectedAnswer ? 'line-through text-red-700' : ''}`}>
                              {ansIdx + 1}. {parse(item)}
                              {ansIdx + 1 === result.question.correct ? ' (정답)' : ''}
                              {ansIdx + 1 === result.selectedAnswer && ansIdx + 1 !== result.question.correct ? ' (선택한 답)' : ''}
                            </li>
                          ))}
                        </ul>
                        <p>입력한 답: {result.selectedAnswer} </p>
                        <p>정답: {result.question.correct}</p>
                         {result.question.explanation && (
                             <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
                                 <p className="font-semibold mb-1">해설:</p>
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

        {correctAnswers.length > 0 && (
          <div className="max-w-xl w-full mt-6">
            <h3 className="text-2xl font-semibold mb-3 text-center">맞은 문제 확인</h3>
             {themes.map((themeName, index) => {
              const themeNumber = index + 1;
              const themeCorrectAnswers = correctAnswers.filter(
                (result) => result.question.theme === themeNumber
              );
              if (themeCorrectAnswers.length === 0) return null;

              return (
                <div key={themeNumber} className="mb-6">
                   <h4 className="text-xl font-semibold mt-4 mb-2">{themeNumber}과목 : {themeName}</h4>
                  <ul>
                    {themeCorrectAnswers.map((result, idx) => (
                       <li key={idx} className="mb-4 border p-4 rounded-md bg-green-50">
                         <p className="text-sm text-gray-600 mb-2">{result.question.date}회 출제 문제</p>
                         <div className="font-medium mb-3">{parse(result.question.question)}</div>
                         <ul className="mb-3 space-y-1">
                           {result.question.answers.map((item, ansIdx) => (
                             <li key={ansIdx} className={`pl-4 ${ansIdx + 1 === result.question.correct ? 'text-green-700 font-bold' : ''}`}>
                               {ansIdx + 1}. {parse(item)}
                               {ansIdx + 1 === result.question.correct ? ' (정답)' : ''}
                             </li>
                           ))}
                         </ul>
                          {result.question.explanation && (
                             <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
                                 <p className="font-semibold mb-1">해설:</p>
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
  };

  if (showResultPage) {
    return showResults();
  }

  if (loading && !error) {
    return <div className="flex justify-center items-center h-screen">Loading questions {examDate ? `for ${examDate}` : ''}...</div>;
  }

  if (error) {
      return <div className="flex justify-center items-center h-screen">Error: {error}</div>;
  }

  if (!currentTheme || !groupedQuestions[currentTheme] || groupedQuestions[currentTheme].length === 0) {
    return <div className="flex justify-center items-center h-screen">No questions available. Check the date or API.</div>;
  }

  const currentQuestion = groupedQuestions[currentTheme][currentQuestionIndex];
  const themeNames = ["정보시스템 기반 기술", "프로그래밍 언어 활용", "데이터베이스 활용"];

  return (
    <>
      <Head>
         <meta name="viewport" content="width=device-width, initial-scale=0.5, maximum-scale=1.0, user-scalable=yes" />
         <title>정보처리기사 {examDate ? `- ${examDate}`: ''} 문제 풀이</title>
      </Head>
      <div className="flex flex-col justify-center items-center gap-4 p-4">
        <Toaster position="top-center" />
        <h2 className="text-3xl font-bold">
          {currentTheme}과목 : {themeNames[currentTheme - 1]}
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
                  className={`bg-gray-200 hover:bg-gray-300 px-2 py-2 rounded mr-2 lg:text-2xl text-4xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                    activeButtonIndex === index ? "ring-2 ring-blue-500 ring-opacity-50" : ""
                  }`}
                >
                  {index + 1}
                </button>
                {/* 원래 span 클래스 유지 */}
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