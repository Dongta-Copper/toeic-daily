import { createStore } from '@/lib/store'
import { INTERVALS, localDate } from '@/lib/srs'
import { getAttempts, type Attempt } from '@/lib/situation'
import { generatedSections, ieltsAttempts, loadTests, qid, type IeltsAttempt, type Group, type Question } from '@/lib/ielts'

// ─── "Gap gym": practice built only from the learner's own mistakes ──────────
// Mistakes are grouped by the AI into knowledge-gap clusters ("Uncountable nouns with -s",
// "Extra preposition after a transitive verb"…). Each item is one correct chunk to learn,
// usually with the learner's own wrong sentence.

export type GapCluster = {
  id: string
  title: string // Vietnamese
  rule: string // Vietnamese, 1–3 sentences
  createdAt: string
  updatedAt: string
}

export type GapItem = {
  id: string
  clusterId: string
  kind: 'mistake' | 'neighbour' | 'paraphrase'
  correct: string // the correct chunk, e.g. "work on"
  wrong?: string // the wrong chunk, e.g. "work in"
  vietnamese: string // meaning of the correct chunk
  sentenceCorrect: string // full sentence containing `correct`
  sentenceWrong?: string // the learner's own sentence (mistake) or a typical wrong sentence, containing `errorWord`
  errorWord?: string // the wrong word(s) inside sentenceWrong
  sourceIds: string[] // attempt ids this item came from
  createdAt: string
  updatedAt: string
}

export type GapProgress = {
  id: string // item id
  box: number
  due: string
  productiveDays: string[] // distinct days with a correct *written* answer
  status: 'learning' | 'mastered'
  reviews: number
  lapses: number
  updatedAt: string
}

export const gapClusters = createStore<GapCluster>('gap_clusters')
export const gapItems = createStore<GapItem>('gap_items')
export const gapProgress = createStore<GapProgress>('gap_progress')
export const gapProcessed = createStore<{ id: string; updatedAt: string }>('gap_processed')

// Error types that are about knowledge of words and patterns (not meaning or punctuation).
export const GAP_ERROR_TYPES = new Set([
  'preposition', 'collocation', 'word_choice', 'word_form', 'plural_countable', 'article',
  'subject_verb_agreement', 'tense', 'passive', 'missing_word', 'spelling', 'word_order',
  'relative_clause', 'conditional', 'linking',
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function norm(s: string) {
  return s.toLowerCase().replace(/[.,;:!?"“”()]/g, '').replace(/[’]/g, "'").replace(/\s+/g, ' ').trim()
}

/** Stable pseudo-random number in [0, 1) from a string. */
export function hash01(s: string) {
  let h = 2166136261
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  return (h % 10000) / 10000
}

export function shuffle<T>(list: T[], seed: string): T[] {
  return list
    .map((x, i) => ({ x, k: hash01(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.x)
}

/** The correct sentence with the target chunk blanked out (for typing practice). */
export function blanked(item: GapItem) {
  const i = item.sentenceCorrect.toLowerCase().indexOf(item.correct.toLowerCase())
  if (i < 0) return item.sentenceCorrect
  return item.sentenceCorrect.slice(0, i) + '_____' + item.sentenceCorrect.slice(i + item.correct.length)
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/**
 * recognise = matching / spotting only (counts a little);
 * produce = the learner wrote the correct form without help (counts fully, 2 different days → mastered).
 */
export type Outcome = 'wrong' | 'recognise' | 'produce'

export function applyOutcome(itemId: string, prev: GapProgress | undefined, outcome: Outcome): GapProgress {
  const today = localDate()
  const now = new Date().toISOString()
  const base: GapProgress = prev ?? { id: itemId, box: 0, due: today, productiveDays: [], status: 'learning', reviews: 0, lapses: 0, updatedAt: now }
  let next: GapProgress
  if (outcome === 'wrong') {
    next = { ...base, box: 0, due: localDate(1), status: 'learning', productiveDays: [], lapses: base.lapses + 1 }
  } else if (outcome === 'recognise') {
    // Recognition alone never moves a card past box 1.
    const box = Math.max(base.box, Math.min(1, base.box + 1))
    next = { ...base, box, due: localDate(INTERVALS[0]) }
  } else {
    const box = Math.min(INTERVALS.length - 1, base.box + 1)
    const days = base.productiveDays.includes(today) ? base.productiveDays : [...base.productiveDays, today]
    next = { ...base, box, due: localDate(INTERVALS[box]), productiveDays: days, status: days.length >= 2 ? 'mastered' : 'learning' }
  }
  return { ...next, reviews: base.reviews + 1, updatedAt: now }
}

// ─── Modes ────────────────────────────────────────────────────────────────────

export type Mode = 'match' | 'spot' | 'type' | 'rewrite'

export const MODE_INFO: Record<Mode, { label: string; desc: string }> = {
  match: { label: 'Ghép cặp', desc: 'Ghép 6 cặp nhanh nhất có thể' },
  spot: { label: 'Bắt lỗi', desc: 'Chạm vào chữ sai rồi sửa' },
  type: { label: 'Gõ cụm từ', desc: 'Nhìn nghĩa, gõ đúng cụm tiếng Anh' },
  rewrite: { label: 'Sửa câu của tôi', desc: 'Viết lại câu sai bạn từng viết, AI chấm' },
}

/** Which single-card exercise suits an item at its current stage. */
export function modeFor(item: GapItem, p: GapProgress | undefined): Exclude<Mode, 'match'> {
  const box = p?.box ?? 0
  const canSpot = !!(item.sentenceWrong && item.errorWord)
  const canRewrite = item.kind === 'mistake' && !!item.sentenceWrong
  if (box === 0) return canSpot ? 'spot' : 'type'
  if (box === 1) return hash01(item.id + (p?.reviews ?? 0)) < 0.5 || !canSpot ? 'type' : 'spot'
  return canRewrite && hash01(item.id + 'r' + (p?.reviews ?? 0)) < 0.5 ? 'rewrite' : 'type'
}

// ─── Gap map ──────────────────────────────────────────────────────────────────

export type ClusterView = {
  cluster: GapCluster
  items: GapItem[]
  mastered: number
  recentErrors: number // learner's mistakes in this cluster during the last 7 days
  status: 'red' | 'yellow' | 'green'
}

export function clusterViews(
  clusters: GapCluster[],
  items: GapItem[],
  progress: Map<string, GapProgress>,
  attemptDates: Map<string, string>
): ClusterView[] {
  const weekAgo = Date.now() - 7 * 86400000
  return clusters
    .map((cluster) => {
      const its = items.filter((i) => i.clusterId === cluster.id)
      const mastered = its.filter((i) => progress.get(i.id)?.status === 'mastered').length
      const recent = new Set(
        its.flatMap((i) => i.sourceIds).filter((id) => {
          const at = attemptDates.get(id)
          return at && new Date(at).getTime() >= weekAgo
        })
      ).size
      const ratio = its.length ? mastered / its.length : 0
      const status: ClusterView['status'] = recent >= 2 || ratio < 0.4 ? 'red' : ratio >= 0.8 && recent === 0 ? 'green' : 'yellow'
      return { cluster, items: its, mastered, recentErrors: recent, status }
    })
    .filter((v) => v.items.length > 0)
    .sort((a, b) => ['red', 'yellow', 'green'].indexOf(a.status) - ['red', 'yellow', 'green'].indexOf(b.status) || b.recentErrors - a.recentErrors)
}

// ─── Daily session ────────────────────────────────────────────────────────────

export const TODAY_CAP = 30

/** Due cards + every new mistake, then extra cards from the weakest cluster; mastered cards only when due. */
export function todayPool(items: GapItem[], progress: Map<string, GapProgress>, views: ClusterView[]): GapItem[] {
  const today = localDate()
  const due = items.filter((i) => {
    const p = progress.get(i.id)
    return p && p.due <= today
  })
  const fresh = items.filter((i) => !progress.has(i.id))
  const picked = new Map<string, GapItem>()
  for (const i of [...fresh.filter((x) => x.kind === 'mistake'), ...due, ...fresh]) if (picked.size < TODAY_CAP) picked.set(i.id, i)
  const focus = views.find((v) => v.status === 'red')
  if (focus) for (const i of focus.items) if (picked.size < TODAY_CAP && progress.get(i.id)?.status !== 'mastered') picked.set(i.id, i)
  return [...picked.values()]
}

// ─── Collecting new mistakes ──────────────────────────────────────────────────

export type RawError = {
  sourceId: string
  type: string
  wrong: string
  correct: string
  explanation: string
  context: string // the learner's sentence (or the IELTS evidence)
}

/** Mistakes not yet turned into gap items: Situation errors + IELTS paraphrases the learner missed. */
export function pendingErrors(
  attempts: Attempt[],
  ielts: IeltsAttempt[],
  ieltsIndex: Map<string, { g: Group; q: Question }>,
  processed: Set<string>
): RawError[] {
  const out: RawError[] = []
  for (const a of attempts) {
    if (processed.has(a.id)) continue
    for (const e of a.errors) {
      if (!GAP_ERROR_TYPES.has(e.type) || norm(e.wrong) === norm(e.correct)) continue
      out.push({ sourceId: a.id, type: e.type, wrong: e.wrong, correct: e.correct, explanation: e.explanation, context: a.answer })
    }
  }
  for (const a of ielts)
    for (const r of a.results) {
      const id = `${a.id}:${r.qid}`
      if (r.correct || processed.has(id)) continue
      const hit = ieltsIndex.get(r.qid)
      const pair = hit?.q.paraphrase?.split('↔').map((s) => s.trim())
      if (!pair || pair.length !== 2 || !pair[0] || !pair[1]) continue
      out.push({ sourceId: id, type: 'ielts_paraphrase', wrong: pair[0], correct: pair[1], explanation: hit!.q.explanation, context: hit!.q.evidence })
    }
  return out
}

// ─── Loading & syncing ────────────────────────────────────────────────────────

export type GapData = {
  clusters: GapCluster[]
  items: GapItem[]
  progress: Map<string, GapProgress>
  attemptDates: Map<string, string> // source id → ISO date
  pending: RawError[]
}

export async function loadGapData(): Promise<GapData> {
  const [clusters, items, progress, processed, attempts, ielts, tests, generated] = await Promise.all([
    gapClusters.getAll(),
    gapItems.getAll(),
    gapProgress.getAll(),
    gapProcessed.getAll(),
    getAttempts(),
    ieltsAttempts.getAll(),
    loadTests(),
    generatedSections.getAll(),
  ])
  const index = new Map<string, { g: Group; q: Question }>()
  for (const s of [...tests.flatMap((t) => t.sections), ...generated.map((x) => x.section)])
    for (const g of s.groups) for (const q of g.questions) index.set(qid(s.id, q.n), { g, q })

  const attemptDates = new Map<string, string>()
  for (const a of attempts) attemptDates.set(a.id, a.at)
  for (const a of ielts) for (const r of a.results) attemptDates.set(`${a.id}:${r.qid}`, a.at)

  const done = new Set([...processed.map((p) => p.id), ...items.flatMap((i) => i.sourceIds)])
  return {
    clusters,
    items,
    progress: new Map(progress.map((p) => [p.id, p])),
    attemptDates,
    pending: pendingErrors(attempts, ielts, index, done),
  }
}

const BATCH = 20

/**
 * Sends pending mistakes to the AI in batches and merges the result into the gap map.
 * A mistake that repeats an existing item is merged into it, and that item goes back to box 0.
 */
export async function syncMistakes(data: GapData, onProgress: (done: number, total: number) => void): Promise<GapData> {
  let { clusters, items } = data
  const progress = new Map(data.progress)
  const total = data.pending.length
  for (let i = 0; i < total; i += BATCH) {
    const batch = data.pending.slice(i, i + BATCH)
    const res = await fetch('/api/gaps/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: batch, clusters: clusters.map(({ id, title, rule }) => ({ id, title, rule })) }),
    })
    const out = await res.json()
    if (!res.ok) throw new Error(out.error ?? 'analyze failed')

    const now = new Date().toISOString()
    const newClusters = out.clusters as GapCluster[]
    const changed: GapItem[] = []
    const resets: GapProgress[] = []
    for (const inc of out.items as GapItem[]) {
      const same = items.find((x) => norm(x.correct) === norm(inc.correct)) ?? changed.find((x) => norm(x.correct) === norm(inc.correct))
      if (!same) {
        changed.push(inc)
        continue
      }
      const merged = { ...same, sourceIds: [...new Set([...same.sourceIds, ...inc.sourceIds])], updatedAt: now }
      if (!merged.sentenceWrong && inc.sentenceWrong) Object.assign(merged, { sentenceWrong: inc.sentenceWrong, errorWord: inc.errorWord })
      const idx = changed.indexOf(same)
      if (idx >= 0) changed[idx] = merged
      else changed.push(merged)
      // The same mistake came back in real writing → learn it again.
      const p = progress.get(same.id)
      if (p && inc.kind === 'mistake') {
        const reset = { ...p, box: 0, due: localDate(), status: 'learning' as const, productiveDays: [], lapses: p.lapses + 1, updatedAt: now }
        resets.push(reset)
        progress.set(same.id, reset)
      }
    }

    clusters = [...clusters, ...newClusters]
    items = [...items.filter((x) => !changed.some((c) => c.id === x.id)), ...changed]
    if (newClusters.length) gapClusters.save(newClusters)
    if (changed.length) gapItems.save(changed)
    if (resets.length) gapProgress.save(resets)
    gapProcessed.save([...new Set(batch.map((e) => e.sourceId))].map((id) => ({ id, updatedAt: now })))
    onProgress(Math.min(i + BATCH, total), total)
  }
  return { ...data, clusters, items, progress, pending: [] }
}
