"use client";

import { useEffect, useState } from "react";
import QuizPlayer from "@/components/QuizPlayer";
import { Question } from "@/components/QuizPlayer";

export default function RandomPage() {
  const [questionMap, setQuestionMap] = useState<Record<number, Question[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/questions")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) throw new Error("API returned unexpected format");
        setQuestionMap(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg text-gray-500">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !questionMap) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        오류: {error ?? "문제를 불러올 수 없습니다."}
      </div>
    );
  }

  return <QuizPlayer questionMap={questionMap} mode="random" />;
}
