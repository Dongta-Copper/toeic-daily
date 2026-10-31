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
  graded?: number // sentences graded so far (the day is complete when graded === total)
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
  source?: 'daily' | 'drill' | 'review'
  focus?: string // ERROR_TYPES key practised in a drill
  feedback?: Pick<Feedback, 'summary' | 'corrected' | 'natural'> // kept so a graded card can be shown again
}

/** Rebuilds the AI feedback shown on a card from a saved attempt. */
export function feedbackFromAttempt(a: Attempt): Feedback {
  return {
    verdict: a.verdict,
    score: a.score,
    errors: a.errors,
    summary: a.feedback?.summary ?? '',
    corrected: a.feedback?.corrected ?? '',
    natural: a.feedback?.natural ?? [],
  }
}

// ─── Self-check against the model sentence (no AI) ───────────────────────────

export const VERDICT_SCORE: Record<Verdict, number> = { correct: 10, minor: 7, incorrect: 4 }

/** Error types offered as one-tap tags when self-checking (most frequent first). */
export const SELF_TAGS = [
  'word_choice', 'collocation', 'word_form', 'article', 'preposition', 'tense', 'plural_countable',
  'subject_verb_agreement', 'passive', 'word_order', 'missing_word', 'meaning', 'spelling',
] as const

/** Builds the stored result of a self-check: verdict, tagged error types and an optional wrong → right phrase. */
export function selfFeedback(s: Sentence, verdict: Verdict, tags: string[], pair?: { wrong: string; correct: string }): Feedback {
  const types = verdict === 'correct' ? [] : tags.length ? tags : ['other']
  const errors: FeedbackError[] = types.map((type, i) => ({
    type,
    wrong: i === 0 && pair?.wrong.trim() ? pair.wrong.trim() : '',
    correct: i === 0 && pair?.correct.trim() ? pair.correct.trim() : '',
    explanation: 'Tự đánh dấu khi so với câu mẫu',
  }))
  return {
    verdict,
    score: VERDICT_SCORE[verdict],
    summary: verdict === 'correct' ? 'Tự chấm: đúng.' : `Tự chấm: ${types.map((t) => ERROR_TYPES[t] ?? t).join(', ')}.`,
    errors,
    corrected: s.english,
    natural: [],
  }
}

/** Word-level comparison of the learner's sentence with the model (longest common subsequence). */
export function wordDiff(answer: string, model: string): { text: string; kind: 'same' | 'mine' | 'model' }[] {
  const tok = (x: string) => x.trim().split(/\s+/).filter(Boolean)
  const key = (w: string) => w.toLowerCase().replace(/[.,!?;:"'()]/g, '')
  const a = tok(answer)
  const b = tok(model)
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = key(a[i]) === key(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const out: { text: string; kind: 'same' | 'mine' | 'model' }[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && key(a[i]) === key(b[j])) {
      out.push({ text: a[i], kind: 'same' })
      i++
      j++
    } else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) out.push({ text: b[j++], kind: 'model' })
    else out.push({ text: a[i++], kind: 'mine' })
  }
  return out
}

/** Markdown for a day's sentences, ready to paste into any AI for detailed feedback (also exported as Word). */
export function dayForAI(day: SituationDay, answers: Record<string, string>, results: Record<string, Feedback | undefined>): string {
  const lines = [
    `# Bài dịch Practice Situation – Ngày ${day.day} (${day.date.split('-').reverse().join('/')})`,
    '',
    '## Yêu cầu cho AI',
    'Bạn là giáo viên tiếng Anh cho một kỹ sư quản lý dự án xây dựng người Việt (mục tiêu IELTS General 6.5, viết email/biên bản/thư hợp đồng FIDIC).',
    'Với MỖI câu bên dưới, hãy:',
    '- Chấm: Đúng / Gần đúng / Sai, điểm /10.',
    '- Liệt kê từng lỗi: cụm sai → cụm đúng, loại lỗi (thì, mạo từ, giới từ, từ loại, chọn từ, kết hợp từ, số ít/nhiều…), giải thích ngắn bằng tiếng Việt.',
    '- Viết lại câu đúng giữ ý của tôi, và 1 cách nói tự nhiên hơn nếu có.',
    'Cuối cùng: tổng kết 3 lỗi tôi hay mắc nhất trong bài này và 3 cụm từ nên học thuộc.',
    '',
    '## Các câu',
  ]
  day.sentences.forEach((s, i) => {
    const r = results[s.id]
    lines.push(
      '',
      `### Câu ${i + 1} (${s.scenario}${s.number} · ${s.topic})`,
      `- **Tiếng Việt:** ${s.vietnamese}`,
      `- **Câu tôi viết:** ${answers[s.id]?.trim() || '(chưa làm)'}`,
      `- **Câu mẫu:** ${s.english}`
    )
    if (s.notes) lines.push(`- **Ghi chú:** ${s.notes}`)
    if (r) lines.push(`- **Tôi tự chấm:** ${r.summary}`)
  })
  return lines.join('\n')
}

// Unsent answers are kept in the browser so nothing typed is lost when leaving the page.
const draftKey = (day: number) => `situation_draft_${day}`

export function readDrafts(day: number): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(draftKey(day)) ?? '{}')
  } catch {
    return {}
  }
}

export function writeDraft(day: number, id: string, text: string) {
  try {
    const d = readDrafts(day)
    if (text.trim()) d[id] = text
    else delete d[id]
    localStorage.setItem(draftKey(day), JSON.stringify(d))
  } catch {}
}

export type SavedReport = {
  id: string
  createdAt: string
  periodDays: number // 0 = all time
  attemptsCount: number
  report: WeaknessReport
}

export type DrillItem = {
  kind: 'translate' | 'fix' | 'redo'
  vietnamese: string
  wrong?: string // sentence with the target error (fix) or the learner's earlier answer (redo)
  english: string // model answer
  hint: string
  level: string
}

export type DrillSet = {
  focus: string
  rule: string
  examples: { wrong: string; correct: string }[]
  items: DrillItem[]
  createdAt: string
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

// ─── Saved weakness reports ───────────────────────────────────────────────────

const REPORTS_KEY = 'situation_reports'

function readLocalReports(): SavedReport[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export async function saveReport(saved: SavedReport): Promise<void> {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify([saved, ...readLocalReports()].slice(0, 20)))
  } catch {}
  try {
    await fetch('/api/situation-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    })
  } catch {}
}

/**
 * Merges what the browser holds with what the server holds, keeps the merged list in the browser,
 * and uploads anything the server is missing (e.g. saved while the server store was down).
 * Returns null for the server part when the server store is unreachable.
 */
async function syncList<T>(url: string, local: T[], idOf: (x: T) => string): Promise<{ all: T[]; remote: T[] | null }> {
  let remote: T[] | null = null
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (res.ok) remote = await res.json()
  } catch {}

  const byId = new Map<string, T>()
  for (const x of [...local, ...(remote ?? [])]) byId.set(idOf(x), x)
  const all = Array.from(byId.values())

  if (remote) {
    const remoteIds = new Set(remote.map(idOf))
    const missing = all.filter((x) => !remoteIds.has(idOf(x)))
    if (missing.length) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missing),
      }).catch(() => {})
    }
  }
  return { all, remote }
}

export async function getSavedReports(): Promise<SavedReport[]> {
  const { all } = await syncList('/api/situation-reports', readLocalReports(), (r) => r.id)
  const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(sorted.slice(0, 20)))
  } catch {}
  return sorted
}

export async function getAttempts(): Promise<Attempt[]> {
  const { all } = await syncList('/api/situation-attempts', readLocalAttempts(), (a) => a.id)
  const sorted = all.sort((a, b) => b.at.localeCompare(a.at))
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(sorted.slice(0, 2000)))
  } catch {}
  return sorted
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
  const local = Object.values(readLocal())
  let remoteMap: ProgressMap | null = null
  try {
    const res = await fetch('/api/situation-progress', { cache: 'no-store' })
    if (res.ok) remoteMap = await res.json()
  } catch {}

  const merged: ProgressMap = {}
  for (const p of [...local, ...Object.values(remoteMap ?? {})]) {
    const prev = merged[p.day]
    if (!prev || p.completedAt > prev.completedAt) merged[p.day] = p
  }
  writeLocal(merged)

  if (remoteMap) {
    const missing = Object.values(merged).filter((p) => remoteMap[p.day]?.completedAt !== p.completedAt)
    if (missing.length) {
      fetch('/api/situation-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missing),
      }).catch(() => {})
    }
  }
  return merged
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
