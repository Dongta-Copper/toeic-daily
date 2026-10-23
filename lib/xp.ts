import type { Attempt } from '@/lib/situation'
import type { IeltsAttempt } from '@/lib/ielts'
import type { GapProgress } from '@/lib/gaps'

// XP is derived from practice that is already stored — nothing extra to save or sync.

export const XP_RULES = [
  { label: 'Câu Situation (viết)', xp: '10 XP, +5 nếu đúng' },
  { label: 'Câu luyện điểm yếu / ôn câu cũ', xp: '5 XP' },
  { label: 'Thẻ Gym lỗ hổng', xp: '4 XP mỗi lần luyện' },
  { label: 'Câu IELTS Reading', xp: '2 XP, +2 nếu đúng' },
  { label: 'Bài học nhanh đạt 4/5', xp: '30 XP' },
]

export const STAGES = [
  { name: 'Hạt giống', icon: '🌰', min: 0 },
  { name: 'Nảy mầm', icon: '🌱', min: 300 },
  { name: 'Cây non', icon: '🌿', min: 1000 },
  { name: 'Phân cành', icon: '🪴', min: 2500 },
  { name: 'Ra lá', icon: '🌳', min: 5000 },
  { name: 'Kết trái', icon: '🍊', min: 9000 },
]

type Lesson = { completedAt?: string; updatedAt: string }

function day(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function computeXp(attempts: Attempt[], ielts: IeltsAttempt[], gap: GapProgress[], lessons: Lesson[], now = Date.now()) {
  const events: { at: string; xp: number }[] = []
  for (const a of attempts) {
    const daily = !a.source || a.source === 'daily'
    events.push({ at: a.at, xp: daily ? 10 + (a.verdict === 'correct' ? 5 : 0) : 5 })
  }
  for (const a of ielts) events.push({ at: a.at, xp: a.total * 2 + a.score * 2 })
  // Gym progress keeps only a review count, dated by its last update.
  for (const p of gap) events.push({ at: p.updatedAt, xp: p.reviews * 4 })
  for (const l of lessons) if (l.completedAt) events.push({ at: l.completedAt, xp: 30 })

  const total = events.reduce((n, e) => n + e.xp, 0)
  const today = day(new Date(now).toISOString())
  const todayXp = events.filter((e) => day(e.at) === today).reduce((n, e) => n + e.xp, 0)

  const idx = STAGES.reduce((k, s, i) => (total >= s.min ? i : k), 0)
  const stage = STAGES[idx]
  const next = STAGES[idx + 1]
  const pct = next ? Math.round(((total - stage.min) / (next.min - stage.min)) * 100) : 100

  return { total, todayXp, stage, next, pct, stageIndex: idx }
}
