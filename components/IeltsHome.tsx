'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BarChart3, Clock, Loader2, Sparkles, Target } from 'lucide-react'
import {
  TARGET_BAND,
  TYPE_LABEL,
  bandGT,
  generatedSections,
  ieltsAttempts,
  loadTests,
  type GeneratedSection,
  type IeltsAttempt,
  type QType,
  type Test,
} from '@/lib/ielts'

export default function IeltsHome() {
  const [tests, setTests] = useState<Test[] | null>(null)
  const [generated, setGenerated] = useState<GeneratedSection[]>([])
  const [attempts, setAttempts] = useState<IeltsAttempt[]>([])
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadTests(), generatedSections.getAll(), ieltsAttempts.getAll()]).then(([t, g, a]) => {
      setTests(t)
      setGenerated(g.sort((x, y) => y.createdAt.localeCompare(x.createdAt)))
      setAttempts(a.sort((x, y) => y.at.localeCompare(x.at)))
    })
  }, [])

  const lastByKey = useMemo(() => {
    const m = new Map<string, IeltsAttempt>()
    for (const a of attempts) if (!m.has(a.paperKey)) m.set(a.paperKey, a)
    return m
  }, [attempts])

  // Current level: latest full test, otherwise the accuracy of the last 60 answers.
  const level = useMemo(() => {
    const full = attempts.find((a) => a.mode === 'full')
    if (full) return { band: bandGT(full.score), label: `bài thi đủ đề gần nhất (${full.score}/40)` }
    const recent = attempts.flatMap((a) => a.results).slice(0, 60)
    if (recent.length < 10) return null
    const right = recent.filter((r) => r.correct).length
    return { band: bandGT(right, recent.length), label: `ước tính từ ${recent.length} câu gần nhất` }
  }, [attempts])

  const typeStats = useMemo(() => {
    const stats = new Map<QType, { right: number; total: number }>()
    for (const r of attempts.flatMap((a) => a.results)) {
      const s = stats.get(r.type) ?? { right: 0, total: 0 }
      s.total++
      if (r.correct) s.right++
      stats.set(r.type, s)
    }
    return stats
  }, [attempts])

  const availableTypes = useMemo(() => {
    const all = [...(tests ?? []).flatMap((t) => t.sections), ...generated.map((g) => g.section)]
    const count = new Map<QType, number>()
    for (const s of all) for (const g of s.groups) count.set(g.type, (count.get(g.type) ?? 0) + g.questions.length)
    return [...count.entries()].sort((a, b) => b[1] - a[1])
  }, [tests, generated])

  async function generate(number: 1 | 2 | 3) {
    setBusy(number)
    setError('')
    try {
      const res = await fetch('/api/ielts-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const now = new Date().toISOString()
      const entry: GeneratedSection = { id: data.section.id, createdAt: now, updatedAt: now, section: data.section }
      generatedSections.save([entry])
      setGenerated((g) => [entry, ...g])
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'AI chưa tạo được đề.')
    } finally {
      setBusy(null)
    }
  }

  const scoreTag = (key: string) => {
    const a = lastByKey.get(key)
    if (!a) return <span className="text-xs text-gray-400">Chưa làm</span>
    return (
      <span className={`text-xs tabular-nums ${a.score / a.total >= 0.8 ? 'text-green-700' : 'text-gray-600'}`}>
        Lần gần nhất {a.score}/{a.total}
      </span>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14 w-full">
      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">IELTS General Training</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Reading</h1>
        <p className="text-sm text-gray-500">3 sections · 40 câu · 60 phút. Mục tiêu band {TARGET_BAND} ≈ 32/40 câu đúng.</p>
      </div>

      <div className="p-5 border border-gray-200 rounded-lg mb-10 flex flex-wrap items-center gap-6">
        <div>
          <div className={`text-4xl font-semibold tabular-nums ${level && level.band >= TARGET_BAND ? 'text-green-700' : 'text-gray-900'}`}>
            {level ? level.band : '—'}
            <span className="text-lg font-normal text-gray-400"> / {TARGET_BAND}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{level ? `Band hiện tại · ${level.label}` : 'Làm một đề để biết band hiện tại'}</p>
        </div>
        <Link href="/ielts/report" className="ml-auto inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <BarChart3 className="w-4 h-4" /> Báo cáo & phân tích AI
        </Link>
      </div>

      {!tests ? (
        <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Thi thử đủ đề — 60 phút
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {tests.map((t) => (
                <Link
                  key={t.id}
                  href={`/ielts/practice?test=${t.id}`}
                  className="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-900"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    {scoreTag(t.id)}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900" />
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Luyện theo Section — khoảng 20 phút</h2>
            <div className="space-y-2">
              {tests.map((t) => (
                <div key={t.id} className="grid grid-cols-3 gap-2">
                  {t.sections.map((s) => (
                    <Link key={s.id} href={`/ielts/practice?section=${s.id}`} className="p-3 border border-gray-200 rounded-lg hover:border-gray-900">
                      <p className="text-sm font-medium text-gray-900">
                        {t.title.replace('General Training — ', '').replace(/\s*\(.*\)$/, '')} · S{s.number}
                      </p>
                      {scoreTag(s.id)}
                    </Link>
                  ))}
                </div>
              ))}
              {generated.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {generated.map((g) => (
                    <Link key={g.id} href={`/ielts/practice?section=${g.section.id}`} className="p-3 border border-gray-200 rounded-lg hover:border-gray-900">
                      <p className="text-sm font-medium text-gray-900">
                        Đề AI · S{g.section.number}
                        <span className="ml-1 text-xs font-normal text-gray-400">{new Date(g.createdAt).toLocaleDateString('vi-VN')}</span>
                      </p>
                      {scoreTag(g.section.id)}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg">
              <p className="text-sm text-gray-900 font-medium flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4" /> AI soạn Section mới
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Mất khoảng 1–3 phút. Đề được kiểm tra tự động (trích dẫn đáp án phải có thật trong bài) trước khi hiện ra.
              </p>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => generate(n)}
                    disabled={busy !== null}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:border-gray-900 disabled:opacity-40"
                  >
                    {busy === n && <Loader2 className="w-4 h-4 animate-spin" />}
                    Section {n}
                  </button>
                ))}
              </div>
              {busy !== null && <p className="text-xs text-gray-500 mt-2">AI đang soạn Section {busy}… đừng đóng trang.</p>}
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Luyện theo dạng câu hỏi
            </h2>
            <ul className="divide-y divide-gray-100 border-y border-gray-100">
              {availableTypes.map(([t, count]) => {
                const s = typeStats.get(t)
                const pct = s ? Math.round((s.right / s.total) * 100) : null
                return (
                  <li key={t}>
                    <Link href={`/ielts/practice?type=${t}`} className="flex items-center gap-3 py-3 group">
                      <span className="flex-1 text-sm text-gray-900">{TYPE_LABEL[t]}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{count} câu</span>
                      <span
                        className={`w-16 text-right text-xs tabular-nums ${
                          pct === null ? 'text-gray-400' : pct >= 80 ? 'text-green-700' : pct < 60 ? 'text-red-600' : 'text-amber-700'
                        }`}
                      >
                        {pct === null ? 'chưa làm' : `đúng ${pct}%`}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
