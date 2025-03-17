import { NextResponse } from 'next/server';
import fs from "fs";
import path from "path";
import { getQuestionsByTheme } from '@/lib/question';
interface Question {
  question: string;
  answers: string[];
  correct: number;
  theme: number;
}

export async function GET(request: Request, { params }: { params?: { date?: string } }) {
  try {
    const { date } = params || {};

    if (date) {
      const filePath = path.join(process.cwd(), "data", `${date}.json`);
      const data = fs.readFileSync(filePath, "utf-8");
      const questions: Question[] = JSON.parse(data);
      return NextResponse.json(questions);
    } else {
      const questions = getQuestionsByTheme();
      return NextResponse.json(questions);
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}