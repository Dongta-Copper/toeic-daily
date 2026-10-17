'use client'

import Link from 'next/link'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, Check, Clock, Layers, ListChecks, Loader2, Search, X } from 'lucide-react'
import {
  TYPE_LABEL,
  TYPE_TIP,
  bandGT,
  choicesFor,
  ieltsAttempts,
  isChoice,
  isCorrect,
  qid,
  type Group,
  type IeltsAttempt,
  type Paper,
  type Paragraph,
  type Question,
  type QResult,
} from '@/lib/ielts'
import { generateCards, loadBuiltinCards, userCards } from '@/lib/phrases'

type Highlight = { sectionId: string; textId: string; quote: string } | null

function fmt(sec: number) {
  const s = Math.max(0, sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function ParagraphView({ p, quote }: { p: Paragraph; quote?: string }) {
  const i = quote ? p.text.indexOf(quote) : -1
  return (
    <p className="mb-4 leading-relaxed text-[15px] text-gray-800">
      {p.label && <b className="mr-2 text-gray-900">{p.label}</b>}
      {p.heading && <b className="block text-gray-900 mb-1">{p.heading}</b>}
      {i >= 0 ? (
        <>
          {p.text.slice(0, i)}
          <mark data-hl className="bg-amber-200 rounded px-0.5">
            {p.text.slice(i, i + quote!.length)}
          </mark>
          {p.text.slice(i + quote!.length)}
        </>
      ) : (
        p.text
      )}
    </p>
  )
}

/** Inline input used for completion gaps. */
function Gap({
  value,
  onChange,
  disabled,
  label,
  state,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  label: number
  state?: 'right' | 'wrong'
}) {
  const color = state === 'right' ? 'border-green-500 bg-green-50' : state === 'wrong' ? 'border-red-400 bg-red-50' : 'border-gray-400'
  return (
    <span className="inline-flex items-center gap-1 align-baseline mx-0.5">
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className={`w-32 sm:w-36 border-b-2 bg-transparent px-1 py-0.5 text-base sm:text-sm focus:outline-none focus:border-gray-900 ${color}`}
      />
    </span>
  )
}

export default function IeltsPlayer({ paper }: { paper: Paper }) {
  const [phase, setPhase] = useState<'intro' | 'doing' | 'review'>('intro')
  const [timed, setTimed] = useState(true)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [partIndex, setPartIndex] = useState(0)
  const [view, setView] = useState<'text' | 'questions'>('text')
  const [highlight, setHighlight] = useState<Highlight>(null)
  const [results, setResults] = useState<QResult[]>([])
  const [tips, setTips] = useState<Record<string, boolean>>({})
  const [phrase, setPhrase] = useState('')
  const [phraseMsg, setPhraseMsg] = useState('')
  const [phraseBusy, setPhraseBusy] = useState(false)
  const answersRef = useRef(answers)
  const submittedRef = useRef(false)

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  // Display numbers: real IELTS numbers, except in question-type drills (mixed sources) → 1, 2, 3…
  const numbering = useMemo(() => {
    const map = new Map<string, number>()
    let i = 0
    for (const part of paper.parts)
      for (const g of part.groups)
        for (const q of g.questions) map.set(qid(part.section.id, q.n), paper.mode === 'type' ? ++i : q.n)
    return map
  }, [paper])
  const total = numbering.size

  const limit = paper.minutes * 60
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0
  const remaining = limit - elapsed

  function submit() {
    if (submittedRef.current) return
    submittedRef.current = true
    const res: QResult[] = []
    for (const part of paper.parts)
      for (const g of part.groups)
        for (const q of g.questions) {
          const id = qid(part.section.id, q.n)
          const a = answersRef.current[id] ?? ''
          res.push({ qid: id, type: g.type, answer: a, correct: isCorrect(g, q, a) })
        }
    const score = res.filter((r) => r.correct).length
    const finishedAt = Date.now()
    const attempt: IeltsAttempt = {
      id: `${paper.key}-${finishedAt}`,
      updatedAt: new Date(finishedAt).toISOString(),
      at: new Date(finishedAt).toISOString(),
      paperKey: paper.key,
      title: paper.title,
      mode: paper.mode,
      timed,
      durationSec: Math.round((finishedAt - startedAt) / 1000),
      score,
      total: res.length,
      results: res,
    }
    ieltsAttempts.save([attempt])
    setResults(res)
    setPhase('review')
    setPartIndex(0)
    setView('questions')
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    if (phase !== 'doing') return
    const t = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (timed && current - startedAt >= limit * 1000) submit()
    }, 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timed, startedAt, limit])

  // Scroll the highlighted evidence into view.
  useEffect(() => {
    if (highlight) document.querySelector('[data-hl]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlight, view])

  const part = paper.parts[partIndex]
  const textIds = [...new Set(part.groups.map((g) => g.textId))]
  const texts = part.section.texts.filter((t) => textIds.includes(t.id))
  const resultById = new Map(results.map((r) => [r.qid, r]))
  const reviewing = phase === 'review'
  const answered = Object.values(answers).filter((v) => v.trim()).length

  function setAnswer(id: string, v: string) {
    setAnswers((a) => ({ ...a, [id]: v }))
  }

  function showEvidence(textId: string, quote: string) {
    setHighlight({ sectionId: part.section.id, textId, quote })
    setView('text')
  }

  async function savePhrase() {
    if (!phrase.trim()) return
    setPhraseBusy(true)
    setPhraseMsg('')
    try {
      const cards = await generateCards({ mode: 'manual', text: phrase.trim() }, [...userCards.readLocal(), ...(await loadBuiltinCards())])
      setPhraseMsg(cards.length ? `Đã lưu: ${cards.map((c) => c.phrase).join(' · ')}` : 'Cụm này đã có trong Thẻ cụm từ.')
      setPhrase('')
    } catch (e) {
      setPhraseMsg(e instanceof Error ? e.message : 'AI chưa tạo được thẻ.')
    } finally {
      setPhraseBusy(false)
    }
  }

  // ─── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const types = [...new Set(paper.parts.flatMap((p) => p.groups.map((g) => g.type)))]
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <Link href="/ielts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> IELTS Reading
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{paper.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {total} câu · {paper.mode === 'full' ? '3 sections' : `${paper.parts.length} bài đọc`} · gợi ý {paper.minutes} phút
        </p>
        <ul className="text-sm text-gray-700 space-y-1 mb-6">
          {types.map((t) => (
            <li key={t}>• {TYPE_LABEL[t]}</li>
          ))}
        </ul>
        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg mb-6 cursor-pointer">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="w-4 h-4 accent-gray-900" />
          <span className="text-sm text-gray-800">
            Bấm giờ {paper.minutes} phút, tự nộp bài khi hết giờ
            <span className="block text-xs text-gray-500">Tắt nếu muốn luyện chậm, đọc kỹ.</span>
          </span>
        </label>
        <button
          onClick={() => {
            const t = Date.now()
            setStartedAt(t)
            setNow(t)
            setPhase('doing')
          }}
          className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700"
        >
          Bắt đầu
        </button>
      </div>
    )
  }

  // ─── Doing / review ─────────────────────────────────────────────────────────
  const score = results.filter((r) => r.correct).length
  const band = bandGT(score, results.length || 40)

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 pb-10">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2 flex flex-wrap items-center gap-2">
        <Link href="/ielts" className="p-1 text-gray-400 hover:text-gray-900" title="Thoát">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        {paper.parts.length > 1 && (
          <div className="flex p-0.5 bg-gray-100 rounded-md text-xs sm:text-sm">
            {paper.parts.map((p, i) => (
              <button
                key={p.section.id + i}
                onClick={() => {
                  setPartIndex(i)
                  setHighlight(null)
                }}
                className={`px-2.5 py-1 rounded ${partIndex === i ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500'}`}
              >
                {paper.mode === 'full' ? `S${p.section.number}` : `Bài ${i + 1}`}
              </button>
            ))}
          </div>
        )}
        <div className="flex md:hidden p-0.5 bg-gray-100 rounded-md text-xs">
          <button onClick={() => setView('text')} className={`px-2.5 py-1 rounded flex items-center gap-1 ${view === 'text' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>
            <BookOpen className="w-3.5 h-3.5" /> Bài đọc
          </button>
          <button onClick={() => setView('questions')} className={`px-2.5 py-1 rounded flex items-center gap-1 ${view === 'questions' ? 'bg-white shadow-sm font-medium' : 'text-gray-500'}`}>
            <ListChecks className="w-3.5 h-3.5" /> Câu hỏi
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {!reviewing && (
            <>
              <span className={`flex items-center gap-1 text-sm tabular-nums ${timed && remaining < 300 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                <Clock className="w-4 h-4" />
                {timed ? fmt(remaining) : fmt(elapsed)}
              </span>
              <span className="hidden sm:inline text-xs text-gray-400 tabular-nums">
                {answered}/{total}
              </span>
              <button onClick={submit} className="px-3 sm:px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                Nộp bài
              </button>
            </>
          )}
          {reviewing && (
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              {score}/{results.length} · band ≈ {band}
            </span>
          )}
        </div>
      </div>

      {reviewing && partIndex === 0 && (
        <div className="mt-4 p-4 sm:p-5 border border-gray-200 rounded-lg">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">
                {score}
                <span className="text-lg font-normal text-gray-400">/{results.length}</span>
              </div>
              <div className="text-xs text-gray-500">câu đúng</div>
            </div>
            <div>
              <div className={`text-3xl font-semibold tabular-nums ${band >= 6.5 ? 'text-green-700' : 'text-gray-900'}`}>{band}</div>
              <div className="text-xs text-gray-500">{paper.mode === 'full' ? 'band GT (quy đổi tham khảo)' : 'band ước tính nếu giữ tỷ lệ này cho 40 câu'}</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">{fmt(Math.floor((now - startedAt) / 1000))}</div>
              <div className="text-xs text-gray-500">thời gian làm</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {[...new Set(results.map((r) => r.type))].map((t) => {
              const list = results.filter((r) => r.type === t)
              const ok = list.filter((r) => r.correct).length
              return (
                <span key={t} className="px-2 py-1 rounded bg-gray-100 text-gray-700 tabular-nums">
                  {TYPE_LABEL[t]}: {ok}/{list.length}
                </span>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">Bấm “Xem trong bài” ở từng câu để thấy câu chứa đáp án được tô vàng.</p>
        </div>
      )}

      <div className="mt-4 grid md:grid-cols-2 gap-6">
        {/* Passage */}
        <div className={`${view === 'text' ? 'block' : 'hidden'} md:block md:h-[calc(100vh-9rem)] md:overflow-y-auto md:pr-3`}>
          {texts.map((t) => (
            <div key={t.id} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t.title}</h2>
              {t.paragraphs.map((p, i) => (
                <ParagraphView
                  key={i}
                  p={p}
                  quote={highlight && highlight.sectionId === part.section.id && highlight.textId === t.id ? highlight.quote : undefined}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className={`${view === 'questions' ? 'block' : 'hidden'} md:block md:h-[calc(100vh-9rem)] md:overflow-y-auto md:pr-2`}>
          {part.groups.map((g) => {
            const nums = g.questions.map((q) => numbering.get(qid(part.section.id, q.n))!)
            return (
              <div key={g.id} className="mb-10">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Questions {nums[0]}–{nums[nums.length - 1]}
                  <span className="ml-2 text-xs font-normal text-gray-400">{TYPE_LABEL[g.type]}</span>
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">{g.instructions}</p>
                <button onClick={() => setTips((t) => ({ ...t, [g.id]: !t[g.id] }))} className="text-xs text-gray-400 hover:text-gray-900 mb-3">
                  💡 Mẹo làm dạng này
                </button>
                {tips[g.id] && <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 mb-3 leading-relaxed">{TYPE_TIP[g.type]}</p>}

                {g.options && g.type !== 'mcq' && (
                  <div className="mb-4 p-3 border border-gray-200 rounded-md text-sm space-y-1">
                    {g.options.map((o) => (
                      <p key={o.key}>
                        <b className="inline-block w-8 text-gray-900">{o.key}</b>
                        <span className="text-gray-700">{o.text}</span>
                      </p>
                    ))}
                  </div>
                )}

                {g.template ? (
                  <div className="text-sm text-gray-800 leading-loose whitespace-pre-line p-3 border border-gray-200 rounded-md mb-4">
                    {g.template.split(/(\{\d+\})/).map((chunk, i) => {
                      const m = chunk.match(/^\{(\d+)\}$/)
                      if (!m) return <Fragment key={i}>{chunk}</Fragment>
                      const q = g.questions.find((x) => x.n === Number(m[1]))
                      if (!q) return <Fragment key={i}>{chunk}</Fragment>
                      const id = qid(part.section.id, q.n)
                      const r = resultById.get(id)
                      return (
                        <Gap
                          key={i}
                          label={numbering.get(id)!}
                          value={answers[id] ?? ''}
                          onChange={(v) => setAnswer(id, v)}
                          disabled={reviewing}
                          state={r ? (r.correct ? 'right' : 'wrong') : undefined}
                        />
                      )
                    })}
                  </div>
                ) : null}

                <div className="space-y-5">
                  {g.questions.map((q) => (
                    <QuestionView
                      key={q.n}
                      g={g}
                      q={q}
                      id={qid(part.section.id, q.n)}
                      num={numbering.get(qid(part.section.id, q.n))!}
                      value={answers[qid(part.section.id, q.n)] ?? ''}
                      onChange={(v) => setAnswer(qid(part.section.id, q.n), v)}
                      result={resultById.get(qid(part.section.id, q.n))}
                      onEvidence={() => showEvidence(g.textId, q.evidence)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {!reviewing && partIndex < paper.parts.length - 1 && (
            <button
              onClick={() => {
                setPartIndex(partIndex + 1)
                setView('text')
                window.scrollTo({ top: 0 })
              }}
              className="w-full py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:border-gray-900"
            >
              Sang {paper.mode === 'full' ? `Section ${paper.parts[partIndex + 1].section.number}` : 'bài tiếp theo'} →
            </button>
          )}
          {!reviewing && partIndex === paper.parts.length - 1 && (
            <button onClick={submit} className="w-full py-3 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700">
              Nộp bài ({answered}/{total} câu đã làm)
            </button>
          )}

          {reviewing && (
            <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Lưu cụm từ hay trong bài vào Thẻ cụm từ
              </p>
              <p className="text-xs text-gray-500 mb-3">Gõ cụm từ bạn muốn học, ví dụ: reimburse the fee, in response to.</p>
              <div className="flex gap-2">
                <input
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !phraseBusy && savePhrase()}
                  autoCorrect="off"
                  spellCheck={false}
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={savePhrase}
                  disabled={phraseBusy || !phrase.trim()}
                  className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md disabled:opacity-40 flex items-center gap-1.5"
                >
                  {phraseBusy && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
                </button>
              </div>
              {phraseMsg && <p className="mt-2 text-xs text-gray-600">{phraseMsg}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuestionView({
  g,
  q,
  num,
  value,
  onChange,
  result,
  onEvidence,
}: {
  g: Group
  q: Question
  id: string
  num: number
  value: string
  onChange: (v: string) => void
  result?: QResult
  onEvidence: () => void
}) {
  const reviewing = !!result
  const choice = isChoice(g.type)
  const opts = choicesFor(g, q)

  return (
    <div className={reviewing ? `p-3 rounded-md border ${result.correct ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}` : ''}>
      {!g.template && (
        <div className="flex gap-2 mb-2 text-[15px] text-gray-900 leading-relaxed">
          <b className="flex-shrink-0 w-6 text-gray-500">{num}</b>
          <div className="flex-1">
            {g.type === 'sentence_completion' && q.prompt?.includes('___') ? (
              <>
                {q.prompt.split('___')[0]}
                <Gap label={num} value={value} onChange={onChange} disabled={reviewing} state={result ? (result.correct ? 'right' : 'wrong') : undefined} />
                {q.prompt.split('___').slice(1).join('___')}
              </>
            ) : (
              q.prompt
            )}
          </div>
        </div>
      )}

      {choice && g.type === 'mcq' && (
        <div className="space-y-1.5 ml-8">
          {opts.map((o) => {
            const picked = value === o.key
            const right = reviewing && q.answer.includes(o.key)
            return (
              <label
                key={o.key}
                className={`flex items-start gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer ${
                  right ? 'border-green-500 bg-green-50' : reviewing && picked ? 'border-red-400 bg-red-50' : picked ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <input type="radio" checked={picked} disabled={reviewing} onChange={() => onChange(o.key)} className="mt-0.5 accent-gray-900" />
                <span>
                  <b className="mr-1.5">{o.key}</b>
                  {o.text}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {choice && g.type !== 'mcq' && (
        <div className="flex flex-wrap gap-1.5 ml-8">
          {opts.map((o) => {
            const picked = value === o.key
            const right = reviewing && q.answer.includes(o.key)
            return (
              <button
                key={o.key}
                disabled={reviewing}
                onClick={() => onChange(picked ? '' : o.key)}
                className={`min-w-10 px-2.5 py-1.5 rounded-md border text-sm font-medium ${
                  right ? 'border-green-500 bg-green-50 text-green-700' : reviewing && picked ? 'border-red-400 bg-red-50 text-red-600' : picked ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700'
                }`}
              >
                {o.key}
              </button>
            )
          })}
        </div>
      )}

      {!choice && !g.template && g.type !== 'sentence_completion' && (
        <div className="ml-8">
          <Gap label={num} value={value} onChange={onChange} disabled={reviewing} state={result ? (result.correct ? 'right' : 'wrong') : undefined} />
        </div>
      )}

      {reviewing && (
        <div className="mt-2 ml-8 text-sm space-y-1">
          <p className={result.correct ? 'text-green-700' : 'text-red-600'}>
            {result.correct ? <Check className="inline w-4 h-4 mr-1" /> : <X className="inline w-4 h-4 mr-1" />}
            {g.template && <b className="mr-1">{num}.</b>}
            Bạn: <b>{value || '(bỏ trống)'}</b>
            {!result.correct && (
              <>
                {' '}· Đáp án: <b className="text-green-700">{q.answer[0]}</b>
              </>
            )}
          </p>
          <p className="text-gray-700 leading-relaxed">{q.explanation}</p>
          {q.paraphrase && <p className="text-xs text-gray-500">Paraphrase: {q.paraphrase}</p>}
          {q.evidence && (
            <button onClick={onEvidence} className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900">
              <Search className="w-3.5 h-3.5" /> Xem trong bài
            </button>
          )}
        </div>
      )}
    </div>
  )
}
