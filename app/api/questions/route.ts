import { NextResponse } from 'next/server';
import { getQuestionsByTheme } from '@/lib/question';
interface Question {
  question: string;
  answers: string[];
  correct: number;
  theme: number;
}

export async function GET(request: Request) {
  try {
    const questions = getQuestionsByTheme();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
