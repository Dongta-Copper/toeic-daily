'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import {
  TARGET_BAND,
  TYPE_LABEL,
  bandGT,
  generatedSections,
  ieltsAttempts,
  loadTests,
  qid,
  type Group,
  type IeltsAnalysis,
  type IeltsAttempt,
  type QType,
  type Question,
} from '@/lib/ielts'

const ANALYSIS_KEY = 'ielts_analysis'

function readAnalysis(): { at: string; data: IeltsAnalysis } | null {
  try {
    return JSON.parse(localStorage.getItem(ANALYSIS_KEY) ?? 'null')
  } catch {
    return null
  }
}

export default function IeltsReport() {
  const [attempts, setAttempts] = useState<IeltsAttempt[] | null>(null)
  const [index, setIndex] = useState<Map<string, { g: Group; q: Question }>>(new Map())
  const [analysis, setAnalysis] = useState<{ at: string; data: IeltsAnalysis } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([ieltsAttempts.getAll(), loadTests(), generatedSections.getAll()]).then(([a, tests, gen]) => {
      const m = new Map<string, { g: Group; q: Question }>()
      for (const s of [...tests.flatMap((t) => t.sections), ...gen.map((x) => x.section)])
        for (const g of s.groups) for (const q of g.questions) m.set(qid(s.id, q.n), { g, q })
      setIndex(m)
      setAttempts(a.sort((x, y) => y.at.localeCompare(x.at)))
      setAnalysis(readAnalysis())
    })
  }, [])

  const results = useMemo(() => (attempts ?? []).flatMap((a) => a.results), [attempts])

  const byType = useMemo(() => {
    const m = new Map<QType, { right: number; total: number }>()
    for (const r of results) {
      const s = m.get(r.type) ?? { right: 0, total: 0 }
      s.total++
      if (r.correct) s.right++
      m.set(r.type, s)
    }
    return [...m.entries()].sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total)
  }, [results])

  const fullTests = (attempts ?? []).filter((a) => a.mode === 'full')

  async function analyze() {
    setBusy(true)
    setError('')
    try {
      const mistakes = results
        .filter((r) => !r.correct)
        .map((r) => {
          const hit = index.get(r.qid)
          return hit
            ? {
                type: TYPE_LABEL[r.type],
                question: hit.q.prompt ?? `(điền từ, câu ${hit.q.n})`,
                answer: r.answer,
                correct: hit.q.answer[0],
                explanation: hit.q.explanation,
              }
            : null
        })
        .filter((x) => x !== null)
      const stats = Object.fromEntries(byType.map(([t, s]) => [TYPE_LABEL[t], s]))
      const res = await fetch('/api/ielts-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, mistakes, band: fullTests[0] ? bandGT(fullTests[0].score) : null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const saved = { at: new Date().toISOString(), data: data as IeltsAnalysis }
      try {
        localStorage.setItem(ANALYSIS_KEY, JSON.stringify(saved))
      } catch {}
      setAnalysis(saved)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'AI chưa phân tích được.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/ielts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> IELTS Reading
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Báo cáo IELTS Reading</h1>

      {!attempts ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : attempts.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có bài làm nào. Hãy làm một Section hoặc một đề.</p>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-sm font-medium text-gray-900 mb-1">Tỷ lệ đúng theo dạng câu hỏi</h2>
            <p className="text-xs text-gray-500 mb-4">Mục tiêu 6.5 cần khoảng 80% ở mọi dạng. Vạch dọc = 80%.</p>
            <ul className="space-y-2.5">
              {byType.map(([t, s]) => {
                const pct = Math.round((s.right / s.total) * 100)
                return (
                  <li key={t} className="text-sm" title={`${TYPE_LABEL[t]}: ${s.right}/${s.total}`}>
                    <div className="flex justify-between mb-1">
                      <Link href={`/ielts/practice?type=${t}`} className="text-gray-800 hover:underline">
                        {TYPE_LABEL[t]}
                      </Link>
                      <span className="text-gray-500 tabular-nums">
                        {s.right}/{s.total} · {pct}%
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-gray-100 rounded-sm">
                      <div className="h-full bg-gray-900 rounded-r-sm" style={{ width: `${pct}%` }} />
                      <div className="absolute top-[-2px] bottom-[-2px] w-px bg-gray-400" style={{ left: '80%' }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="mb-10">
            <button
              onClick={analyze}
              disabled={busy || !results.some((r) => !r.correct)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? 'AI đang phân tích…' : analysis ? 'AI phân tích lại' : 'AI phân tích điểm yếu'}
            </button>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            {analysis && (
              <div className="mt-6 space-y-6">
                <p className="text-xs text-gray-500">Phân tích lúc {new Date(analysis.at).toLocaleString('vi-VN')}</p>
                <p className="text-sm text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">{analysis.data.overview}</p>
                {analysis.data.weaknesses.map((w, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">{w.type}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{w.level}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{w.pattern}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">💡 {w.strategy}</p>
                  </div>
                ))}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Kế hoạch tuần tới</h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                    {analysis.data.plan.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Lịch sử làm bài</h2>
            <ul className="divide-y divide-gray-100 border-y border-gray-100">
              {attempts.slice(0, 30).map((a) => {
                const band = bandGT(a.score, a.total)
                return (
                  <li key={a.id} className="py-3 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(a.at).toLocaleString('vi-VN')} · {Math.round(a.durationSec / 60)} phút{a.timed ? '' : ' · không bấm giờ'}
                      </p>
                    </div>
                    <span className="tabular-nums text-gray-700">
                      {a.score}/{a.total}
                    </span>
                    <span className={`w-12 text-right tabular-nums font-medium ${band >= TARGET_BAND ? 'text-green-700' : 'text-gray-900'}`}>{band}</span>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-gray-500 mt-2">Band của bài lẻ (Section, dạng câu hỏi) là ước tính nếu giữ cùng tỷ lệ cho cả 40 câu.</p>
          </section>
        </>
      )}

      <Link href="/history" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900">
        Lịch sử TOEIC cũ <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
