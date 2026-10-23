'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, GraduationCap, RotateCcw, Volume2, X } from 'lucide-react'
import { createStore } from '@/lib/store'
import { LESSONS, lessonFor, type Lesson } from '@/lib/lessons'
import { getAttempts } from '@/lib/situation'

export type LessonProgress = { id: string; updatedAt: string; bestScore: number; attempts: number; completedAt?: string }
export const lessonProgress = createStore<LessonProgress>('lesson_progress')

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

/** Error counts per type over the last 30 days of daily writing, to recommend lessons. */
async function recentErrorCounts(): Promise<Record<string, number>> {
  const since = Date.now() - 30 * 86400000
  const counts: Record<string, number> = {}
  for (const a of await getAttempts()) {
    if ((a.source && a.source !== 'daily') || new Date(a.at).getTime() < since) continue
    for (const e of a.errors) counts[e.type] = (counts[e.type] ?? 0) + 1
  }
  return counts
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function LessonList() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map())

  useEffect(() => {
    Promise.all([recentErrorCounts(), lessonProgress.getAll()]).then(([c, p]) => {
      setCounts(c)
      setProgress(new Map(p.map((x) => [x.id, x])))
    })
  }, [])

  const ordered = useMemo(() => [...LESSONS].sort((a, b) => (counts?.[b.type] ?? 0) - (counts?.[a.type] ?? 0)), [counts])
  const maxCount = Math.max(1, ...Object.values(counts ?? {}))

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Practice Situation
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
        <GraduationCap className="w-6 h-6" /> Bài học nhanh
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Mỗi bài 2–3 phút: quy tắc → ví dụ công trường → lỗi người Việt hay mắc → kiểm tra 5 câu. Xếp theo số lỗi của bạn trong 30 ngày.</p>

      {!counts ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : (
        <ul className="space-y-2">
          {ordered.map((l) => {
            const n = counts[l.type] ?? 0
            const p = progress.get(l.type)
            return (
              <li key={l.type}>
                <Link href={`/lessons/${l.type}`} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{l.title}</span>
                      {n > 0 && n >= maxCount * 0.5 && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white">Nên học</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 tabular-nums">
                      {n ? `${n} lỗi trong 30 ngày` : 'Chưa mắc lỗi này'} · {l.minutes} phút
                      {p && ` · điểm cao nhất ${p.bestScore}/5`}
                    </p>
                  </div>
                  {p?.completedAt ? <Check className="w-4 h-4 text-green-600" /> : <ArrowRight className="w-4 h-4 text-gray-300" />}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── One lesson ───────────────────────────────────────────────────────────────

function Quiz({ lesson, onDone }: { lesson: Lesson; onDone: (score: number) => void }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const q = lesson.quiz[i]

  if (!q) {
    return (
      <div className="p-5 border border-gray-200 rounded-lg text-center">
        <p className="text-3xl font-semibold text-gray-900 tabular-nums">
          {score}/{lesson.quiz.length}
        </p>
        <p className="text-sm text-gray-500 mt-1">{score >= 4 ? 'Đạt! Bài học được đánh dấu hoàn thành.' : 'Chưa đạt 4/5 — đọc lại quy tắc rồi thử lần nữa.'}</p>
      </div>
    )
  }

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <p className="text-xs text-gray-400 mb-2 tabular-nums">
        Câu {i + 1}/{lesson.quiz.length}
      </p>
      <p className="text-lg text-gray-900 mb-4">{q.q}</p>
      <div className="grid gap-2">
        {q.options.map((o, k) => {
          let cls = 'border-gray-300 hover:border-gray-900'
          if (picked !== null) cls = k === q.answer ? 'border-green-500 bg-green-50 text-green-700' : k === picked ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-100 text-gray-400'
          return (
            <button
              key={k}
              disabled={picked !== null}
              onClick={() => {
                setPicked(k)
                if (k === q.answer) setScore((s) => s + 1)
              }}
              className={`text-left px-4 py-3 rounded-md border text-base ${cls}`}
            >
              {o}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <>
          <p className={`mt-3 text-sm ${picked === q.answer ? 'text-green-700' : 'text-red-600'}`}>
            {picked === q.answer ? '✓ ' : '✗ '}
            {q.why}
          </p>
          <button
            onClick={() => {
              const last = i === lesson.quiz.length - 1
              setI(i + 1)
              setPicked(null)
              if (last) onDone(score)
            }}
            className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md"
          >
            {i === lesson.quiz.length - 1 ? 'Xem kết quả' : 'Tiếp'}
          </button>
        </>
      )}
    </div>
  )
}

export function LessonView({ type }: { type: string }) {
  const lesson = lessonFor(type)
  const [stage, setStage] = useState<'learn' | 'quiz'>('learn')
  const [round, setRound] = useState(0)
  const [prev, setPrev] = useState<LessonProgress | undefined>()

  useEffect(() => {
    lessonProgress.getAll().then((all) => setPrev(all.find((p) => p.id === type)))
  }, [type])

  if (!lesson) return <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-gray-500">Không tìm thấy bài học.</div>

  function finish(score: number) {
    const now = new Date().toISOString()
    const next: LessonProgress = {
      id: type,
      updatedAt: now,
      attempts: (prev?.attempts ?? 0) + 1,
      bestScore: Math.max(prev?.bestScore ?? 0, score),
      completedAt: prev?.completedAt ?? (score >= 4 ? now : undefined),
    }
    lessonProgress.save([next])
    setPrev(next)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/lessons" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Bài học nhanh
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">{lesson.title}</h1>
      <p className="text-xs text-gray-500 mb-6">
        {lesson.minutes} phút{prev && ` · điểm cao nhất ${prev.bestScore}/5`}
        {prev?.completedAt && ' · ✓ đã hoàn thành'}
      </p>

      {stage === 'learn' ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Quy tắc</h2>
            <ul className="space-y-2">
              {lesson.rules.map((r, k) => (
                <li key={k} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                  <span className="text-gray-400">{k + 1}.</span>
                  {r}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Ví dụ</h2>
            <ul className="space-y-2">
              {lesson.examples.map((e, k) => (
                <li key={k} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900">{e.en}</p>
                    <button onClick={() => speak(e.en)} className="text-gray-400 hover:text-gray-900" title="Nghe">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{e.vi}</p>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Lỗi hay mắc</h2>
            <ul className="space-y-2">
              {lesson.trap.map((t, k) => (
                <li key={k} className="text-sm">
                  <p className="text-red-600">
                    <X className="inline w-3.5 h-3.5 mr-1" />
                    <span className="line-through">{t.wrong}</span>
                  </p>
                  <p className="text-green-700">
                    <Check className="inline w-3.5 h-3.5 mr-1" />
                    {t.right}
                  </p>
                  <p className="text-xs text-gray-500 ml-5">{t.why}</p>
                </li>
              ))}
            </ul>
          </section>
          <button onClick={() => setStage('quiz')} className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-lg">
            Kiểm tra 5 câu
          </button>
        </div>
      ) : (
        <>
          <Quiz key={round} lesson={lesson} onDone={finish} />
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStage('learn')} className="flex-1 py-2.5 border border-gray-300 rounded-md text-sm">
              Đọc lại quy tắc
            </button>
            <button onClick={() => setRound(round + 1)} className="flex-1 py-2.5 border border-gray-300 rounded-md text-sm flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Làm lại
            </button>
          </div>
          <Link href="/situation/cards" className="mt-4 block text-center text-sm text-gray-600 hover:text-gray-900">
            Luyện tiếp trong Gym lỗ hổng →
          </Link>
        </>
      )}
    </div>
  )
}
