'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BarChart3, Check, Layers, Loader2, Pencil, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import {
  ERROR_TYPES,
  SCENARIO_META,
  feedbackFromAttempt,
  getAttempts,
  readDrafts,
  requestFeedback,
  requestFeedbackBatch,
  saveAttempt,
  saveDayProgress,
  writeDraft,
  type Feedback,
  type Scenario,
  type Sentence,
  type SituationDay,
} from '@/lib/situation'
import { scheduleFromLesson } from '@/lib/srs'
import { generateCards, loadBuiltinCards, userCards } from '@/lib/phrases'

type Grade = 'remembered' | 'review'

const VERDICT_STYLE = {
  correct: { label: 'Đúng', cls: 'bg-green-50 text-green-700 border-green-200' },
  minor: { label: 'Gần đúng', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  incorrect: { label: 'Chưa đúng', cls: 'bg-red-50 text-red-700 border-red-200' },
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
    <button
      onClick={() => speak(text)}
      className="flex-shrink-0 text-gray-400 hover:text-gray-900 transition-colors"
      title="Nghe phát âm"
    >
      <Volume2 className="w-4 h-4" />
    </button>
  )
}

function AIFeedback({ fb }: { fb: Feedback }) {
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

const PHRASE_ERROR_TYPES = new Set(['preposition', 'collocation', 'word_choice'])

/** Turns phrase mistakes, or useful chunks of the model sentence, into phrase cards. */
function SaveToCards({
  s,
  answer,
  feedback,
  attemptId,
}: {
  s: Sentence
  answer: string
  feedback: Feedback | null
  attemptId: string
}) {
  const [busy, setBusy] = useState<'' | 'errors' | 'sentence'>('')
  const [saved, setSaved] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const phraseErrors = (feedback?.errors ?? []).filter((e) => PHRASE_ERROR_TYPES.has(e.type))

  async function run(kind: 'errors' | 'sentence') {
    setBusy(kind)
    setMessage('')
    try {
      const existing = [...userCards.readLocal(), ...(await loadBuiltinCards())]
      const cards = await generateCards(
        kind === 'errors'
          ? {
              mode: 'errors',
              errors: phraseErrors.map((e) => ({ ...e, context: answer.trim(), attemptId })),
            }
          : { mode: 'sentence', sentence: s.english, vietnamese: s.vietnamese },
        existing
      )
      setSaved((prev) => [...prev, ...cards.map((c) => c.phrase)])
      if (!cards.length) setMessage('Các cụm này đã có trong kho thẻ.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'AI chưa tạo được thẻ.')
    } finally {
      setBusy('')
    }
  }

  const btn =
    'flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-gray-300 text-xs text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40'
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => run('sentence')} disabled={!!busy} className={btn}>
          {busy === 'sentence' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
          Lưu cụm từ hay
        </button>
      </div>
      {(feedback?.errors.length ?? 0) > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Lỗi trong câu này sẽ tự vào <Link href="/situation/cards" className="underline">Gym lỗ hổng</Link> để luyện.
        </p>
      )}
      {saved.length > 0 && (
        <p className="mt-2 text-xs text-green-700">
          Đã thêm vào <Link href="/situation/cards/bank" className="underline">bộ cụm từ</Link>: {saved.join(' · ')}
        </p>
      )}
      {message && <p className="mt-2 text-xs text-gray-500">{message}</p>}
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
}: {
  s: Sentence
  day: number
  grade?: Grade
  onGrade: (g: Grade) => void
  label?: string // overrides the "A1 · B1 · topic" header (used by drills)
  wrong?: string // an incorrect sentence the learner should rewrite
  wrongLabel?: string
  hint?: string
  focus?: string // set when the card is part of a weakness drill
  source?: 'daily' | 'drill' | 'review'
  initialAnswer?: string // restored draft or previously graded answer
  initialFeedback?: Feedback // restored grading result
  onDraft?: (text: string) => void
}) {
  const [answer, setAnswer] = useState(initialAnswer ?? '')
  const [revealed, setRevealed] = useState(!!initialFeedback)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback ?? null)
  const [error, setError] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [attemptId, setAttemptId] = useState('')

  async function check() {
    setRevealed(true)
    setFeedback(null)
    setError('')
    const text = answer.trim()
    if (!text) return
    setLoading(true)
    try {
      const fb = await requestFeedback(s, text)
      setFeedback(fb)
      onGrade(fb.verdict === 'correct' ? 'remembered' : 'review')
      const id = `${s.id}-${Date.now()}`
      setAttemptId(id)
      await saveAttempt({
        id,
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
    } catch (e) {
      const detail = e instanceof Error && e.message !== 'feedback failed' ? ` (${e.message})` : ''
      setError(`AI chưa phản hồi được. Bạn vẫn có thể so với câu mẫu bên dưới, hoặc bấm Kiểm tra lại.${detail}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="font-medium text-gray-400 tabular-nums">
          {label ?? `${s.scenario}${s.number}`}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{s.level}</span>
        {!label && <span className="text-gray-400 truncate">{s.topic}</span>}
      </div>

      <p className="text-gray-900 leading-relaxed mb-4">{s.vietnamese}</p>

      {wrong && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-100">
          <p className="text-xs font-medium text-red-400 uppercase tracking-widest mb-1">{wrongLabel ?? 'Câu có lỗi — hãy viết lại cho đúng'}</p>
          <p className="text-sm text-red-700">{wrong}</p>
        </div>
      )}

      {hint && !revealed && (
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
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !loading) check()
        }}
        rows={3}
        readOnly={revealed && !error}
        placeholder="Viết câu tiếng Anh của bạn…"
        // Phone keyboards would silently fix exactly the mistakes we want the AI to catch.
        autoCorrect="off"
        autoCapitalize="sentences"
        spellCheck={false}
        lang="en"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y read-only:bg-gray-50"
      />

      {!revealed || error ? (
        <button
          onClick={check}
          disabled={loading}
          className="mt-3 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {answer.trim() ? 'Kiểm tra' : 'Xem câu mẫu'}
        </button>
      ) : (
        <button
          onClick={() => {
            setRevealed(false)
            setFeedback(null)
          }}
          className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Viết lại
        </button>
      )}

      {revealed && (
        <div className="mt-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> AI đang chấm câu của bạn…
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {feedback && <AIFeedback fb={feedback} />}

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

          <SaveToCards s={s} answer={answer} feedback={feedback} attemptId={attemptId} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => onGrade('remembered')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm transition-colors ${
                grade === 'remembered'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-600 hover:border-gray-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" /> Nhớ rồi
            </button>
            <button
              onClick={() => onGrade('review')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm transition-colors ${
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

type Restored = { answer: string; feedback?: Feedback }

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
  const [restored, setRestored] = useState<Record<string, Restored> | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [versions, setVersions] = useState<Record<string, number>>({})
  const [batchBusy, setBatchBusy] = useState(false)
  const [batchError, setBatchError] = useState('')

  // Restore graded answers (from saved attempts) and unsent drafts for this day.
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
      setDrafts(Object.fromEntries(Object.entries(d).filter(([id]) => ids.has(id) && !g[id])))
      setGrades(g)
      setRestored(latest)
    })
  }, [data])

  const total = data.sentences.length
  const graded = Object.keys(grades).length
  const remembered = Object.values(grades).filter((g) => g === 'remembered').length
  const pending = data.sentences.filter((s) => !grades[s.id] && drafts[s.id]?.trim())

  // Progress is saved automatically after every graded sentence.
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
    setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([id]) => id !== s.id)))
    writeDraft(data.day, s.id, '')
    scheduleFromLesson(s, g)
  }

  async function gradeAll() {
    setBatchBusy(true)
    setBatchError('')
    try {
      const items = pending.map((s) => ({ sentence: s, answer: drafts[s.id] }))
      const results = await requestFeedbackBatch(items)
      const base = Date.now()
      const nextRestored: Record<string, Restored> = {}
      const nextGrades: Record<string, Grade> = { ...grades }
      results.forEach((fb, i) => {
        const s = items[i].sentence
        const answer = items[i].answer.trim()
        nextRestored[s.id] = { answer, feedback: fb }
        nextGrades[s.id] = fb.verdict === 'correct' ? 'remembered' : 'review'
        saveAttempt({
          id: `${s.id}-${base + i}`,
          sentenceId: s.id,
          day: data.day,
          vietnamese: s.vietnamese,
          model: s.english,
          answer,
          verdict: fb.verdict,
          score: fb.score,
          errors: fb.errors,
          at: new Date(base + i).toISOString(),
          source: 'daily',
          feedback: { summary: fb.summary, corrected: fb.corrected, natural: fb.natural },
        })
        writeDraft(data.day, s.id, '')
        scheduleFromLesson(s, nextGrades[s.id])
      })
      setRestored((r) => ({ ...(r ?? {}), ...nextRestored }))
      setVersions((v) => {
        const nv = { ...v }
        for (const { sentence } of items) nv[sentence.id] = (nv[sentence.id] ?? 0) + 1
        return nv
      })
      setGrades(nextGrades)
      persist(nextGrades)
      setDrafts({})
    } catch (e) {
      setBatchError(e instanceof Error ? e.message : 'AI chưa chấm được.')
    } finally {
      setBatchBusy(false)
    }
  }

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
          Mỗi câu chấm xong được lưu ngay — thoát ra rồi quay lại vẫn còn. Cách nhanh nhất: viết hết các câu rồi bấm <b>Chấm cả bài</b>.
        </p>
      </div>

      <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-2 mb-6 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1 tabular-nums">
            <span>
              Đã chấm {graded}/{total}
              {pending.length > 0 && ` · ${pending.length} câu chờ chấm`}
            </span>
            <span>{remembered} đúng</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 transition-all" style={{ width: `${(graded / total) * 100}%` }} />
          </div>
        </div>
        <button
          onClick={gradeAll}
          disabled={batchBusy || pending.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-30"
        >
          {batchBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Chấm cả bài{pending.length ? ` (${pending.length})` : ''}
        </button>
      </div>
      {batchError && <p className="text-sm text-red-600 mb-4">{batchError}</p>}

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
                      key={`${s.id}-${versions[s.id] ?? 0}`}
                      s={s}
                      day={data.day}
                      grade={grades[s.id]}
                      initialAnswer={restored[s.id]?.answer}
                      initialFeedback={restored[s.id]?.feedback}
                      onDraft={(text) => {
                        writeDraft(data.day, s.id, text)
                        setDrafts((d) => ({ ...d, [s.id]: text }))
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
          <p className="text-sm text-gray-500">
            {done ? `Đã hoàn thành ngày ${data.day} · tiến độ đã lưu` : `câu đúng · đã chấm ${graded}/${total}, tự lưu`}
          </p>
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
