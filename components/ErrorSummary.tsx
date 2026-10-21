'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Copy, Download, Dumbbell, Share2 } from 'lucide-react'
import { getAttempts, type Attempt } from '@/lib/situation'
import { generatedSections, ieltsAttempts, loadTests, qid, type Group, type IeltsAttempt, type Question } from '@/lib/ielts'
import { PURPOSES, TREND_LABEL, buildSummary, toMarkdown, type Purpose, type Summary } from '@/lib/errorSummary'

const WINDOWS = [
  { days: 14, label: '14 ngày' },
  { days: 30, label: '30 ngày' },
  { days: 3650, label: 'Tất cả' },
]

const TREND_CLS = { down: 'text-green-700', flat: 'text-amber-700', up: 'text-red-600', unknown: 'text-gray-400' }

export default function ErrorSummary() {
  const [raw, setRaw] = useState<{ attempts: Attempt[]; ielts: IeltsAttempt[]; index: Map<string, { g: Group; q: Question }>; at: number } | null>(null)
  const [windowDays, setWindowDays] = useState(30)
  const [purpose, setPurpose] = useState<Purpose>('diagnose')
  const [open, setOpen] = useState<string | null>(null)
  const [showText, setShowText] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([getAttempts(), ieltsAttempts.getAll(), loadTests(), generatedSections.getAll()]).then(([attempts, ielts, tests, gen]) => {
      const index = new Map<string, { g: Group; q: Question }>()
      for (const s of [...tests.flatMap((t) => t.sections), ...gen.map((x) => x.section)])
        for (const g of s.groups) for (const q of g.questions) index.set(qid(s.id, q.n), { g, q })
      setRaw({ attempts, ielts, index, at: Date.now() })
    })
  }, [])

  const summary: Summary | null = useMemo(
    () => (raw ? buildSummary(raw.attempts, raw.ielts, raw.index, windowDays, raw.at) : null),
    [raw, windowDays]
  )
  const markdown = useMemo(() => (summary ? toMarkdown(summary, purpose) : ''), [summary, purpose])
  const fileName = `ho-so-loi-tieng-anh-${new Date().toISOString().slice(0, 10)}.md`

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown)
    } catch {
      // Fallback for browsers that block the clipboard API.
      const ta = document.createElement('textarea')
      ta.value = markdown
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function download() {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  async function share() {
    const file = new File([markdown], fileName, { type: 'text/markdown' })
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Hồ sơ lỗi tiếng Anh' })
      else await navigator.share({ text: markdown, title: 'Hồ sơ lỗi tiếng Anh' })
    } catch {}
  }

  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Practice Situation
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tổng kết lỗi</h1>
        <p className="text-sm text-gray-500 mt-1">Tính từ toàn bộ câu bạn đã viết — không cần chờ AI. Xuất hồ sơ để hỏi Claude, ChatGPT, Gemini hay DeepSeek.</p>
      </div>

      <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md text-sm w-fit mb-6">
        {WINDOWS.map((w) => (
          <button
            key={w.days}
            onClick={() => setWindowDays(w.days)}
            className={`px-3 py-1.5 rounded ${windowDays === w.days ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500'}`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {!summary ? (
        <div className="h-32 bg-gray-50 rounded-lg animate-pulse" />
      ) : summary.sentences === 0 ? (
        <p className="text-sm text-gray-500">Chưa có câu nào trong khoảng thời gian này.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { v: summary.sentences, l: 'câu đã viết' },
              { v: summary.perTen, l: 'lỗi / 10 câu' },
              { v: `${summary.errorFree}%`, l: 'câu không lỗi' },
              {
                v: `${summary.lastWeek.perTen ?? '—'} → ${summary.thisWeek.perTen ?? '—'}`,
                l: 'lỗi/10 câu: tuần trước → tuần này',
              },
            ].map((x) => (
              <div key={x.l} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="text-xl sm:text-2xl font-semibold text-gray-900 tabular-nums">{x.v}</div>
                <div className="text-xs text-gray-500 mt-1">{x.l}</div>
              </div>
            ))}
          </div>

          <section className="mb-8">
            <h2 className="text-sm font-medium text-gray-900 mb-1">
              Top lỗi (80/20): {summary.top.length} loại chiếm {summary.top.reduce((n, r) => n + r.share, 0)}% tổng số lỗi
            </h2>
            <p className="text-xs text-gray-500 mb-3">Tập trung vá những lỗi này trước — phần còn lại để sau.</p>
            <div className="space-y-3">
              {summary.top.map((r, i) => (
                <div key={r.type} className="border border-gray-200 rounded-lg">
                  <button onClick={() => setOpen(open === r.type ? null : r.type)} className="w-full text-left p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="flex-1 text-sm font-medium text-gray-900">{r.label}</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{r.share}%</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open === r.type ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="mt-2 ml-9 h-2 bg-gray-100 rounded-sm">
                      <div className="h-full bg-gray-900 rounded-r-sm" style={{ width: `${r.share}%` }} />
                    </div>
                    <p className="mt-2 ml-9 text-xs text-gray-500 tabular-nums">
                      Lỗi/10 câu: {r.rateLast ?? '—'} → {r.rateThis ?? '—'} · <span className={TREND_CLS[r.trend]}>{TREND_LABEL[r.trend]}</span> · xuất hiện{' '}
                      {r.weeks} tuần
                    </p>
                    <p className="mt-1 ml-9 text-xs text-gray-600">{r.parts.map((p) => `${p.label} ${p.count}`).join(' · ')}</p>
                  </button>
                  {open === r.type && (
                    <ul className="px-4 pb-4 ml-9 space-y-3">
                      {r.examples.map((e, j) => (
                        <li key={j} className="text-sm">
                          <p className="text-gray-500">{e.vietnamese}</p>
                          <p className="text-gray-900">✎ {e.answer}</p>
                          <p className="text-xs mt-0.5">
                            <span className="text-red-600 line-through">{e.wrong}</span>
                            <span className="text-gray-400"> → </span>
                            <span className="text-green-700">{e.correct}</span>
                            <span className="text-gray-500"> — {e.explanation}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {summary.others.length > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                Ít gặp (để sau): {summary.others.map((r) => `${r.label} ${r.share}%`).join(' · ')}
              </p>
            )}
            {summary.fixed.length > 0 && <p className="mt-2 text-xs text-green-700">✓ Đã vá (không còn sai 14 ngày qua): {summary.fixed.join(', ')}</p>}
          </section>

          {summary.ielts.attempts > 0 && (
            <section className="mb-8 p-4 border border-gray-200 rounded-lg">
              <h2 className="text-sm font-medium text-gray-900 mb-2">
                IELTS Reading · band ≈ {summary.ielts.band ?? '—'} <span className="font-normal text-gray-500">({summary.ielts.bandNote})</span>
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {summary.ielts.byType.map((r) => `${r.label} ${r.pct}%`).join(' · ')}
              </p>
            </section>
          )}

          <section className="p-4 sm:p-5 border-2 border-gray-900 rounded-lg">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Xuất hồ sơ cho AI</h2>
            <p className="text-xs text-gray-500 mb-4">
              File Markdown (.md) — dán hoặc đính kèm vào Claude, ChatGPT, Gemini, DeepSeek đều đọc được. Hồ sơ gồm top lỗi, ví dụ thật có ngữ cảnh, xu hướng và một yêu cầu
              theo mục đích bạn chọn.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {(Object.keys(PURPOSES) as Purpose[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`text-left p-3 rounded-md border ${purpose === p ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <p className="text-sm font-medium text-gray-900">{PURPOSES[p].label}</p>
                  <p className="text-xs text-gray-500">{PURPOSES[p].desc}</p>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={copy} className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã copy — dán vào AI' : 'Copy'}
              </button>
              <button onClick={download} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-sm rounded-md hover:border-gray-900">
                <Download className="w-4 h-4" /> Tải file .md
              </button>
              {canShare && (
                <button onClick={share} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-sm rounded-md hover:border-gray-900">
                  <Share2 className="w-4 h-4" /> Chia sẻ sang app
                </button>
              )}
              <button onClick={() => setShowText(!showText)} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-900">
                {showText ? 'Ẩn nội dung' : 'Xem nội dung'}
              </button>
            </div>
            {showText && (
              <pre className="mt-4 max-h-96 overflow-auto text-xs leading-relaxed bg-gray-50 border border-gray-200 rounded-md p-3 whitespace-pre-wrap">{markdown}</pre>
            )}
            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              Mẹo: trong Claude tạo một <b>Project</b>, trong ChatGPT tạo một <b>Project/GPT</b> và đặt hồ sơ vào phần kiến thức — AI sẽ nhớ điểm yếu của bạn ở mọi cuộc trò
              chuyện. Cập nhật lại mỗi tuần.
            </p>
          </section>

          <Link href="/situation/cards" className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <Dumbbell className="w-4 h-4" /> Luyện các lỗi này trong Gym lỗ hổng
          </Link>
        </>
      )}
    </div>
  )
}
