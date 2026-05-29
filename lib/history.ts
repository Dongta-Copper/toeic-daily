'use client'

export type QuestionResult = {
  questionId: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  explanation: string
}

export type Session = {
  id: number
  part: number
  score: number
  total: number
  createdAt: string
  results: QuestionResult[]
}

const KEY = 'toeic_history'

export function saveSessionLocal(
  part: number,
  score: number,
  total: number,
  results: QuestionResult[]
): void {
  const sessions = getSessionsLocal()
  const next: Session = {
    id: Date.now(),
    part,
    score,
    total,
    createdAt: new Date().toISOString(),
    results,
  }
  localStorage.setItem(KEY, JSON.stringify([next, ...sessions]))
}

export function getSessionsLocal(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}
