'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react'
import { downloadWord, today } from '@/lib/wordExport'
import {
  TARGET_BAND,
  TYPE_LABEL,
  bandGT,
  generatedSections,
  ieltsAttempts,
  loadTests,
  qid,
  type Group,
  type IeltsAttempt,
  type QType,
  type Question,
} from '@/lib/ielts'

export default function IeltsReport() {
  const [attempts, setAttempts] = useState<IeltsAttempt[] | null>(null)
  const [index, setIndex] = useState<Map<string, { g: Group; q: Question }>>(new Map())

  useEffect(() => {
    Promise.all([ieltsAttempts.getAll(), loadTests(), generatedSections.getAll()]).then(([a, tests, gen]) => {
      const m = new Map<string, { g: Group; q: Question }>()
      for (const s of [...tests.flatMap((t) => t.sections), ...gen.map((x) => x.section)])
        for (const g of s.groups) for (const q of g.questions) m.set(qid(s.id, q.n), { g, q })
      setIndex(m)
      setAttempts(a.sort((x, y) => y.at.localeCompare(x.at)))
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

  /** Markdown for any AI chat: accuracy by question type and every wrong answer with its evidence. */
  function forAI() {
    const lines = [
      '# Báo cáo IELTS General Reading',
      '',
      '## Yêu cầu cho AI',
      'Tôi là kỹ sư quản lý dự án người Việt, mục tiêu IELTS General Training band ' + TARGET_BAND + '. Dựa trên số liệu và các câu sai bên dưới, hãy:',
      '- Chỉ ra 3 điểm yếu lớn nhất (theo dạng câu hỏi) và nguyên nhân thường gặp.',
      '- Với mỗi câu sai: giải thích vì sao đáp án đúng, chỉ ra từ khóa / paraphrase trong bài.',
      '- Đề xuất kế hoạch luyện 1 tuần (6 ngày học, Chủ nhật ôn).',
      '',
      '## Tỷ lệ đúng theo dạng câu hỏi',
      ...byType.map(([t, s]) => `- ${TYPE_LABEL[t]}: ${s.right}/${s.total} (${Math.round((s.right / s.total) * 100)}%)`),
      '',
      '## Bài thi đủ đề gần đây',
      ...(fullTests.length ? fullTests.slice(0, 5).map((a) => `- ${a.title}: ${a.score}/${a.total} → band ${bandGT(a.score, a.total)}`) : ['- (chưa có)']),
      '',
      '## Các câu làm sai (gần nhất)',
    ]
    for (const r of results.filter((x) => !x.correct).slice(0, 40)) {
      const hit = index.get(r.qid)
      if (!hit) continue
      lines.push(
        '',
        `### ${TYPE_LABEL[r.type]} – câu ${hit.q.n}`,
        `- **Câu hỏi:** ${hit.q.prompt ?? hit.g.instructions ?? ''}`,
        `- **Tôi trả lời:** ${r.answer || '(bỏ trống)'}`,
        `- **Đáp án:** ${hit.q.answer.join(' / ')}`
      )
      if (hit.q.evidence) lines.push(`- **Trích trong bài:** ${hit.q.evidence}`)
    }
    return lines.join('\n')
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
              onClick={() => downloadWord(forAI(), `bao-cao-ielts-${today()}`)}
              disabled={!results.length}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40"
            >
              <FileText className="w-4 h-4" /> Xuất báo cáo Word cho AI
            </button>
            <p className="text-xs text-gray-500 mt-2">File gồm tỷ lệ đúng theo dạng câu, điểm các đề và các câu sai kèm trích dẫn — mở Word, copy vào ChatGPT / Claude / DeepSeek để được phân tích.</p>
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
