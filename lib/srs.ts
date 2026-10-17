import { ERROR_TYPES, getAttempts, type Sentence } from '@/lib/situation'

// ─── Spaced repetition (Leitner boxes) ────────────────────────────────────────
// A sentence answered wrongly (or marked "Cần ôn") enters box 0 and comes back tomorrow.
// Each correct review moves it up a box (1 → 3 → 7 → 14 → 30 days); a wrong review sends it back to box 0.
// After a correct answer in the last box the sentence counts as mastered.

export const INTERVALS = [1, 3, 7, 14, 30]
export const DAILY_LIMIT = 20

export type ReviewItem = {
  id: string // sentence id
  vietnamese: string
  english: string
  level: string
  notes: string
  focus?: string
  box: number // 0..INTERVALS.length-1
  due: string // YYYY-MM-DD (local)
  status: 'active' | 'mastered' | 'removed'
  reviews: number
  lapses: number
  addedAt: string
  updatedAt: string
}

export function localDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Storage: browser copy + server (Vercel KV), merged by updatedAt ─────────

const LOCAL_KEY = 'situation_srs'

function readLocal(): ReviewItem[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocal(items: ReviewItem[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
  } catch {}
}

function mergeNewest(lists: ReviewItem[][]): Map<string, ReviewItem> {
  const byId = new Map<string, ReviewItem>()
  for (const list of lists)
    for (const it of list) {
      const prev = byId.get(it.id)
      if (!prev || it.updatedAt > prev.updatedAt) byId.set(it.id, it)
    }
  return byId
}

function upload(items: ReviewItem[]) {
  if (!items.length) return
  fetch('/api/situation-srs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  }).catch(() => {})
}

export async function getReviewItems(): Promise<ReviewItem[]> {
  const local = readLocal()
  let remote: ReviewItem[] | null = null
  try {
    const res = await fetch('/api/situation-srs', { cache: 'no-store' })
    if (res.ok) remote = await res.json()
  } catch {}

  const merged = mergeNewest([local, remote ?? []])
  const all = Array.from(merged.values())
  writeLocal(all)
  if (remote) {
    const remoteMap = new Map(remote.map((r) => [r.id, r.updatedAt]))
    upload(all.filter((it) => remoteMap.get(it.id) !== it.updatedAt))
  }
  return all
}

/**
 * Review items plus any past mistake (from the attempt history) that is not in the queue yet —
 * covers mistakes made before the review queue existed. Those are due today.
 */
export async function loadReviewItems(): Promise<ReviewItem[]> {
  const [items, attempts] = await Promise.all([getReviewItems(), getAttempts()])
  const known = new Set(items.map((it) => it.id))
  const now = new Date().toISOString()
  const added: ReviewItem[] = []
  for (const a of attempts) {
    if (a.verdict === 'correct' || known.has(a.sentenceId)) continue
    known.add(a.sentenceId)
    added.push({
      id: a.sentenceId,
      vietnamese: a.vietnamese,
      english: a.model,
      level: '',
      notes: a.errors.map((e) => ERROR_TYPES[e.type] ?? e.type).join(', '),
      focus: a.focus,
      box: 0,
      due: localDate(),
      status: 'active',
      reviews: 0,
      lapses: 0,
      addedAt: a.at,
      updatedAt: now,
    })
  }
  if (added.length) {
    writeLocal([...items, ...added])
    upload(added)
  }
  return [...items, ...added]
}

function saveItem(item: ReviewItem) {
  const map = mergeNewest([readLocal(), [item]])
  writeLocal(Array.from(map.values()))
  upload([item])
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/** Called from daily lessons and drills: wrong answers enter the review queue. */
export function scheduleFromLesson(s: Sentence, grade: 'remembered' | 'review', focus?: string) {
  const existing = readLocal().find((it) => it.id === s.id)
  const now = new Date().toISOString()

  if (grade === 'review') {
    if (existing?.status === 'active' && existing.box === 0) return
    saveItem({
      id: s.id,
      vietnamese: s.vietnamese,
      english: s.english,
      level: s.level,
      notes: s.notes,
      focus: focus ?? existing?.focus,
      box: 0,
      due: localDate(1),
      status: 'active',
      reviews: existing?.reviews ?? 0,
      lapses: (existing?.lapses ?? 0) + (existing ? 1 : 0),
      addedAt: existing?.addedAt ?? now,
      updatedAt: now,
    })
  } else if (existing && existing.status === 'active' && existing.reviews === 0) {
    // Marked "Cần ôn" by mistake (or the AI's verdict was overridden) before any review happened.
    saveItem({ ...existing, status: 'removed', updatedAt: now })
  }
}

/** Result of a review: computed from the item as it was when the review session started. */
export function applyReview(original: ReviewItem, grade: 'remembered' | 'review'): ReviewItem {
  const now = new Date().toISOString()
  let next: ReviewItem
  if (grade === 'remembered') {
    const box = original.box + 1
    next =
      box >= INTERVALS.length
        ? { ...original, box: INTERVALS.length - 1, status: 'mastered', due: localDate(INTERVALS[INTERVALS.length - 1]) }
        : { ...original, box, status: 'active', due: localDate(INTERVALS[box]) }
  } else {
    next = { ...original, box: 0, status: 'active', due: localDate(1), lapses: original.lapses + 1 }
  }
  next = { ...next, reviews: original.reviews + 1, updatedAt: now }
  saveItem(next)
  return next
}

export function dueItems(items: ReviewItem[]): ReviewItem[] {
  const today = localDate()
  return items
    .filter((it) => it.status === 'active' && it.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box)
}
