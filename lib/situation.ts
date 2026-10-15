// ─── Types ────────────────────────────────────────────────────────────────────

export type Scenario = 'A' | 'B' | 'C'

export type Sentence = {
  id: string // e.g. "12A3"
  scenario: Scenario
  number: number
  english: string
  vietnamese: string
  topic: string
  level: string
  notes: string
}

export type SituationDay = {
  day: number
  date: string // YYYY-MM-DD
  sentences: Sentence[]
}

export type DayProgress = {
  day: number
  completedAt: string
  remembered: number
  total: number
  review: string[] // ids of sentences marked "Cần ôn"
}

export type ProgressMap = Record<string, DayProgress>

export const SCENARIO_META: Record<Scenario, { label: string; vi: string }> = {
  A: { label: 'Construction', vi: 'Công việc / Xây dựng' },
  B: { label: 'Communication', vi: 'Giao tiếp / Suy ngẫm' },
  C: { label: 'IELTS Synthesis', vi: 'Tổng hợp kiểu IELTS' },
}

// ─── Today → day number (local time) ──────────────────────────────────────────

export function todayDayNumber(days: { day: number; date: string }[]): number | null {
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return days.find((x) => x.date === today)?.day ?? null
}

// ─── Answer comparison ────────────────────────────────────────────────────────

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '')
}

/** Marks each word of the model sentence as matched if it appears in the user's answer. */
export function compareAnswer(model: string, answer: string) {
  const pool = new Map<string, number>()
  for (const w of answer.split(/\s+/).map(normalize).filter(Boolean)) {
    pool.set(w, (pool.get(w) ?? 0) + 1)
  }
  const words = model.split(/\s+/).map((text) => {
    const key = normalize(text)
    const left = pool.get(key) ?? 0
    if (key && left > 0) pool.set(key, left - 1)
    return { text, matched: !key || left > 0 }
  })
  const scored = words.filter((w) => normalize(w.text))
  const percent = scored.length ? Math.round((scored.filter((w) => w.matched).length / scored.length) * 100) : 0
  return { words, percent }
}

// ─── Progress (Vercel KV via API, with localStorage fallback) ─────────────────

const LOCAL_KEY = 'situation_progress'

function readLocal(): ProgressMap {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeLocal(map: ProgressMap) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map))
  } catch {}
}

export async function getProgress(): Promise<ProgressMap> {
  const local = readLocal()
  try {
    const res = await fetch('/api/situation-progress', { cache: 'no-store' })
    if (!res.ok) return local
    const remote: ProgressMap = await res.json()
    return { ...local, ...remote }
  } catch {
    return local
  }
}

export async function saveDayProgress(entry: DayProgress): Promise<void> {
  writeLocal({ ...readLocal(), [entry.day]: entry })
  try {
    await fetch('/api/situation-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  } catch {}
}
