'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, Circle, Dumbbell, Flame, PenLine, Repeat } from 'lucide-react'
import { getAttempts, getProgress, todayDayNumber, type Attempt, type ProgressMap } from '@/lib/situation'
import { TARGET_BAND, bandGT, generatedSections, ieltsAttempts, loadTests, qid, type Group, type IeltsAttempt, type Question } from '@/lib/ielts'
import { buildSummary, type Summary } from '@/lib/errorSummary'
import { clusterViews, loadGapData, todayPool } from '@/lib/gaps'
import { dueItems, getReviewItems } from '@/lib/srs'
import { XP_RULES, computeXp } from '@/lib/xp'
import { lessonProgress } from '@/components/Lessons'
import { fidicProgress } from '@/components/Fidic'

const DAY = 86400000
const ERROR_TARGET = 8 // errors per 10 sentences that marks the end of phase 1

function localKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function mondayOf(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

type Data = {
  attempts: Attempt[]
  ielts: IeltsAttempt[]
  progress: ProgressMap
  summary: Summary
  gymLeft: number
  xp: ReturnType<typeof computeXp>
  reviewDue: number
  now: number
}

// ─── Charts (inline SVG, single series each) ──────────────────────────────────

function BandChart({ points }: { points: { at: string; band: number; full: boolean; label: string }[] }) {
  const W = 560
  const H = 200
  const pad = { l: 32, r: 12, t: 12, b: 26 }
  const min = 3
  const max = 8
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r))
  const y = (b: number) => pad.t + (1 - (Math.min(max, Math.max(min, b)) - min) / (max - min)) * (H - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.band)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Band IELTS theo thời gian">
      {[4, 5, 6, 7].map((b) => (
        <g key={b}>
          <line x1={pad.l} x2={W - pad.r} y1={y(b)} y2={y(b)} stroke="#f1f5f9" />
          <text x={pad.l - 6} y={y(b) + 4} textAnchor="end" className="fill-gray-400 text-[10px]">
            {b}
          </text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={y(TARGET_BAND)} y2={y(TARGET_BAND)} stroke="#9ca3af" strokeDasharray="4 4" />
      <text x={W - pad.r} y={y(TARGET_BAND) - 5} textAnchor="end" className="fill-gray-500 text-[10px]">
        Mục tiêu {TARGET_BAND}
      </text>
      {points.length > 1 && <path d={path} fill="none" stroke="#111827" strokeWidth={2} />}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.band)} r={5} fill={p.full ? '#111827' : '#fff'} stroke="#111827" strokeWidth={2} />
          <circle cx={x(i)} cy={y(p.band)} r={12} fill="transparent">
            <title>{`${p.label}\n${new Date(p.at).toLocaleDateString('vi-VN')} · band ${p.band}${p.full ? '' : ' (ước tính)'}`}</title>
          </circle>
        </g>
      ))}
      {points.length > 0 && (
        <>
          <text x={x(0)} y={H - 6} textAnchor="start" className="fill-gray-400 text-[10px]">
            {new Date(points[0].at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
          </text>
          {points.length > 1 && (
            <text x={x(points.length - 1)} y={H - 6} textAnchor="end" className="fill-gray-400 text-[10px]">
              {new Date(points[points.length - 1].at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </text>
          )}
        </>
      )}
    </svg>
  )
}

function ErrorBars({ weeks }: { weeks: { label: string; rate: number | null; sentences: number }[] }) {
  const W = 560
  const H = 200
  const pad = { l: 28, r: 12, t: 14, b: 26 }
  const max = Math.max(ERROR_TARGET + 2, ...weeks.map((w) => w.rate ?? 0)) * 1.1
  const slot = (W - pad.l - pad.r) / weeks.length
  const bw = Math.min(36, slot - 2)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Số lỗi trên 10 câu theo tuần">
      <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} stroke="#e5e7eb" />
      <line x1={pad.l} x2={W - pad.r} y1={y(ERROR_TARGET)} y2={y(ERROR_TARGET)} stroke="#9ca3af" strokeDasharray="4 4" />
      <text x={W - pad.r} y={y(ERROR_TARGET) - 5} textAnchor="end" className="fill-gray-500 text-[10px]">
        Mục tiêu ≤ {ERROR_TARGET}
      </text>
      {weeks.map((w, i) => {
        const cx = pad.l + slot * i + slot / 2
        const v = w.rate ?? 0
        const h = y(0) - y(v)
        return (
          <g key={i}>
            {w.rate !== null && (
              <>
                <path
                  d={`M${cx - bw / 2},${y(0)} V${y(v) + Math.min(4, h)} Q${cx - bw / 2},${y(v)} ${cx - bw / 2 + 4},${y(v)} H${cx + bw / 2 - 4} Q${cx + bw / 2},${y(v)} ${cx + bw / 2},${y(v) + Math.min(4, h)} V${y(0)} Z`}
                  fill="#111827"
                />
                <text x={cx} y={y(v) - 4} textAnchor="middle" className="fill-gray-600 text-[10px]">
                  {w.rate}
                </text>
              </>
            )}
            <rect x={cx - slot / 2} y={pad.t} width={slot} height={H - pad.t - pad.b} fill="transparent">
              <title>{`Tuần ${w.label}: ${w.rate ?? '—'} lỗi/10 câu (${w.sentences} câu)`}</title>
            </rect>
            <text x={cx} y={H - 8} textAnchor="middle" className="fill-gray-400 text-[10px]">
              {w.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ActivityGrid({ days }: { days: { key: string; count: number }[] }) {
  const level = (n: number) => (n === 0 ? 'bg-gray-100' : n < 5 ? 'bg-gray-300' : n < 10 ? 'bg-gray-500' : 'bg-gray-900')
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={d.key} title={`${d.key.split('-').reverse().join('/')}: ${d.count} câu`} className={`aspect-square rounded ${level(d.count)}`} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-400">
        Ít
        {['bg-gray-100', 'bg-gray-300', 'bg-gray-500', 'bg-gray-900'].map((c) => (
          <span key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        Nhiều (≥10 câu/ngày)
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Roadmap({ days }: { days: { day: number; date: string }[] }) {
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    Promise.all([
      getAttempts(),
      ieltsAttempts.getAll(),
      getProgress(),
      loadTests(),
      generatedSections.getAll(),
      loadGapData(),
      getReviewItems(),
      lessonProgress.getAll(),
      fidicProgress.getAll(),
    ]).then(
      ([attempts, ielts, progress, tests, gen, gap, review, lessons, fidic]) => {
        const index = new Map<string, { g: Group; q: Question }>()
        for (const s of [...tests.flatMap((t) => t.sections), ...gen.map((x) => x.section)])
          for (const g of s.groups) for (const q of g.questions) index.set(qid(s.id, q.n), { g, q })
        const now = Date.now()
        const views = clusterViews(gap.clusters, gap.items, gap.progress, gap.attemptDates)
        setData({
          attempts,
          ielts,
          progress,
          summary: buildSummary(attempts, ielts, index, 30, now),
          gymLeft: todayPool(gap.items, gap.progress, views).length,
          reviewDue: dueItems(review).length,
          xp: computeXp(attempts, ielts, Array.from(gap.progress.values()), [...lessons, ...fidic.filter((p) => p.id.startsWith('topic:'))], now),
          now,
        })
      }
    )
  }, [])

  const derived = useMemo(() => {
    if (!data) return null
    const { attempts, ielts, now } = data
    const daily = attempts.filter((a) => !a.source || a.source === 'daily')

    // Errors per 10 sentences, by week (last 8 weeks)
    const thisMonday = mondayOf(new Date(now)).getTime()
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = thisMonday - (7 - i) * 7 * DAY
      const list = daily.filter((a) => {
        const t = new Date(a.at).getTime()
        return t >= start && t < start + 7 * DAY
      })
      const errors = list.reduce((n, a) => n + a.errors.length, 0)
      const d = new Date(start)
      return { label: `${d.getDate()}/${d.getMonth() + 1}`, rate: list.length ? Math.round((errors / list.length) * 100) / 10 : null, sentences: list.length }
    })
    const firstWithData = weeks.findIndex((w) => w.rate !== null)
    const shownWeeks = firstWithData < 0 ? weeks.slice(-4) : weeks.slice(Math.min(firstWithData, 4))

    // Activity: last 28 days
    const counts = new Map<string, number>()
    for (const a of attempts) counts.set(localKey(new Date(a.at)), (counts.get(localKey(new Date(a.at))) ?? 0) + 1)
    for (const a of ielts) counts.set(localKey(new Date(a.at)), (counts.get(localKey(new Date(a.at))) ?? 0) + a.total)
    const activity = Array.from({ length: 28 }, (_, i) => {
      const d = new Date(now - (27 - i) * DAY)
      return { key: localKey(d), count: counts.get(localKey(d)) ?? 0 }
    })
    let streak = 0
    for (let i = 0; ; i++) {
      const k = localKey(new Date(now - i * DAY))
      if (counts.get(k)) streak++
      else if (i > 0) break
      if (i > 365) break
    }

    // IELTS band points
    const band = [...ielts]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((a) => ({ at: a.at, band: bandGT(a.score, a.total), full: a.mode === 'full', label: a.title }))
    const ieltsResults = ielts.flatMap((a) => a.results)
    const ieltsAcc = ieltsResults.length ? Math.round((ieltsResults.filter((r) => r.correct).length / ieltsResults.length) * 100) : null
    const fullTests = ielts.filter((a) => a.mode === 'full')
    const goodFull = fullTests.filter((a) => a.score >= 32).length

    // Phases
    const errRate = data.summary.thisWeek.perTen ?? data.summary.perTen
    const startRate = weeks.find((w) => w.rate !== null)?.rate ?? errRate
    const p1 = {
      done: errRate !== null && errRate <= ERROR_TARGET && daily.length >= 50,
      pct: errRate === null ? 0 : Math.max(0, Math.min(100, Math.round(((startRate - errRate) / Math.max(0.1, startRate - ERROR_TARGET)) * 100))),
      metric: `${errRate ?? '—'} lỗi/10 câu (mục tiêu ≤ ${ERROR_TARGET})`,
    }
    const p2 = {
      done: ieltsAcc !== null && ieltsAcc >= 75 && ieltsResults.length >= 39,
      pct: ieltsAcc === null ? 0 : Math.min(100, Math.round((ieltsAcc / 75) * 100)),
      metric: ieltsAcc === null ? 'chưa làm bài IELTS nào' : `đúng ${ieltsAcc}% trên ${ieltsResults.length} câu (mục tiêu ≥ 75%)`,
    }
    const p3 = {
      done: goodFull >= 2,
      pct: Math.min(100, goodFull * 50),
      metric: `${goodFull}/2 bài thi đủ đề đạt ≥ 32/40`,
    }
    const phase = !p1.done ? 1 : !p2.done ? 2 : !p3.done ? 3 : 4

    // This week IELTS sections
    const weekStart = thisMonday
    const ieltsThisWeek = ielts.filter((a) => new Date(a.at).getTime() >= weekStart).length

    return { shownWeeks, activity, streak, band, phase, phases: [p1, p2, p3], ieltsThisWeek }
  }, [data])

  if (!data || !derived) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="h-40 bg-gray-50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const today = todayDayNumber(days)
  const todayProgress = today ? data.progress[today] : undefined
  const situationDone = todayProgress ? todayProgress.graded ?? todayProgress.total : 0
  const level = data.summary.ielts.band

  const tasks = [
    {
      icon: PenLine,
      title: today ? `Situation — Ngày ${today}` : 'Situation',
      sub: `${situationDone}/10 câu`,
      done: situationDone >= 10,
      href: today ? `/situation/${today}` : '/situation',
    },
    { icon: Dumbbell, title: 'Gym lỗ hổng', sub: data.gymLeft ? `${data.gymLeft} câu` : 'xong', done: data.gymLeft === 0, href: '/situation/cards' },
    { icon: Repeat, title: 'Ôn câu cũ', sub: data.reviewDue ? `${Math.min(20, data.reviewDue)} câu đến hạn` : 'xong', done: data.reviewDue === 0, href: '/situation/review' },
    {
      icon: BookOpen,
      title: 'IELTS Reading',
      sub: `${derived.ieltsThisWeek}/3 bài tuần này`,
      done: derived.ieltsThisWeek >= 3,
      href: '/ielts',
    },
  ]

  const PHASES = [
    { name: 'Giai đoạn 1 · Vá lỗi nền tảng', desc: 'Situation + Gym hằng ngày, tập trung 3 lỗ hổng lớn nhất.' },
    { name: 'Giai đoạn 2 · Đọc hiểu vững', desc: 'Luyện IELTS theo Section và theo dạng câu hỏi, không bấm giờ rồi có bấm giờ.' },
    { name: 'Giai đoạn 3 · Về đích 6.5', desc: 'Thi thử đủ đề 60 phút, mỗi tuần 1 đề, phân tích sau mỗi lần.' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Lộ trình của bạn</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">IELTS General {TARGET_BAND}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <span>
            Band hiện tại: <b className="text-gray-900">{level ?? '—'}</b> <span className="text-gray-400">({data.summary.ielts.bandNote})</span>
          </span>
        </div>
      </div>

      {/* Growth: XP tree + streak */}
      <section className="mb-10 p-4 sm:p-5 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-5xl leading-none select-none" aria-hidden>
            {data.xp.stage.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-base font-semibold text-gray-900">{data.xp.stage.name}</p>
              <p className="text-sm text-gray-600 tabular-nums">
                <b className="text-gray-900">{data.xp.total.toLocaleString('vi-VN')}</b> XP
                {data.xp.todayXp > 0 && <span className="text-green-700"> · +{data.xp.todayXp} hôm nay</span>}
              </p>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-900 transition-all" style={{ width: `${data.xp.pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500 tabular-nums">
              {data.xp.next
                ? `Còn ${(data.xp.next.min - data.xp.total).toLocaleString('vi-VN')} XP để lên ${data.xp.next.icon} ${data.xp.next.name}`
                : 'Đã đạt giai đoạn cao nhất 🎉'}
            </p>
          </div>
          <div className="text-center pl-2 border-l border-gray-100">
            <Flame className={`w-6 h-6 mx-auto ${derived.streak ? 'text-orange-500' : 'text-gray-300'}`} />
            <p className="text-lg font-semibold text-gray-900 tabular-nums leading-tight">{derived.streak}</p>
            <p className="text-[10px] text-gray-500">ngày liên tiếp</p>
          </div>
        </div>
        <details className="mt-3 text-xs text-gray-500">
          <summary className="cursor-pointer select-none">Cách tính XP</summary>
          <ul className="mt-2 space-y-0.5">
            {XP_RULES.map((r) => (
              <li key={r.label}>
                • {r.label}: {r.xp}
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* Today */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Hôm nay</h2>
        <div className="grid grid-cols-2 gap-3">
          {tasks.map((t) => (
            <Link key={t.title} href={t.href} className={`p-4 border rounded-lg hover:border-gray-900 transition-colors ${t.done ? 'border-gray-200 bg-gray-50' : 'border-gray-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <t.icon className={`w-5 h-5 ${t.done ? 'text-gray-300' : 'text-gray-900'}`} />
                {t.done ? <Check className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-gray-300" />}
              </div>
              <p className={`text-sm font-medium ${t.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{t.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Phases */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Lộ trình 3 giai đoạn</h2>
        <ol className="space-y-3">
          {PHASES.map((p, i) => {
            const st = derived.phases[i]
            const current = derived.phase === i + 1
            return (
              <li key={p.name} className={`p-4 rounded-lg border ${current ? 'border-gray-900' : 'border-gray-200'} ${st.done ? 'bg-gray-50' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  {st.done ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full border-2 ${current ? 'border-gray-900' : 'border-gray-300'}`} />
                  )}
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  {current && <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white">Đang ở đây</span>}
                </div>
                <p className="text-xs text-gray-500 ml-6 mb-2">{p.desc}</p>
                <div className="ml-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900" style={{ width: `${st.done ? 100 : st.pct}%` }} />
                </div>
                <p className="ml-6 mt-1 text-xs text-gray-600 tabular-nums">{st.metric}</p>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Top gaps */}
      {data.summary.top.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Lỗ hổng cần vá (80/20)</h2>
            <Link href="/summary" className="text-xs text-gray-500 hover:text-gray-900">
              Tổng kết & xuất AI →
            </Link>
          </div>
          <ul className="space-y-2">
            {data.summary.top.map((r, i) => (
              <li key={r.type} className="grid grid-cols-[1.25rem_1fr_3rem] items-center gap-3 text-sm">
                <span className="text-xs text-gray-400 tabular-nums">{i + 1}</span>
                <div>
                  <p className="text-gray-900 truncate">{r.label}</p>
                  <div className="h-2 bg-gray-100 rounded-sm mt-1">
                    <div className="h-full bg-gray-900 rounded-r-sm" style={{ width: `${r.share}%` }} />
                  </div>
                </div>
                <span className="text-right text-gray-600 tabular-nums">{r.share}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Charts */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-gray-900 mb-1">Số lỗi trên 10 câu viết, theo tuần</h2>
        <p className="text-xs text-gray-500 mb-3">Càng thấp càng tốt — đây là thước đo tiến bộ quan trọng nhất của phần viết.</p>
        <div className="p-3 border border-gray-200 rounded-lg">
          <ErrorBars weeks={derived.shownWeeks} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-sm font-medium text-gray-900 mb-1">Band IELTS Reading theo từng bài</h2>
        <p className="text-xs text-gray-500 mb-3">Chấm đặc = bài thi đủ đề · chấm rỗng = Section/dạng câu hỏi (ước tính).</p>
        <div className="p-3 border border-gray-200 rounded-lg">
          {derived.band.length ? (
            <BandChart points={derived.band} />
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">
              Chưa có bài IELTS nào. <Link href="/ielts" className="underline">Làm một Section</Link> để bắt đầu.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-900 mb-3">Mức độ luyện tập 28 ngày qua</h2>
        <div className="p-4 border border-gray-200 rounded-lg max-w-xs">
          <ActivityGrid days={derived.activity} />
        </div>
      </section>
    </div>
  )
}
