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

// Sessions are kept in the browser as well as on the server, so nothing is lost if the server store fails.
// 'toeic_history' is the key used before sessions moved to Vercel KV (May 2026).
const LOCAL_KEY = 'toeic_sessions_local'
const LEGACY_KEY = 'toeic_history'

function readLocal(key: string): Session[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

function writeLocal(sessions: Session[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(sessions.slice(0, 500)))
  } catch {}
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
  writeLocal([session, ...readLocal(LOCAL_KEY)])
  try {
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
  } catch {}
}

export async function getSessions(): Promise<Session[]> {
  const local = [...readLocal(LOCAL_KEY), ...readLocal(LEGACY_KEY)]
  let remote: Session[] = []
  let serverOk = false
  try {
    const res = await fetch('/api/sessions', { cache: 'no-store' })
    if (res.ok) {
      remote = await res.json()
      serverOk = true
    }
  } catch {}

  const byId = new Map<number, Session>()
  for (const s of [...local, ...remote]) byId.set(s.id, s)
  const all = Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Upload sessions the server does not have yet (e.g. saved while the store was down).
  const remoteIds = new Set(remote.map((s) => s.id))
  const missing = all.filter((s) => !remoteIds.has(s.id))
  if (serverOk && missing.length) {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missing),
    }).catch(() => {})
  }
  writeLocal(all)
  return all
}

export async function clearSessions(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {}
  await fetch('/api/sessions', { method: 'DELETE' })
}
