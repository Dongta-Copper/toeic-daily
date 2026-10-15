'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { getProgress, todayDayNumber, type ProgressMap } from '@/lib/situation'

type DaySummary = { day: number; date: string; topics: string[] }

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function SituationDayList({ days }: { days: DaySummary[] }) {
  const [progress, setProgress] = useState<ProgressMap>({})
  const [today, setToday] = useState<number | null>(null)

  useEffect(() => {
    getProgress().then((p) => {
      setProgress(p)
      setToday(todayDayNumber(days))
    })
  }, [days])

  const done = days.filter((d) => progress[d.day]).length
  const todayInfo = days.find((d) => d.day === today)

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 w-full">
      <div className="mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Practice Situation</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">Mỗi ngày 10 câu</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Đọc câu tiếng Việt, tự viết lại bằng tiếng Anh, rồi so với câu mẫu. 4 câu công việc, 4 câu giao tiếp và 2 câu kiểu IELTS.
        </p>
      </div>

      <div className="mb-8">
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
          className="group flex items-center justify-between p-6 mb-8 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Hôm nay · {formatDate(todayInfo.date)}</p>
            <p className="text-lg font-medium">Ngày {todayInfo.day}{progress[todayInfo.day] ? ' — đã xong, ôn lại' : ''}</p>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      )}

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
                {p && (
                  <span className="flex items-center gap-1 text-xs text-green-600 tabular-nums">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {p.remembered}/{p.total}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed truncate">{d.topics.join(' · ')}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
