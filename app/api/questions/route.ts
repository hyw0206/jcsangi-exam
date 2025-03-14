// /app/api/questions/route.ts
import { NextResponse } from 'next/server';
import { getQuestionsByTheme } from '@/lib/question'; // 경로는 실제 파일 위치에 맞게 수정하세요.

export async function GET() {
  try {
    const questions = getQuestionsByTheme();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}