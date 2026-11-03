'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BarChart3, Copy, FileText, Loader2, Pencil, Sparkles, Volume2 } from 'lucide-react'
import {
  ERROR_TYPES,
  SCENARIO_META,
  SELF_TAGS,
  dayForAI,
  feedbackFromAttempt,
  getAttempts,
  isSelfCheck,
  readDrafts,
  requestFeedback,
  saveAttempt,
  saveDayProgress,
  selfFeedback,
  wordDiff,
  writeDraft,
  type Feedback,
  type Scenario,
  type Sentence,
  type SituationDay,
  type Verdict,
} from '@/lib/situation'
import { scheduleFromLesson } from '@/lib/srs'
import { downloadWord } from '@/lib/wordExport'

type Grade = 'remembered' | 'review'

const VERDICT_STYLE: Record<Verdict, { label: string; cls: string; on: string }> = {
  correct: { label: 'Đúng', cls: 'bg-green-50 text-green-700 border-green-200', on: 'border-green-500 bg-green-50 text-green-700' },
  minor: { label: 'Gần đúng', cls: 'bg-amber-50 text-amber-700 border-amber-200', on: 'border-amber-500 bg-amber-50 text-amber-700' },
  incorrect: { label: 'Sai', cls: 'bg-red-50 text-red-700 border-red-200', on: 'border-red-500 bg-red-50 text-red-700' },
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

function SpeakButton({ text }: { text: string }) {
  return (
    <button onClick={() => speak(text)} className="flex-shrink-0 text-gray-400 hover:text-gray-900 transition-colors" title="Nghe phát âm">
      <Volume2 className="w-4 h-4" />
    </button>
  )
}

/** The learner's sentence vs the model: words only in mine (red), words only in the model (green). */
function Diff({ answer, model }: { answer: string; model: string }) {
  const parts = wordDiff(answer, model)
  return (
    <p className="text-sm leading-7">
      {parts.map((p, i) => (
        <span
          key={i}
          className={p.kind === 'mine' ? 'bg-red-100 text-red-700 line-through decoration-red-400 rounded px-0.5' : p.kind === 'model' ? 'bg-green-100 text-green-800 rounded px-0.5' : 'text-gray-800'}
        >
          {p.text}{' '}
        </span>
      ))}
    </p>
  )
}

function AIResult({ fb }: { fb: Feedback }) {
  const v = VERDICT_STYLE[fb.verdict] ?? VERDICT_STYLE.minor
  return (
    <div className="p-4 rounded-md border border-gray-200 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-gray-400" />
        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${v.cls}`}>{v.label}</span>
        <span className="text-xs text-gray-500 tabular-nums">{fb.score}/10</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{fb.summary}</p>

      {fb.errors.length > 0 && (
        <ul className="space-y-3">
          {fb.errors.map((e, i) => (
            <li key={i} className="text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{ERROR_TYPES[e.type] ?? e.type}</span>
                <span className="text-red-600 line-through">{e.wrong}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-700 font-medium">{e.correct}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mt-1">{e.explanation}</p>
            </li>
          ))}
        </ul>
      )}

      {fb.verdict !== 'correct' && fb.corrected && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Câu của bạn sau khi sửa</p>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-gray-900">{fb.corrected}</p>
            <SpeakButton text={fb.corrected} />
          </div>
        </div>
      )}

      {fb.natural.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Cách viết tự nhiên hơn</p>
          <ul className="space-y-2">
            {fb.natural.map((n, i) => (
              <li key={i}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-900">{n.text}</p>
                  <SpeakButton text={n.text} />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{n.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Shows a saved result: AI grading (with details) or a self-check. */
function SavedResult({ fb }: { fb: Feedback }) {
  if (!isSelfCheck(fb)) return <AIResult fb={fb} />
  const v = VERDICT_STYLE[fb.verdict] ?? VERDICT_STYLE.minor
  const tagged = fb.errors.filter((e) => e.type)
  return (
    <div className="p-3 rounded-md border border-gray-200 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${v.cls}`}>{v.label}</span>
        {tagged.map((e, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            {ERROR_TYPES[e.type] ?? e.type}
          </span>
        ))}
      </div>
      {tagged.some((e) => e.wrong) && (
        <ul className="space-y-1">
          {tagged
            .filter((e) => e.wrong)
            .map((e, i) => (
              <li key={i} className="text-sm">
                <span className="text-red-600 line-through">{e.wrong}</span> <span className="text-gray-400">→</span>{' '}
                <span className="text-green-700 font-medium">{e.correct}</span>
                {e.explanation && !e.explanation.startsWith('Tự đánh dấu') && <span className="block text-xs text-gray-500">{e.explanation}</span>}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

export function SentenceCard({
  s,
  day,
  grade,
  onGrade,
  label,
  wrong,
  wrongLabel,
  hint,
  focus,
  source,
  initialAnswer,
  initialFeedback,
  onDraft,
  onResult,
}: {
  s: Sentence
  day: number
  grade?: Grade
  onGrade: (g: Grade) => void
  label?: string // overrides the "A1 · B1 · topic" header
  wrong?: string // an incorrect sentence the learner should rewrite
  wrongLabel?: string
  hint?: string
  focus?: string
  source?: 'daily' | 'drill' | 'review'
  initialAnswer?: string // restored draft or previously checked answer
  initialFeedback?: Feedback // restored result
  onDraft?: (text: string) => void
  onResult?: (fb: Feedback, answer: string) => void
}) {
  const [answer, setAnswer] = useState(initialAnswer ?? '')
  const [stage, setStage] = useState<'write' | 'compare' | 'saved'>(initialFeedback ? 'saved' : 'write')
  const [result, setResult] = useState<Feedback | null>(initialFeedback ?? null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [pair, setPair] = useState({ wrong: '', correct: '' })
  const [showHint, setShowHint] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')

  async function save() {
    if (!verdict) return
    await record(selfFeedback(s, verdict, tags, pair))
  }

  async function gradeWithAI() {
    const text = answer.trim()
    if (!text || aiBusy) return
    setAiBusy(true)
    setAiError('')
    try {
      await record(await requestFeedback(s, text))
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI chưa chấm được. Vui lòng thử lại.')
    } finally {
      setAiBusy(false)
    }
  }

  async function record(fb: Feedback) {
    const text = answer.trim()
    setResult(fb)
    setStage('saved')
    onGrade(verdict === 'correct' ? 'remembered' : 'review')
    onResult?.(fb, text)
    if (!text) return
    await saveAttempt({
      id: `${s.id}-${Date.now()}`,
      sentenceId: s.id,
      day,
      vietnamese: s.vietnamese,
      model: s.english,
      answer: text,
      verdict: fb.verdict,
      score: fb.score,
      errors: fb.errors,
      at: new Date().toISOString(),
      source: source ?? (focus ? 'drill' : 'daily'),
      focus,
      feedback: { summary: fb.summary, corrected: fb.corrected, natural: fb.natural },
    })
  }

  const chip = (on: boolean) =>
    `px-2.5 py-1 rounded-full border text-xs transition-colors ${on ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-900'}`

  const aiButton = (
    <button
      onClick={gradeWithAI}
      disabled={aiBusy}
      className="flex items-center justify-center gap-1.5 px-5 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:border-gray-900 disabled:opacity-50 transition-colors"
    >
      {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      {aiBusy ? 'AI đang chấm…' : 'AI chấm'}
    </button>
  )

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="font-medium text-gray-400 tabular-nums">{label ?? `${s.scenario}${s.number}`}</span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{s.level}</span>
        {!label && <span className="text-gray-400 truncate">{s.topic}</span>}
        {grade && <span className={`ml-auto px-1.5 py-0.5 rounded ${grade === 'remembered' ? 'text-green-700' : 'text-amber-700'}`}>{grade === 'remembered' ? '✓ đúng' : '↻ cần ôn'}</span>}
      </div>

      <p className="text-gray-900 leading-relaxed mb-4">{s.vietnamese}</p>

      {wrong && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-100">
          <p className="text-xs font-medium text-red-400 uppercase tracking-widest mb-1">{wrongLabel ?? 'Câu có lỗi — hãy viết lại cho đúng'}</p>
          <p className="text-sm text-red-700">{wrong}</p>
        </div>
      )}

      {hint && stage === 'write' && (
        <div className="mb-3">
          {showHint ? (
            <p className="text-xs text-gray-500">💡 {hint}</p>
          ) : (
            <button onClick={() => setShowHint(true)} className="text-xs text-gray-400 hover:text-gray-900">
              💡 Gợi ý
            </button>
          )}
        </div>
      )}

      <textarea
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value)
          onDraft?.(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && stage === 'write') setStage('compare')
        }}
        rows={3}
        readOnly={stage !== 'write' || aiBusy}
        placeholder="Viết câu tiếng Anh của bạn…"
        // Phone keyboards would silently fix exactly the mistakes we want to see.
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        lang="en"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y read-only:bg-gray-50"
      />

      {stage === 'write' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setVerdict(null)
              setTags([])
              setPair({ wrong: '', correct: '' })
              setAiError('')
              setStage('compare')
            }}
            disabled={aiBusy}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {answer.trim() ? 'So với câu mẫu' : 'Xem câu mẫu'}
          </button>
          {answer.trim() && aiButton}
        </div>
      ) : (
        <button
          onClick={() => {
            setAiError('')
            setStage('write')
          }}
          disabled={aiBusy}
          className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Viết lại
        </button>
      )}

      {aiError && <p className="mt-3 text-sm text-red-600">{aiError}</p>}

      {stage !== 'write' && (
        <div className="mt-4 space-y-3">
          <div className="p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Câu mẫu</p>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-900 leading-relaxed">{s.english}</p>
              <SpeakButton text={s.english} />
            </div>
            {s.notes && (
              <p className="mt-2 text-xs text-gray-500">
                <span className="font-medium text-gray-400 uppercase tracking-widest mr-1">Note</span>
                {s.notes}
              </p>
            )}
          </div>

          {answer.trim() && (
            <div className="p-3 rounded-md border border-gray-200">
              <p className="text-xs text-gray-400 mb-1">
                So sánh: <span className="bg-red-100 text-red-700 px-1 rounded">chỉ có trong câu bạn</span> ·{' '}
                <span className="bg-green-100 text-green-800 px-1 rounded">câu mẫu có</span>
              </p>
              <Diff answer={answer} model={s.english} />
              <p className="text-[11px] text-gray-400 mt-1">Khác câu mẫu chưa chắc là sai — câu dịch có nhiều cách đúng.</p>
            </div>
          )}

          {stage === 'compare' ? (
            <div className="p-4 rounded-md border border-gray-900 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Bạn tự chấm câu này:</p>
                <div className="flex gap-2">
                  {(['correct', 'minor', 'incorrect'] as Verdict[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVerdict(v)}
                      className={`flex-1 py-2 rounded-md border text-sm ${verdict === v ? VERDICT_STYLE[v].on : 'border-gray-300 text-gray-600 hover:border-gray-900'}`}
                    >
                      {VERDICT_STYLE[v].label}
                    </button>
                  ))}
                </div>
              </div>

              {verdict && verdict !== 'correct' && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Lỗi thuộc loại nào? (chọn một hoặc nhiều)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SELF_TAGS.map((t) => (
                        <button key={t} onClick={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} className={chip(tags.includes(t))}>
                          {ERROR_TYPES[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Ghi cụm sai → cụm đúng (không bắt buộc — có thì cụm này vào Gym để luyện)</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={pair.wrong}
                        onChange={(e) => setPair((p) => ({ ...p, wrong: e.target.value }))}
                        placeholder="cụm bạn viết sai"
                        autoCorrect="off"
                        spellCheck={false}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-base sm:text-sm"
                      />
                      <input
                        value={pair.correct}
                        onChange={(e) => setPair((p) => ({ ...p, correct: e.target.value }))}
                        placeholder="cụm đúng"
                        autoCorrect="off"
                        spellCheck={false}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-base sm:text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              <button onClick={save} disabled={!verdict || aiBusy} className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md disabled:opacity-30">
                Lưu kết quả
              </button>
              {answer.trim() && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">Chưa chắc câu của mình đúng hay sai?</p>
                  {aiButton}
                </div>
              )}
            </div>
          ) : (
            result && <SavedResult fb={result} />
          )}
        </div>
      )}
    </div>
  )
}

type Restored = { answer: string; feedback?: Feedback }

export default function SituationPractice({ data, totalDays, hasNext }: { data: SituationDay; totalDays: number; hasNext: boolean }) {
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [restored, setRestored] = useState<Record<string, Restored> | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, Feedback | undefined>>({})
  const [copied, setCopied] = useState(false)

  // Restore checked answers (from saved attempts) and unsent drafts for this day.
  useEffect(() => {
    const ids = new Set(data.sentences.map((s) => s.id))
    getAttempts().then((all) => {
      const latest: Record<string, Restored> = {}
      const g: Record<string, Grade> = {}
      for (const a of all) {
        if (a.day !== data.day || !ids.has(a.sentenceId) || (a.source && a.source !== 'daily') || latest[a.sentenceId]) continue
        latest[a.sentenceId] = { answer: a.answer, feedback: feedbackFromAttempt(a) }
        g[a.sentenceId] = a.verdict === 'correct' ? 'remembered' : 'review'
      }
      const d = readDrafts(data.day)
      for (const [id, text] of Object.entries(d)) if (ids.has(id) && !latest[id]) latest[id] = { answer: text }
      setGrades(g)
      setRestored(latest)
      setAnswers(Object.fromEntries(Object.entries(latest).map(([id, r]) => [id, r.answer])))
      setResults(Object.fromEntries(Object.entries(latest).map(([id, r]) => [id, r.feedback])))
    })
  }, [data])

  const total = data.sentences.length
  const graded = Object.keys(grades).length
  const remembered = Object.values(grades).filter((g) => g === 'remembered').length

  // Progress is saved automatically after every checked sentence.
  function persist(next: Record<string, Grade>) {
    saveDayProgress({
      day: data.day,
      completedAt: new Date().toISOString(),
      remembered: Object.values(next).filter((g) => g === 'remembered').length,
      total,
      graded: Object.keys(next).length,
      review: Object.entries(next)
        .filter(([, g]) => g === 'review')
        .map(([id]) => id),
    })
  }

  function setGrade(s: Sentence, g: Grade) {
    const next = { ...grades, [s.id]: g }
    setGrades(next)
    persist(next)
    writeDraft(data.day, s.id, '')
    scheduleFromLesson(s, g)
  }

  const markdown = () => dayForAI(data, answers, results)
  const fileName = `situation-ngay-${data.day}`

  const done = graded === total

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <div className="flex items-center justify-between mb-6">
        <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Tất cả các ngày
        </Link>
        <Link href="/summary" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <BarChart3 className="w-3.5 h-3.5" /> Tổng kết lỗi
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
          Ngày {data.day}/{totalDays} · {data.date.split('-').reverse().join('/')}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">Practice Situation</h1>
        <p className="text-sm text-gray-500 mt-2">
          Viết câu → <b>So với câu mẫu</b> để tự chấm, hoặc bấm <b>AI chấm</b> từng câu. Muốn review cả bài: <b>Xuất Word</b> rồi dán vào ChatGPT / Claude / DeepSeek.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 mb-6 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center gap-2">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1 tabular-nums">
            <span>
              Đã chấm {graded}/{total}
            </span>
            <span>{remembered} đúng</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 transition-all" style={{ width: `${(graded / total) * 100}%` }} />
          </div>
        </div>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(markdown())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-sm rounded-md hover:border-gray-900"
          title="Copy nội dung để dán vào AI"
        >
          <Copy className="w-4 h-4" /> {copied ? 'Đã copy' : 'Copy'}
        </button>
        <button onClick={() => downloadWord(markdown(), fileName)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700">
          <FileText className="w-4 h-4" /> Xuất Word
        </button>
      </div>

      {!restored ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : (
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
                      day={data.day}
                      grade={grades[s.id]}
                      initialAnswer={restored[s.id]?.answer}
                      initialFeedback={restored[s.id]?.feedback}
                      onDraft={(text) => {
                        writeDraft(data.day, s.id, text)
                        setAnswers((a) => ({ ...a, [s.id]: text }))
                      }}
                      onResult={(fb, answer) => {
                        setResults((r) => ({ ...r, [s.id]: fb }))
                        setAnswers((a) => ({ ...a, [s.id]: answer }))
                      }}
                      onGrade={(g) => setGrade(s, g)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <div className="mt-14 pt-8 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-3xl font-semibold text-gray-900 tabular-nums">
            {remembered}
            <span className="text-lg font-normal text-gray-400">/{total}</span>
          </div>
          <p className="text-sm text-gray-500">{done ? `Đã hoàn thành ngày ${data.day} · tiến độ đã lưu` : `câu đúng · đã chấm ${graded}/${total}, tự lưu`}</p>
        </div>
        {hasNext && (
          <Link
            href={`/situation/${data.day + 1}`}
            className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-colors ${
              done ? 'bg-gray-900 text-white hover:bg-gray-700' : 'border border-gray-300 text-gray-700 hover:border-gray-900'
            }`}
          >
            Ngày {data.day + 1} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}
