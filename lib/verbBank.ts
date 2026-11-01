// 100 written questions per verb group (public/verbbank/<group>.txt) and per-verb mastery tracking.
// Line format:  C|ctx|verb|question with ___|correct|wrong|wrong|why
//               F|ctx|verb|sentence|wrong phrase|correct phrase|why|alt1;alt2

import { createStore } from '@/lib/store'
import type { QuizQ } from '@/lib/lessons'

export const CONTEXT_LABEL: Record<string, string> = {
  E: '📧 Email',
  M: '📝 Biên bản họp',
  C: '📄 Hợp đồng / FIDIC',
  S: '🏗️ Công trường',
  I: '🎓 IELTS',
}

export type BankItem = { id: string; group: string; verb: string; ctx: string; q: QuizQ }

const cache = new Map<string, Promise<BankItem[]>>()

function parse(group: string, text: string): BankItem[] {
  const out: BankItem[] = []
  text.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || line.startsWith('#')) return
    const f = line.split('|')
    const [kind, ctx, verb] = f
    const id = `${group}:${out.length}`
    const label = CONTEXT_LABEL[ctx] ?? ''
    if (kind === 'C' && f.length >= 8) {
      out.push({ id, group, verb, ctx, q: { q: f[3], options: [f[4], f[5], f[6]], answer: 0, why: `${f[7]}  ·  ${label}` } })
    } else if (kind === 'F' && f.length >= 7) {
      const alts = f[7] ? f[7].split(';').map((s) => s.trim()).filter(Boolean) : undefined
      out.push({ id, group, verb, ctx, q: { kind: 'fix', q: `${label} · Sửa cụm gạch chân`, sentence: f[3], wrong: f[4], answer: f[5], alts, why: f[6] } })
    }
  })
  return out
}

export function loadBank(group: string): Promise<BankItem[]> {
  if (!cache.has(group)) {
    const p = fetch(`/verbbank/${group}.txt`)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((t) => parse(group, t))
    p.catch(() => cache.delete(group))
    cache.set(group, p)
  }
  return cache.get(group)!
}

// ─── Mastery: last result and counts per question, one record per group ──────

export type ItemStat = { r: number; w: number; last: 0 | 1 }
export type GroupStats = { id: string; updatedAt: string; items: Record<string, ItemStat> }
export const verbStats = createStore<GroupStats>('verb_mastery')

export type Mastery = { verb: string; total: number; answered: number; lastRight: number; level: 'new' | 'weak' | 'ok' | 'solid' }

export const LEVEL_LABEL: Record<Mastery['level'], string> = { new: 'Chưa học', weak: 'Chưa chắc', ok: 'Đang vững', solid: 'Chắc ✓' }

export function mastery(bank: BankItem[], stats: GroupStats | undefined, verb: string): Mastery {
  const items = bank.filter((b) => b.verb === verb)
  const answered = items.filter((b) => stats?.items[b.id])
  const lastRight = answered.filter((b) => stats!.items[b.id].last === 1).length
  const ratio = answered.length ? lastRight / answered.length : 0
  // "Chắc" = practised at least half of this verb's questions and the latest answers are 85%+ right.
  const level = !answered.length ? 'new' : answered.length >= Math.ceil(items.length / 2) && ratio >= 0.85 ? 'solid' : ratio >= 0.65 ? 'ok' : 'weak'
  return { verb, total: items.length, answered: answered.length, lastRight, level }
}

/** Weighted random pick: unseen and last-wrong questions first, mastered ones rarely. */
export function pickQuestions(bank: BankItem[], stats: Map<string, GroupStats>, n: number, verb?: string): BankItem[] {
  const pool = bank.filter((b) => !verb || b.verb === verb).map((b) => {
    const s = stats.get(b.group)?.items[b.id]
    const weight = !s ? 3 : s.last === 0 ? 6 : 1
    return { b, key: Math.random() ** (1 / weight) } // weighted sampling without replacement
  })
  return pool
    .sort((x, y) => y.key - x.key)
    .slice(0, n)
    .map((x) => x.b)
}

export function record(stats: GroupStats | undefined, group: string, itemId: string, ok: boolean): GroupStats {
  const items = { ...(stats?.items ?? {}) }
  const prev = items[itemId] ?? { r: 0, w: 0, last: 0 as const }
  items[itemId] = { r: prev.r + (ok ? 1 : 0), w: prev.w + (ok ? 0 : 1), last: ok ? 1 : 0 }
  return { id: group, updatedAt: new Date().toISOString(), items }
}
