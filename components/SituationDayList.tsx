'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, CheckCircle, Dumbbell, Repeat, Target } from 'lucide-react'
import { getProgress, todayDayNumber, type ProgressMap } from '@/lib/situation'
import { DAILY_LIMIT, dueItems, loadReviewItems } from '@/lib/srs'
import { clusterViews, loadGapData, todayPool } from '@/lib/gaps'

type DaySummary = { day: number; date: string; topics: string[] }

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function SituationDayList({ days }: { days: DaySummary[] }) {
  const [progress, setProgress] = useState<ProgressMap>({})
  const [today, setToday] = useState<number | null>(null)

  const [due, setDue] = useState<number | null>(null)
  const [cards, setCards] = useState<number | null>(null)

  useEffect(() => {
    getProgress().then((p) => {
      setProgress(p)
      setToday(todayDayNumber(days))
    })
    loadReviewItems().then((items) => setDue(Math.min(dueItems(items).length, DAILY_LIMIT)))
    loadGapData().then((d) =>
      setCards(todayPool(d.items, d.progress, clusterViews(d.clusters, d.items, d.progress, d.attemptDates)).length + d.pending.length)
    )
  }, [days])

  const done = days.filter((d) => { const p = progress[d.day]; return p && (p.graded ?? p.total) >= p.total }).length
  const todayInfo = days.find((d) => d.day === today)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16 w-full">
      <div className="mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Practice Situation</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Mỗi ngày 10 câu</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Đọc câu tiếng Việt, tự viết lại bằng tiếng Anh, rồi so với câu mẫu. 4 câu công việc, 4 câu giao tiếp và 2 câu kiểu IELTS.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-gray-700">Đã hoàn thành</span>
          <span className="text-sm font-medium text-gray-900 tabular-nums">{done}/{days.length} ngày</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gray-900 transition-all" style={{ width: `${(done / days.length) * 100}%` }} />
        </div>
      </div>

      {todayInfo && (
        <Link
          href={`/situation/${todayInfo.day}`}
          className="group flex items-center justify-between p-5 sm:p-6 mb-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Hôm nay · {formatDate(todayInfo.date)}</p>
            <p className="text-lg font-medium">Ngày {todayInfo.day}{progress[todayInfo.day] ? ' — đã xong, ôn lại' : ''}</p>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          {
            href: '/situation/review',
            icon: Repeat,
            title: 'Ôn hôm nay',
            sub: due === null ? '…' : due > 0 ? `${due} câu` : 'Đã xong',
            highlight: !!due,
          },
          {
            href: '/situation/cards',
            icon: Dumbbell,
            title: 'Gym lỗ hổng',
            sub: cards === null ? '…' : cards > 0 ? `${cards} thẻ` : 'Đã xong',
            highlight: !!cards,
          },
          { href: '/situation/drill', icon: Target, title: 'Luyện điểm yếu', sub: 'Theo AI', highlight: false },
          { href: '/summary', icon: BarChart3, title: 'Tổng kết lỗi', sub: '80/20 · xuất AI', highlight: false },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`p-3 sm:p-4 border rounded-lg transition-colors hover:border-gray-900 ${
              t.highlight ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
            }`}
          >
            <t.icon className={`w-5 h-5 mb-2 ${t.highlight ? 'text-amber-600' : 'text-gray-400'}`} />
            <p className="text-sm font-medium text-gray-900 leading-tight">{t.title}</p>
            <p className={`text-xs mt-0.5 tabular-nums ${t.highlight ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>{t.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {days.map((d) => {
          const p = progress[d.day]
          return (
            <Link
              key={d.day}
              href={`/situation/${d.day}`}
              className={`group p-4 border rounded-lg transition-all duration-150 hover:border-gray-900 ${
                d.day === today ? 'border-gray-900' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-gray-900">
                  Ngày {d.day} <span className="text-gray-400 font-normal">· {formatDate(d.date)}</span>
                </span>
                {p &&
                  ((p.graded ?? p.total) < p.total ? (
                    <span className="text-xs text-amber-600 tabular-nums">đang làm {p.graded}/{p.total}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600 tabular-nums">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {p.remembered}/{p.total} đúng
                    </span>
                  ))}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed truncate">{d.topics.join(' · ')}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
