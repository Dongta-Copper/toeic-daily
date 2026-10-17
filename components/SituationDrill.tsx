'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, Loader2, RefreshCw, Target } from 'lucide-react'
import { SentenceCard } from '@/components/SituationPractice'
import {
  ERROR_TYPES,
  getAttempts,
  getSavedReports,
  type Attempt,
  type DrillItem,
  type DrillSet,
  type SavedReport,
  type Sentence,
} from '@/lib/situation'

type Grade = 'remembered' | 'review'

const KIND_LABEL: Record<DrillItem['kind'], string> = {
  redo: 'Làm lại câu bạn từng sai',
  translate: 'Dịch sang tiếng Anh',
  fix: 'Tìm & sửa lỗi',
}

const cacheKey = (focus: string) => `situation_drill_${focus}`

function readCache(focus: string): DrillSet | null {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(focus)) ?? 'null')
  } catch {
    return null
  }
}

function writeCache(drill: DrillSet) {
  try {
    localStorage.setItem(cacheKey(drill.focus), JSON.stringify(drill))
  } catch {}
}

/** The learner's own recent mistakes of one error type (one per sentence). */
function mistakesOf(attempts: Attempt[], focus: string): Attempt[] {
  const seen = new Set<string>()
  return attempts.filter((a) => {
    if (a.verdict === 'correct' || seen.has(a.sentenceId)) return false
    if (!a.errors.some((e) => e.type === focus)) return false
    seen.add(a.sentenceId)
    return true
  })
}

export default function SituationDrill({ initialFocus, reportId }: { initialFocus?: string; reportId?: string }) {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null)
  const [saved, setSaved] = useState<SavedReport | null>(null)
  const [focus, setFocus] = useState<string | undefined>(initialFocus)
  const [drill, setDrill] = useState<DrillSet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [grades, setGrades] = useState<Record<string, Grade>>({})

  useEffect(() => {
    Promise.all([getAttempts(), getSavedReports()]).then(([list, reports]) => {
      setAttempts(list)
      const report = reports.find((r) => r.id === reportId) ?? reports[0] ?? null
      setSaved(report)
      const first = initialFocus ?? report?.report.weaknesses[0]?.type
      setFocus(first)
      if (first) setDrill(readCache(first))
    })
  }, [initialFocus, reportId])

  // Focus options: weaknesses from the AI report, otherwise the most frequent error types.
  const options = useMemo(() => {
    if (saved?.report.weaknesses.length) return saved.report.weaknesses.map((w) => w.type)
    const counts: Record<string, number> = {}
    for (const a of attempts ?? []) for (const e of a.errors) counts[e.type] = (counts[e.type] ?? 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)
  }, [saved, attempts])

  const progress = useMemo(() => {
    const out: Record<string, { done: number; correct: number }> = {}
    for (const a of attempts ?? []) {
      if (a.source !== 'drill' || !a.focus) continue
      out[a.focus] = out[a.focus] ?? { done: 0, correct: 0 }
      out[a.focus].done++
      if (a.verdict === 'correct') out[a.focus].correct++
    }
    return out
  }, [attempts])

  const weakness = saved?.report.weaknesses.find((w) => w.type === focus)
  const ownMistakes = focus && attempts ? mistakesOf(attempts, focus) : []

  const redoItems: DrillItem[] = ownMistakes.slice(0, 3).map((a) => ({
    kind: 'redo',
    vietnamese: a.vietnamese,
    wrong: a.answer,
    english: a.model,
    hint: a.errors.find((e) => e.type === focus)?.explanation ?? '',
    level: '',
  }))
  const items = drill ? [...redoItems, ...drill.items] : []

  function selectFocus(f: string) {
    setFocus(f)
    setDrill(readCache(f))
    setGrades({})
    setError('')
  }

  async function generate() {
    if (!focus) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/situation-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus,
          weakness,
          mistakes: ownMistakes.slice(0, 10).map((a) => {
            const e = a.errors.find((x) => x.type === focus)!
            return { vietnamese: a.vietnamese, answer: a.answer, wrong: e.wrong, correct: e.correct }
          }),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      writeCache(data)
      setDrill(data)
      setGrades({})
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'AI chưa tạo được bài luyện. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const graded = Object.values(grades)
  const label = focus ? ERROR_TYPES[focus] ?? focus : ''

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 w-full">
      <div className="flex items-center justify-between mb-6">
        <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Tất cả các ngày
        </Link>
        <Link href="/situation/report" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <BarChart3 className="w-3.5 h-3.5" /> Báo cáo
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Practice Situation</p>
        <h1 className="text-2xl font-semibold text-gray-900">Luyện điểm yếu</h1>
        {saved && (
          <p className="text-sm text-gray-500 mt-2">
            Theo báo cáo ngày {new Date(saved.createdAt).toLocaleDateString('vi-VN')} ({saved.attemptsCount} câu đã phân tích)
          </p>
        )}
      </div>

      {!attempts ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : options.length === 0 ? (
        <p className="text-sm text-gray-500">
          Chưa có dữ liệu điểm yếu. Hãy luyện vài ngày, rồi vào{' '}
          <Link href="/situation/report" className="underline">Báo cáo</Link> bấm <b>AI phân tích điểm yếu</b>.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
            {options.map((t) => {
              const p = progress[t]
              return (
                <button
                  key={t}
                  onClick={() => selectFocus(t)}
                  className={`text-left p-3 border rounded-lg transition-colors ${
                    focus === t ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{ERROR_TYPES[t] ?? t}</span>
                    {saved?.report.weaknesses.find((w) => w.type === t) && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {saved.report.weaknesses.find((w) => w.type === t)!.level}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 tabular-nums">
                    {p ? `Đã luyện ${p.done} câu · đúng ${Math.round((p.correct / p.done) * 100)}%` : 'Chưa luyện'}
                  </p>
                </button>
              )
            })}
          </div>

          {focus && (
            <section>
              {weakness && (
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{weakness.explanation}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button
                  onClick={generate}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : drill ? <RefreshCw className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                  {loading ? 'AI đang soạn bài…' : drill ? 'Tạo bài mới' : `Tạo bài luyện: ${label}`}
                </button>
                {drill && !loading && (
                  <span className="text-xs text-gray-400">Bài soạn lúc {new Date(drill.createdAt).toLocaleString('vi-VN')}</span>
                )}
              </div>
              {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

              {drill && (
                <>
                  <div className="p-4 mb-8 bg-gray-50 rounded-md border-l-2 border-gray-900">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Bài học nhanh · {label}</p>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{drill.rule}</p>
                    <ul className="space-y-1">
                      {drill.examples.map((ex, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-red-600 line-through">{ex.wrong}</span>
                          <span className="text-gray-400"> → </span>
                          <span className="text-green-700">{ex.correct}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    {items.map((it, i) => {
                      const s: Sentence = {
                        id: `drill-${focus}-${drill.createdAt}-${i}`,
                        scenario: 'A',
                        number: i + 1,
                        english: it.english,
                        vietnamese: it.vietnamese,
                        topic: '',
                        level: it.level || '—',
                        notes: `Luyện điểm yếu: ${label}`,
                      }
                      return (
                        <SentenceCard
                          key={s.id}
                          s={s}
                          day={0}
                          label={`${i + 1}. ${KIND_LABEL[it.kind]}`}
                          wrong={it.wrong}
                          wrongLabel={it.kind === 'redo' ? 'Lần trước bạn viết' : undefined}
                          hint={it.hint}
                          focus={focus}
                          grade={grades[s.id]}
                          onGrade={(g) => setGrades((prev) => ({ ...prev, [s.id]: g }))}
                        />
                      )
                    })}
                  </div>

                  <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-500">
                    Lượt này: <span className="font-medium text-gray-900 tabular-nums">{graded.filter((g) => g === 'remembered').length}/{items.length}</span> câu đúng
                    {graded.length === items.length && items.length > 0 && ' — bấm "Tạo bài mới" để luyện tiếp.'}
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
