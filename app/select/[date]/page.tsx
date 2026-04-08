"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuizPlayer, { Question } from "@/components/QuizPlayer";

export default function SelectPage() {
  const params = useParams();
  const examDate = params?.date as string | undefined;

  const [questionMap, setQuestionMap] = useState<Record<number, Question[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examDate) return;

    setLoading(true);
    setError(null);
    setQuestionMap(null);

    fetch(`/api/questions/${examDate}`)
      .then(async (res) => {
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            msg = j.error ?? msg;
          } catch {}
          throw new Error(msg);
        }
        return res.json() as Promise<Question[]>;
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("예상치 못한 데이터 형식입니다.");

        const grouped: Record<number, Question[]> = {};
        data.forEach((q) => {
          q.date = examDate;
          if (!grouped[q.theme]) grouped[q.theme] = [];
          grouped[q.theme].push(q);
        });

        const themes = Object.keys(grouped).map(Number).sort((a, b) => a - b);
        if (themes.length === 0) throw new Error("문제 데이터가 없습니다.");

        setQuestionMap(grouped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [examDate]);

  if (!examDate) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        회차가 선택되지 않았습니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg text-gray-500">{examDate} 문제를 불러오는 중...</p>
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

  return <QuizPlayer questionMap={questionMap} mode="select" examDate={examDate} />;
}
