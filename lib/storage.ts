// ─────────────────────────────────────────────
//  localStorage 키 상수
// ─────────────────────────────────────────────
const WRONG_QUESTIONS_KEY = "jcsangi_wrong_questions";
const HISTORY_KEY = "jcsangi_history";

// ─────────────────────────────────────────────
//  공통 타입
// ─────────────────────────────────────────────
export interface StoredQuestion {
  question: string;
  answers: string[];
  correct: number;
  theme: number;
  date: string;
  explanation?: string;
}

export interface WrongQuestionEntry {
  question: StoredQuestion;
  /** 사용자가 선택한 오답 번호 */
  selectedAnswer: number | null;
  /** 마지막으로 틀린 시각 (ISO string) */
  lastWrongAt: string;
  /** 누적 틀린 횟수 */
  wrongCount: number;
  /** 고유 식별자 (date + questionText 해시) */
  id: string;
}

export interface HistorySession {
  id: string;
  /** 'random' | 'select' | 'wrong' */
  mode: "random" | "select" | "wrong";
  /** 선택 회차 (선택 모드일 때) */
  date?: string;
  playedAt: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  /** 과목별 결과 */
  themeResults: {
    theme: number;
    themeName: string;
    correct: number;
    wrong: number;
    score: number;
  }[];
  /** 소요 시간 (초) */
  durationSec?: number;
}

// ─────────────────────────────────────────────
//  틀린 문제 관련
// ─────────────────────────────────────────────

/** 간단한 문자열 해시 (ID 생성용) */
function makeId(date: string, question: string): string {
  const raw = `${date}::${question}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `q_${Math.abs(hash).toString(36)}`;
}

/** 저장된 전체 틀린 문제 맵 반환 */
export function getWrongQuestionsMap(): Record<string, WrongQuestionEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WRONG_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 틀린 문제 리스트 반환 (wrongCount 내림차순) */
export function getWrongQuestions(): WrongQuestionEntry[] {
  const map = getWrongQuestionsMap();
  return Object.values(map).sort((a, b) => b.wrongCount - a.wrongCount);
}

/** 틀린 문제 추가/업데이트 */
export function addWrongQuestion(
  question: StoredQuestion,
  selectedAnswer: number | null
): void {
  if (typeof window === "undefined") return;
  const id = makeId(question.date, question.question);
  const map = getWrongQuestionsMap();
  const existing = map[id];
  map[id] = {
    question,
    selectedAnswer,
    lastWrongAt: new Date().toISOString(),
    wrongCount: existing ? existing.wrongCount + 1 : 1,
    id,
  };
  localStorage.setItem(WRONG_QUESTIONS_KEY, JSON.stringify(map));
}

/** 정답을 맞힌 문제를 틀린 목록에서 제거 */
export function removeCorrectQuestion(question: StoredQuestion): void {
  if (typeof window === "undefined") return;
  const id = makeId(question.date, question.question);
  const map = getWrongQuestionsMap();
  if (map[id]) {
    delete map[id];
    localStorage.setItem(WRONG_QUESTIONS_KEY, JSON.stringify(map));
  }
}

/** 틀린 문제 전체 초기화 */
export function clearWrongQuestions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WRONG_QUESTIONS_KEY);
}

/** 틀린 문제 개수 */
export function getWrongCount(): number {
  return Object.keys(getWrongQuestionsMap()).length;
}

// ─────────────────────────────────────────────
//  히스토리 관련
// ─────────────────────────────────────────────

/** 전체 히스토리 세션 반환 (최신순) */
export function getHistorySessions(): HistorySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: HistorySession[] = raw ? JSON.parse(raw) : [];
    return list.sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
  } catch {
    return [];
  }
}

/** 히스토리 세션 저장 */
export function saveHistorySession(session: HistorySession): void {
  if (typeof window === "undefined") return;
  const list = getHistorySessions();
  // 최대 100개 유지
  const trimmed = [session, ...list].slice(0, 100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

/** 히스토리 전체 삭제 */
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

/** 유니크 세션 ID 생성 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
