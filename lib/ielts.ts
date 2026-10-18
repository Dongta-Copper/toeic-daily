import { createStore } from '@/lib/store'

// ─── Test data ────────────────────────────────────────────────────────────────

export type QType =
  | 'tfng'
  | 'yng'
  | 'mcq'
  | 'matching_features'
  | 'matching_headings'
  | 'matching_info'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'short_answer'

export type Option = { key: string; text: string }

export type Question = {
  n: number
  prompt?: string
  options?: Option[] // per-question options (MCQ)
  answer: string[] // accepted answers
  evidence: string // verbatim quote from the text ('' for some NOT GIVEN)
  explanation: string // Vietnamese
  paraphrase?: string
}

export type Group = {
  id: string
  type: QType
  textId: string
  instructions: string
  options?: Option[] // shared options (matching)
  template?: string // notes / summary with {n} gaps
  maxWords?: number
  questions: Question[]
}

export type Paragraph = { label?: string; heading?: string; text: string }
export type Text = { id: string; title: string; paragraphs: Paragraph[] }
export type Section = { id: string; number: 1 | 2 | 3; title: string; texts: Text[]; groups: Group[] }
export type Test = { id: string; title: string; sections: Section[] }

export const TEST_IDS = ['gt-1', 'gt-2', 'gt-3', 'gt-4', 'gt-5']

export const TYPE_LABEL: Record<QType, string> = {
  tfng: 'True / False / Not Given',
  yng: 'Yes / No / Not Given',
  mcq: 'Multiple choice',
  matching_features: 'Matching features',
  matching_headings: 'Matching headings',
  matching_info: 'Matching information',
  sentence_completion: 'Sentence completion',
  summary_completion: 'Summary completion',
  note_completion: 'Note / table completion',
  short_answer: 'Short answer',
}

export const TYPE_TIP: Record<QType, string> = {
  tfng: 'TRUE = bài nói đúng ý đó. FALSE = bài nói NGƯỢC lại. NOT GIVEN = bài không nói đến. Đừng dùng hiểu biết bên ngoài; cẩn thận với từ gần nghĩa nhưng khác thông tin (checks ≠ repairs).',
  yng: 'Giống TFNG nhưng hỏi về quan điểm của tác giả.',
  mcq: 'Đọc câu hỏi trước, tìm đoạn chứa ý, rồi loại trừ: phương án sai thường dùng đúng từ trong bài nhưng sai ý.',
  matching_features: 'Gạch chân từ khóa của từng câu, đọc lướt từng mục A, B, C… để tìm ý được diễn đạt lại. Một chữ cái có thể dùng nhiều lần.',
  matching_headings: 'Đọc câu đầu và câu cuối của đoạn để tìm ý chính. Heading phải tóm được CẢ đoạn, không chỉ một chi tiết.',
  matching_info: 'Tìm đoạn chứa MỘT chi tiết cụ thể (con số, ví dụ, lý do). Làm sau cùng vì phải quét cả bài.',
  sentence_completion: 'Chép đúng từ trong bài, không đổi dạng từ. Kiểm tra giới hạn số từ và ngữ pháp của câu sau khi điền.',
  summary_completion: 'Bản tóm tắt đi theo thứ tự của bài. Đoán trước từ loại cần điền (danh từ, tính từ…).',
  note_completion: 'Ghi chú thường theo thứ tự của bài. Chép chính xác từ, kể cả số ít/số nhiều.',
  short_answer: 'Trả lời ngắn bằng từ trong bài, không vượt giới hạn số từ.',
}

export function isChoice(t: QType) {
  return ['tfng', 'yng', 'mcq', 'matching_features', 'matching_headings', 'matching_info'].includes(t)
}

export function choicesFor(g: Group, q: Question): Option[] {
  if (g.type === 'tfng') return ['TRUE', 'FALSE', 'NOT GIVEN'].map((k) => ({ key: k, text: k }))
  if (g.type === 'yng') return ['YES', 'NO', 'NOT GIVEN'].map((k) => ({ key: k, text: k }))
  return q.options ?? g.options ?? []
}

// ─── Grading ──────────────────────────────────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/[.,;:!?"“”'’()]/g, '').replace(/\s+/g, ' ').trim()
}

export function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

export function isCorrect(g: Group, q: Question, input: string | undefined): boolean {
  if (!input?.trim()) return false
  if (isChoice(g.type)) return q.answer.some((a) => a.toLowerCase() === input.trim().toLowerCase())
  if (g.maxWords && wordCount(input) > g.maxWords) return false
  const v = normalize(input).replace(/^(a|an|the) /, '')
  return q.answer.some((a) => {
    const n = normalize(a)
    return v === n || v === n.replace(/^(a|an|the) /, '')
  })
}

/** Approximate General Training Reading conversion (raw score out of 40). */
export function bandGT(raw: number, total = 40): number {
  const r = total === 40 ? raw : Math.round((raw / total) * 40)
  const table: [number, number][] = [
    [40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [8, 3], [5, 2.5],
  ]
  for (const [min, band] of table) if (r >= min) return band
  return 2
}

export const TARGET_BAND = 6.5

// ─── Practice papers (a full test, one section, or one question type) ─────────

export type Part = { section: Section; groups: Group[] }
export type Paper = { key: string; title: string; mode: 'full' | 'section' | 'type'; parts: Part[]; minutes: number }

export const qid = (sectionId: string, n: number) => `${sectionId}#${n}`

export function fullPaper(test: Test): Paper {
  return { key: test.id, title: test.title, mode: 'full', parts: test.sections.map((s) => ({ section: s, groups: s.groups })), minutes: 60 }
}

export function sectionPaper(section: Section, testTitle: string): Paper {
  return { key: section.id, title: `${testTitle} · ${section.title}`, mode: 'section', parts: [{ section, groups: section.groups }], minutes: 20 }
}

export function typePaper(type: QType, sections: Section[], done: Set<string>, limit = 3): Paper {
  // Prefer groups not attempted yet; then the rest.
  const candidates = sections.flatMap((s) => s.groups.filter((g) => g.type === type).map((g) => ({ s, g })))
  const fresh = candidates.filter(({ s, g }) => !g.questions.every((q) => done.has(qid(s.id, q.n))))
  const pick = [...fresh, ...candidates.filter((c) => !fresh.includes(c))].slice(0, limit)
  const parts: Part[] = []
  for (const { s, g } of pick) {
    const existing = parts.find((p) => p.section.id === s.id)
    if (existing) existing.groups.push(g)
    else parts.push({ section: s, groups: [g] })
  }
  const count = pick.reduce((n, { g }) => n + g.questions.length, 0)
  return { key: `type-${type}`, title: TYPE_LABEL[type], mode: 'type', parts, minutes: Math.max(5, Math.round(count * 1.5)) }
}

// ─── Results ──────────────────────────────────────────────────────────────────

export type QResult = { qid: string; type: QType; answer: string; correct: boolean }

export type IeltsAttempt = {
  id: string
  updatedAt: string
  at: string
  paperKey: string
  title: string
  mode: Paper['mode']
  timed: boolean
  durationSec: number
  score: number
  total: number
  results: QResult[]
}

export type IeltsAnalysis = {
  overview: string
  weaknesses: { type: string; level: string; pattern: string; strategy: string }[]
  plan: string[]
}

export type GeneratedSection ={ id: string; updatedAt: string; createdAt: string; section: Section }

export const ieltsAttempts = createStore<IeltsAttempt>('ielts_attempts')
export const generatedSections = createStore<GeneratedSection>('ielts_generated')

export async function loadTests(): Promise<Test[]> {
  return Promise.all(TEST_IDS.map((id) => fetch(`/ielts/${id}.json`).then((r) => r.json() as Promise<Test>)))
}

// ─── Validation (used for the built-in tests and for AI-generated sections) ───

export function validateSection(section: Section): string[] {
  const problems: string[] = []
  const texts = new Map(section.texts.map((t) => [t.id, t.paragraphs.map((p) => `${p.heading ?? ''} ${p.text}`).join(' ')]))
  for (const g of section.groups ?? []) {
    const text = texts.get(g.textId)
    if (!text) problems.push(`group ${g.id}: textId "${g.textId}" does not exist`)
    if (!TYPE_LABEL[g.type]) problems.push(`group ${g.id}: unknown type ${g.type}`)
    for (const q of g.questions ?? []) {
      const w = `Q${q.n}`
      if (!q.answer?.length) problems.push(`${w}: no answer`)
      if (q.evidence && text && !text.includes(q.evidence)) problems.push(`${w}: evidence is not a verbatim quote from the text`)
      if (!q.evidence && !q.answer?.includes('NOT GIVEN')) problems.push(`${w}: missing evidence`)
      if (isChoice(g.type)) {
        const keys = choicesFor(g, q).map((o) => o.key)
        if (!q.answer?.every((a) => keys.includes(a))) problems.push(`${w}: answer not among the options`)
      } else {
        if (g.template && !g.template.includes(`{${q.n}}`)) problems.push(`${w}: gap {${q.n}} missing from template`)
        if (!g.template && !q.prompt) problems.push(`${w}: no prompt`)
        for (const a of q.answer ?? []) if (g.maxWords && wordCount(a) > g.maxWords) problems.push(`${w}: answer exceeds word limit`)
        if (text && q.answer?.[0] && !text.toLowerCase().includes(q.answer[0].toLowerCase()))
          problems.push(`${w}: answer "${q.answer[0]}" does not appear in the text`)
      }
    }
  }
  return problems
}
