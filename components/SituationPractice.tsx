'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, Volume2 } from 'lucide-react'
import {
  SCENARIO_META,
  compareAnswer,
  saveDayProgress,
  type Scenario,
  type Sentence,
  type SituationDay,
} from '@/lib/situation'

type Grade = 'remembered' | 'review'

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

function SentenceCard({
  s,
  grade,
  onGrade,
}: {
  s: Sentence
  grade?: Grade
  onGrade: (g: Grade) => void
}) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const result = revealed ? compareAnswer(s.english, answer) : null

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="font-medium text-gray-400 tabular-nums">
          {s.scenario}{s.number}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{s.level}</span>
        <span className="text-gray-400 truncate">{s.topic}</span>
      </div>

      <p className="text-gray-900 leading-relaxed mb-4">{s.vietnamese}</p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) setRevealed(true)
        }}
        rows={2}
        placeholder="Viết câu tiếng Anh của bạn…"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
      />

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
        >
          {answer.trim() ? 'Kiểm tra' : 'Xem câu mẫu'}
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed">
                {result!.words.map((w, i) => (
                  <span
                    key={i}
                    className={answer.trim() ? (w.matched ? 'text-green-700' : 'text-amber-600 font-medium') : 'text-gray-900'}
                  >
                    {w.text}{' '}
                  </span>
                ))}
              </p>
              <button
                onClick={() => speak(s.english)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-900 transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {answer.trim() && (
              <p className="mt-2 text-xs text-gray-500">
                Khớp <span className="font-medium text-gray-900 tabular-nums">{result!.percent}%</span> từ với câu mẫu
                <span className="text-amber-600"> · màu cam = từ bạn còn thiếu</span>
              </p>
            )}
            {s.notes && (
              <p className="mt-2 text-xs text-gray-500">
                <span className="font-medium text-gray-400 uppercase tracking-widest mr-1">Note</span>
                {s.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onGrade('remembered')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                grade === 'remembered'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" /> Nhớ rồi
            </button>
            <button
              onClick={() => onGrade('review')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                grade === 'review'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Cần ôn
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SituationPractice({
  data,
  totalDays,
  hasNext,
}: {
  data: SituationDay
  totalDays: number
  hasNext: boolean
}) {
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [saved, setSaved] = useState(false)

  const graded = Object.keys(grades).length
  const total = data.sentences.length
  const remembered = Object.values(grades).filter((g) => g === 'remembered').length

  async function handleFinish() {
    await saveDayProgress({
      day: data.day,
      completedAt: new Date().toISOString(),
      remembered,
      total,
      review: Object.entries(grades).filter(([, g]) => g === 'review').map(([id]) => id),
    })
    setSaved(true)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 w-full">
      <Link
        href="/situation"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Tất cả các ngày
      </Link>

      <div className="mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
          Ngày {data.day}/{totalDays} · {data.date.split('-').reverse().join('/')}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Practice Situation</h1>
        <p className="text-sm text-gray-500 mt-2">
          Mẹo: gõ xong bấm <kbd className="px-1 py-0.5 border border-gray-200 rounded text-xs">Ctrl</kbd> +{' '}
          <kbd className="px-1 py-0.5 border border-gray-200 rounded text-xs">Enter</kbd> để kiểm tra.
        </p>
      </div>

      <div className="space-y-12">
        {(['A', 'B', 'C'] as Scenario[]).map((sc) => {
          const items = data.sentences.filter((s) => s.scenario === sc)
          if (items.length === 0) return null
          return (
            <section key={sc}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Scenario {sc}</span>
                <span className="text-sm font-medium text-gray-900">{SCENARIO_META[sc].vi}</span>
              </div>
              <div className="space-y-4">
                {items.map((s) => (
                  <SentenceCard
                    key={s.id}
                    s={s}
                    grade={grades[s.id]}
                    onGrade={(g) => {
                      setGrades((prev) => ({ ...prev, [s.id]: g }))
                      setSaved(false)
                    }}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-14 pt-8 border-t border-gray-200">
        {saved ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">
                {remembered}<span className="text-lg font-normal text-gray-400">/{total}</span>
              </div>
              <p className="text-sm text-gray-500">câu đã nhớ · đã lưu tiến độ ngày {data.day}</p>
            </div>
            {hasNext && (
              <Link
                href={`/situation/${data.day + 1}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                Ngày {data.day + 1} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={handleFinish}
              disabled={graded < total}
              className="px-7 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Hoàn thành ngày {data.day}
            </button>
            <span className="text-xs text-gray-400 tabular-nums">{graded}/{total} câu đã tự chấm</span>
          </div>
        )}
      </div>
    </div>
  )
}
