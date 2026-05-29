'use client'

export type Session = {
  id: number
  part: number
  score: number
  total: number
  createdAt: string
}

const KEY = 'toeic_history'

export function saveSessionLocal(part: number, score: number, total: number): void {
  const sessions = getSessionsLocal()
  const next: Session = {
    id: Date.now(),
    part,
    score,
    total,
    createdAt: new Date().toISOString(),
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
