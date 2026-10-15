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

// ─── AI feedback ──────────────────────────────────────────────────────────────

// Fixed list so mistakes can be counted per category in the weekly report.
export const ERROR_TYPES: Record<string, string> = {
  tense: 'Thì động từ',
  passive: 'Câu bị động',
  preposition: 'Giới từ',
  article: 'Mạo từ (a/an/the)',
  subject_verb_agreement: 'Hòa hợp chủ ngữ – động từ',
  word_form: 'Từ loại',
  word_choice: 'Chọn từ',
  collocation: 'Kết hợp từ',
  plural_countable: 'Số ít / số nhiều',
  word_order: 'Trật tự từ',
  missing_word: 'Thiếu từ',
  conditional: 'Câu điều kiện',
  relative_clause: 'Mệnh đề quan hệ',
  linking: 'Liên từ / nối câu',
  meaning: 'Sai ý so với câu gốc',
  spelling: 'Chính tả',
  punctuation: 'Dấu câu',
  other: 'Khác',
}

export type Verdict = 'correct' | 'minor' | 'incorrect'

export type FeedbackError = {
  wrong: string
  correct: string
  type: string // key of ERROR_TYPES
  explanation: string
}

export type Feedback = {
  verdict: Verdict
  score: number // 0-10
  summary: string
  errors: FeedbackError[]
  corrected: string
  natural: { text: string; note: string }[]
}

export type Attempt = {
  id: string // unique per attempt
  sentenceId: string
  day: number
  vietnamese: string
  model: string
  answer: string
  verdict: Verdict
  score: number
  errors: FeedbackError[]
  at: string
}

export type WeaknessReport = {
  overview: string
  weaknesses: {
    type: string
    level: string
    explanation: string
    examples: { wrong: string; correct: string }[]
    tips: string
  }[]
  studyPlan: string[]
  practiceSentences: {
    scenario: Scenario
    english: string
    vietnamese: string
    topic: string
    level: string
    focus: string
  }[]
}

export async function requestFeedback(s: Sentence, answer: string): Promise<Feedback> {
  const res = await fetch('/api/situation-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentence: s, answer }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'feedback failed')
  return data
}

const ATTEMPTS_KEY = 'situation_attempts'

function readLocalAttempts(): Attempt[] {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export async function saveAttempt(attempt: Attempt): Promise<void> {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([attempt, ...readLocalAttempts()].slice(0, 2000)))
  } catch {}
  try {
    await fetch('/api/situation-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt),
    })
  } catch {}
}

export async function getAttempts(): Promise<Attempt[]> {
  const byId = new Map(readLocalAttempts().map((a) => [a.id, a]))
  try {
    const res = await fetch('/api/situation-attempts', { cache: 'no-store' })
    if (res.ok) for (const a of (await res.json()) as Attempt[]) byId.set(a.id, a)
  } catch {}
  return Array.from(byId.values()).sort((a, b) => b.at.localeCompare(a.at))
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
