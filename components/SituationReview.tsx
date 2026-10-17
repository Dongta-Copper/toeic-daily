'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, Repeat } from 'lucide-react'
import { SentenceCard } from '@/components/SituationPractice'
import type { Sentence } from '@/lib/situation'
import {
  DAILY_LIMIT,
  INTERVALS,
  applyReview,
  dueItems,
  loadReviewItems,
  localDate,
  type ReviewItem,
} from '@/lib/srs'

type Grade = 'remembered' | 'review'

export default function SituationReview() {
  const [items, setItems] = useState<ReviewItem[] | null>(null)
  // Snapshot of today's queue, so grading a card does not reshuffle the list.
  const [queue, setQueue] = useState<ReviewItem[]>([])
  const [grades, setGrades] = useState<Record<string, Grade>>({})

  useEffect(() => {
    loadReviewItems().then((all) => {
        setItems(all)
      setQueue(dueItems(all).slice(0, DAILY_LIMIT))
    })
  }, [])

  if (!items) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      </div>
    )
  }

  const active = items.filter((it) => it.status === 'active')
  const mastered = items.filter((it) => it.status === 'mastered').length
  const totalDue = dueItems(items).length
  const nextDue = active.filter((it) => it.due > localDate()).map((it) => it.due).sort()[0]
  const done = Object.keys(grades).length
  const right = Object.values(grades).filter((g) => g === 'remembered').length

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Tất cả các ngày
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Practice Situation</p>
        <h1 className="text-2xl font-semibold text-gray-900">Ôn hôm nay</h1>
        <p className="text-sm text-gray-500 mt-2">
          Câu bạn từng sai sẽ quay lại sau {INTERVALS.join(' → ')} ngày. Đúng thì giãn ra, sai thì làm lại từ đầu.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: queue.length ? `${done}/${queue.length}` : '0', label: 'hôm nay' },
          { value: active.length, label: 'đang ôn' },
          { value: mastered, label: 'đã thuộc' },
        ].map((s) => (
          <div key={s.label} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
            <div className="text-xl sm:text-2xl font-semibold text-gray-900 tabular-nums">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {queue.length === 0 ? (
        <div className="p-6 border border-gray-200 rounded-lg text-center">
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-gray-900 font-medium">Hôm nay không còn câu nào cần ôn.</p>
          <p className="text-xs text-gray-500 mt-1">
            {nextDue ? `Lượt ôn tiếp theo: ${nextDue.split('-').reverse().join('/')}.` : 'Câu nào bạn làm sai sẽ tự được thêm vào đây.'}
          </p>
        </div>
      ) : (
        <>
          {totalDue > queue.length && (
            <p className="text-xs text-gray-500 mb-4">
              Có {totalDue} câu đến hạn — hôm nay ôn {queue.length} câu, phần còn lại để ngày mai cho nhẹ nhàng.
            </p>
          )}
          <div className="space-y-4">
            {queue.map((it, i) => {
              const s: Sentence = {
                id: it.id,
                scenario: 'A',
                number: i + 1,
                english: it.english,
                vietnamese: it.vietnamese,
                topic: '',
                level: it.level || '—',
                notes: it.notes,
              }
              const g = grades[it.id]
              return (
                <SentenceCard
                  key={it.id}
                  s={s}
                  day={0}
                  label={`${i + 1}. Ôn tập · bậc ${it.box + 1}/${INTERVALS.length}`}
                  focus={it.focus}
                  source="review"
                  grade={g}
                  onGrade={(grade) => {
                    setGrades((prev) => ({ ...prev, [it.id]: grade }))
                    const next = applyReview(it, grade)
                    setItems((prev) => prev && prev.map((x) => (x.id === it.id ? next : x)))
                  }}
                />
              )
            })}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-500">
            <Repeat className="w-4 h-4" />
            {done < queue.length
              ? `Đã ôn ${done}/${queue.length} câu`
              : `Xong! ${right}/${queue.length} câu đúng. Câu sai sẽ quay lại vào ngày mai.`}
          </div>
        </>
      )}
    </div>
  )
}
