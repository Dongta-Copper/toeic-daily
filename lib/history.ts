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

export async function saveSession(
  part: number,
  score: number,
  total: number,
  results: QuestionResult[]
): Promise<void> {
  const session: Session = {
    id: Date.now(),
    part,
    score,
    total,
    createdAt: new Date().toISOString(),
    results,
  }
  await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  })
}

export async function getSessions(): Promise<Session[]> {
  try {
    const res = await fetch('/api/sessions', { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function clearSessions(): Promise<void> {
  await fetch('/api/sessions', { method: 'DELETE' })
}
