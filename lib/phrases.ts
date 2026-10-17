import { createStore } from '@/lib/store'
import { INTERVALS, localDate } from '@/lib/srs'

// ─── Cards ────────────────────────────────────────────────────────────────────

export type PhraseCard = {
  id: string
  type: 'prep' | 'colloc' // preposition pattern or collocation
  domain: 'work' | 'ielts'
  phrase: string // e.g. "comply with"
  answer: string // the tested part; "—" means "no preposition"
  prompt: string // short front, e.g. "comply ___ the regulations"
  choices: string[] // 4 options, exactly one correct in this context
  meaning: string // Vietnamese
  example: string // sentence with the answer in [brackets]
  trap?: string // typical Vietnamese-speaker mistake
  family?: string // group, e.g. "WITH", "take", "Không giới từ"
  source?: 'builtin' | 'mistake' | 'sentence' | 'manual'
  fromAttempt?: string // attempt id a mistake card was made from
  createdAt?: string
  updatedAt: string
}

export const NONE = '—'

export const exampleText = (c: PhraseCard) => c.example.replace(/\[([^\]]+)\]/, (_, a) => (a === NONE ? '' : a)).replace(/\s{2,}/g, ' ')
export const clozeText = (c: PhraseCard) => c.example.replace(/\[[^\]]+\]/, '___')

function normalize(s: string): string {
  return s.toLowerCase().replace(/[.,!?;:"“”]/g, '').replace(/\s+/g, ' ').trim()
}

/** Typed answer check for the fill-in-the-blank mode. */
export function checkTyped(c: PhraseCard, input: string): boolean {
  const v = normalize(input)
  if (c.answer === NONE) return ['', '-', '—', 'x', '0', 'none', 'no', 'khong', 'không'].includes(v)
  return v === normalize(c.answer)
}

/** Stable shuffle (no randomness during render): order depends on the card id and review count. */
export function shuffledChoices(c: PhraseCard, salt: number): string[] {
  let h = salt + 1
  for (const ch of c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return [...c.choices]
    .map((x, i) => ({ x, k: ((h ^ (i * 2654435761)) >>> 0) % 1000 }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.x)
}

// ─── Review state ─────────────────────────────────────────────────────────────

export type PhraseState = {
  id: string // card id
  box: number
  due: string
  status: 'active' | 'mastered'
  reviews: number
  lapses: number
  addedAt: string
  updatedAt: string
}

export type Mode = 'choice' | 'cloze' | 'write'

/** The higher the box, the harder the exercise: recognise → recall → use. */
export function modeFor(state?: PhraseState): Mode {
  const box = state?.box ?? 0
  if (box <= 1) return 'choice'
  if (box <= 3) return 'cloze'
  return 'write'
}

export const MODE_LABEL: Record<Mode, string> = {
  choice: 'Chọn nhanh',
  cloze: 'Điền vào câu',
  write: 'Tự đặt câu',
}

export function applyResult(card: PhraseCard, prev: PhraseState | undefined, correct: boolean): PhraseState {
  const now = new Date().toISOString()
  const base: PhraseState = prev ?? {
    id: card.id,
    box: 0,
    due: localDate(),
    status: 'active',
    reviews: 0,
    lapses: 0,
    addedAt: now,
    updatedAt: now,
  }
  let next: PhraseState
  if (correct) {
    // A brand-new card answered correctly stays in box 0 but comes back tomorrow.
    const box = prev ? base.box + 1 : 0
    next =
      box >= INTERVALS.length
        ? { ...base, box: INTERVALS.length - 1, status: 'mastered', due: localDate(INTERVALS[INTERVALS.length - 1]) }
        : { ...base, box, status: 'active', due: localDate(INTERVALS[box]) }
  } else {
    next = { ...base, box: 0, status: 'active', due: localDate(1), lapses: base.lapses + (prev ? 1 : 0) }
  }
  return { ...next, reviews: base.reviews + 1, updatedAt: now }
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export const userCards = createStore<PhraseCard>('phrase_cards')
export const phraseStates = createStore<PhraseState>('phrase_srs')

// ─── Daily session ────────────────────────────────────────────────────────────

export const NEW_PER_DAY = 10
export const SESSION_CAP = 40

export function buildSession(cards: PhraseCard[], states: PhraseState[]) {
  const today = localDate()
  const stateById = new Map(states.map((s) => [s.id, s]))
  const cardById = new Map(cards.map((c) => [c.id, c]))

  const due = states
    .filter((s) => s.status === 'active' && s.due <= today && cardById.has(s.id))
    .sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box)
    .map((s) => cardById.get(s.id)!)

  const localDay = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const introducedToday = states.filter((s) => localDay(s.addedAt) === today).length
  const newLeft = Math.max(0, NEW_PER_DAY - introducedToday)

  // New cards: the learner's own cards first, then the built-in bank, mixing work and IELTS ~3:2.
  const unseen = cards.filter((c) => !stateById.has(c.id))
  const own = unseen.filter((c) => c.source && c.source !== 'builtin')
  const work = unseen.filter((c) => (!c.source || c.source === 'builtin') && c.domain === 'work')
  const ielts = unseen.filter((c) => (!c.source || c.source === 'builtin') && c.domain === 'ielts')
  const mixed: PhraseCard[] = []
  while (work.length || ielts.length) {
    mixed.push(...work.splice(0, 3), ...ielts.splice(0, 2))
  }
  const fresh = [...own, ...mixed].slice(0, newLeft)

  return { due, fresh, queue: [...due, ...fresh].slice(0, SESSION_CAP), newLeft, unseen: unseen.length }
}

// ─── AI helpers ───────────────────────────────────────────────────────────────

export type GenerateRequest =
  | { mode: 'errors'; errors: { wrong: string; correct: string; explanation: string; context: string; attemptId?: string }[] }
  | { mode: 'sentence'; sentence: string; vietnamese: string }
  | { mode: 'manual'; text: string }

/** Asks the AI to build cards, drops ones that duplicate existing phrases, and saves the rest. */
export async function generateCards(req: GenerateRequest, existing: PhraseCard[]): Promise<PhraseCard[]> {
  const res = await fetch('/api/phrase-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'generate failed')
  const known = new Set(existing.map((c) => c.phrase.toLowerCase().trim()))
  const cards = (data.cards as PhraseCard[]).filter((c) => !known.has(c.phrase.toLowerCase().trim()))
  if (cards.length) userCards.save(cards)
  return cards
}

export type SentenceCheck = { ok: boolean; feedback: string; corrected: string }

export async function checkOwnSentence(card: PhraseCard, sentence: string): Promise<SentenceCheck> {
  const res = await fetch('/api/phrase-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phrase: card.phrase, meaning: card.meaning, example: exampleText(card), sentence }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'check failed')
  return data
}

export async function loadBuiltinCards(): Promise<PhraseCard[]> {
  const res = await fetch('/phrases.json')
  const list = (await res.json()) as Omit<PhraseCard, 'updatedAt'>[]
  return list.map((c) => ({ ...c, source: 'builtin', updatedAt: '' }))
}
