import { NextResponse } from 'next/server';
import fs from "fs";
import path from "path";

interface Question {
  question: string;
  answers: string[];
  correct: number;
  theme: number;
}

// 여러 개의 JSON 파일에서 문제 불러오기
const loadQuestions = (files: string[]): Question[] => {
  let allQuestions: Question[] = [];

  files.forEach((file) => {
    const filePath = path.join(process.cwd(), "data", file);
    const data = fs.readFileSync(filePath, "utf-8");
    const questions: Question[] = JSON.parse(data);
    allQuestions = allQuestions.concat(questions);
  });

  return allQuestions;
};

// 랜덤하게 배열 섞기 (Fisher-Yates 알고리즘)
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 테마별로 20개씩 문제를 가져오기
export const getQuestionsByTheme = (): Record<number, Question[]> => {
  const files = ["2022-1.json", "2022-2.json", "2022-3.json", "2023-1.json", "2023-2.json", "2023-3.json", "2024-1.json", "2024-2.json", "2024-3.json"];
  const allQuestions = loadQuestions(files);
  const grouped: Record<number, Question[]> = { 1: [], 2: [], 3: [] };

  // 테마별로 분류
  allQuestions.forEach((q) => {
    if (grouped[q.theme]) grouped[q.theme].push(q);
  });

  // 테마별로 20개씩 랜덤 선택
  for (const theme in grouped) {
    grouped[Number(theme)] = shuffleArray(grouped[Number(theme)]).slice(0, 20);
  }

  return grouped;
};