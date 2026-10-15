'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Copy, Loader2, Sparkles } from 'lucide-react'
import { ERROR_TYPES, getAttempts, type Attempt, type WeaknessReport } from '@/lib/situation'

const PERIODS = [
  { days: 7, label: '7 ngày' },
  { days: 14, label: '14 ngày' },
  { days: 30, label: '30 ngày' },
  { days: 0, label: 'Tất cả' },
]

function csvCell(text: string): string {
  return `"${text.replace(/"/g, '""')}"`
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function toCsvRows(report: WeaknessReport, day: number, date: string): string {
  const type = { A: 'Construction', B: 'Communication', C: 'IELTS' }
  const counters = { A: 0, B: 0, C: 0 }
  return [...report.practiceSentences]
    .sort((a, b) => a.scenario.localeCompare(b.scenario))
    .map((s) => {
      const n = ++counters[s.scenario]
      return [
        day, date, s.scenario, n, type[s.scenario],
        csvCell(s.english), csvCell(s.vietnamese), csvCell(s.topic), s.level, csvCell(`Weakness focus: ${s.focus}`),
      ].join(',')
    })
    .join('\n')
}

export default function SituationReport({ lastDay, lastDate }: { lastDay: number; lastDate: string }) {
  const [all, setAll] = useState<Attempt[] | null>(null)
  const [period, setPeriod] = useState(7)
  const [report, setReport] = useState<WeaknessReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [loadedAt, setLoadedAt] = useState(0)

  useEffect(() => {
    getAttempts().then((list) => {
      setAll(list)
      setLoadedAt(Date.now())
    })
  }, [])

  const attempts = useMemo(() => {
    if (!all) return []
    if (!period) return all
    const since = loadedAt - period * 86400000
    return all.filter((a) => new Date(a.at).getTime() >= since)
  }, [all, period, loadedAt])

  const stats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of attempts) for (const e of a.errors) counts[e.type] = (counts[e.type] ?? 0) + 1
    const byType = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const correct = attempts.filter((a) => a.verdict === 'correct').length
    const avg = attempts.length ? attempts.reduce((s, a) => s + a.score, 0) / attempts.length : 0
    return { byType, correct, avg, mistakes: attempts.filter((a) => a.verdict !== 'correct') }
  }, [attempts])

  async function analyze() {
    setLoading(true)
    setError('')
    setReport(null)
    try {
      const res = await fetch('/api/situation-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReport(data)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'AI chưa phân tích được. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const csv = report ? toCsvRows(report, lastDay + 1, addDays(lastDate, 1)) : ''
  const maxCount = stats.byType[0]?.[1] ?? 1

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 w-full">
      <Link
        href="/situation"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Tất cả các ngày
      </Link>

      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Practice Situation</p>
        <h1 className="text-2xl font-semibold text-gray-900">Báo cáo điểm yếu</h1>
      </div>

      <div className="flex flex-wrap gap-1 p-0.5 bg-gray-100 rounded-md text-sm w-fit mb-8">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            onClick={() => {
              setPeriod(p.days)
              setReport(null)
            }}
            className={`px-3 py-1 rounded transition-colors ${
              period === p.days ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!all ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : attempts.length === 0 ? (
        <p className="text-sm text-gray-500">
          Chưa có bài làm nào trong khoảng thời gian này. Hãy luyện vài câu (có gõ câu trả lời và bấm Kiểm tra) rồi quay lại.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { value: attempts.length, label: 'câu đã làm' },
              { value: `${Math.round((stats.correct / attempts.length) * 100)}%`, label: 'câu đúng hoàn toàn' },
              { value: stats.avg.toFixed(1), label: 'điểm TB / 10' },
            ].map((s) => (
              <div key={s.label} className="p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900 tabular-nums">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {stats.byType.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Số lỗi theo loại</h2>
              <ul className="space-y-2">
                {stats.byType.map(([type, count]) => (
                  <li key={type} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm" title={`${ERROR_TYPES[type] ?? type}: ${count} lỗi`}>
                    <span className="text-gray-700 truncate">{ERROR_TYPES[type] ?? type}</span>
                    <div className="h-3 bg-gray-50">
                      <div className="h-full bg-gray-900 rounded-r" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-gray-500 tabular-nums text-right">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-10">
            <button
              onClick={analyze}
              disabled={loading || stats.mistakes.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'AI đang phân tích…' : 'AI phân tích điểm yếu'}
            </button>
            {stats.mistakes.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Không có câu sai trong khoảng thời gian này — rất tốt!</p>
            )}
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </section>

          {report && (
            <div className="space-y-10 mb-12">
              <p className="text-sm text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                {report.overview}
              </p>

              <section>
                <h2 className="text-sm font-medium text-gray-900 mb-4">Điểm yếu chính</h2>
                <div className="space-y-4">
                  {report.weaknesses.map((w, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">{ERROR_TYPES[w.type] ?? w.type}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{w.level}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{w.explanation}</p>
                      <ul className="space-y-1 mb-3">
                        {w.examples.map((ex, j) => (
                          <li key={j} className="text-sm">
                            <span className="text-red-600 line-through">{ex.wrong}</span>
                            <span className="text-gray-400"> → </span>
                            <span className="text-green-700">{ex.correct}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-500 leading-relaxed">💡 {w.tips}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-medium text-gray-900 mb-3">Kế hoạch tuần tới</h2>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                  {report.studyPlan.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </section>

              <section>
                <h2 className="text-sm font-medium text-gray-900 mb-1">10 câu luyện theo điểm yếu</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Muốn đưa vào nguồn học: bấm Copy, rồi dán vào cuối file <code>public/situation.csv</code> (thành ngày {lastDay + 1}).
                </p>
                <ul className="space-y-3 mb-4">
                  {report.practiceSentences.map((s, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-xs text-gray-400 mr-2">{s.scenario} · {s.level}</span>
                      <span className="text-gray-900">{s.english}</span>
                      <p className="text-xs text-gray-500">{s.vietnamese} — <i>{s.focus}</i></p>
                    </li>
                  ))}
                </ul>
                <div className="relative">
                  <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-3 overflow-x-auto max-h-48">{csv}</pre>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(csv)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      } catch {}
                    }}
                    className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:border-gray-900"
                  >
                    <Copy className="w-3 h-3" /> {copied ? 'Đã copy' : 'Copy CSV'}
                  </button>
                </div>
              </section>
            </div>
          )}

          {stats.mistakes.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-gray-900 mb-4">Các câu chưa đúng ({stats.mistakes.length})</h2>
              <ul className="space-y-4">
                {stats.mistakes.map((a) => (
                  <li key={a.id} className="text-sm border-b border-gray-100 pb-3">
                    <p className="text-xs text-gray-400 mb-1">
                      <Link href={`/situation/${a.day}`} className="hover:text-gray-900">Ngày {a.day}</Link> ·{' '}
                      {new Date(a.at).toLocaleDateString('vi-VN')} · {a.score}/10
                    </p>
                    <p className="text-gray-500">{a.vietnamese}</p>
                    <p className="text-gray-900">✎ {a.answer}</p>
                    {a.errors.map((e, i) => (
                      <p key={i} className="text-xs mt-0.5">
                        <span className="text-gray-500">{ERROR_TYPES[e.type] ?? e.type}: </span>
                        <span className="text-red-600 line-through">{e.wrong}</span>
                        <span className="text-gray-400"> → </span>
                        <span className="text-green-700">{e.correct}</span>
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
