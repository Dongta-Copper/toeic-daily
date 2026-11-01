'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, GraduationCap, RotateCcw, Sparkles, Trash2, Volume2, X } from 'lucide-react'
import { createStore } from '@/lib/store'
import { LESSONS, PASS_RATIO, SESSION_SIZE, checkFix, lessonFor, type FixQ, type Lesson, type QuizQ } from '@/lib/lessons'
import { getAttempts } from '@/lib/situation'
import { THEORY, type TheorySection } from '@/lib/lessonTheory'

export type LessonProgress = { id: string; updatedAt: string; bestScore: number; attempts: number; completedAt?: string; total?: number }
export const lessonProgress = createStore<LessonProgress>('lesson_progress')

/** Extension lessons made earlier ("Bài học của tôi"); kept for review. */
export type CustomLesson = { id: string; updatedAt: string; parent: string; lesson: Lesson; deleted?: boolean }
export const customLessons = createStore<CustomLesson>('lesson_custom')

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

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

/** The learner's own mistakes of one type, as "fix the underlined phrase" questions. */
async function myErrorQuestions(type: string): Promise<FixQ[]> {
  const seen = new Set<string>()
  const out: FixQ[] = []
  for (const a of await getAttempts()) {
    for (const e of a.errors) {
      if (e.type !== type || !e.wrong?.trim() || !e.correct?.trim() || !a.answer.includes(e.wrong)) continue
      const k = e.wrong.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ kind: 'fix', q: 'Câu bạn từng viết — sửa cụm gạch chân', sentence: a.answer, wrong: e.wrong, answer: e.correct, why: e.explanation, mine: true })
    }
  }
  return out
}


// ─── List ─────────────────────────────────────────────────────────────────────

export function LessonList() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [progress, setProgress] = useState<Map<string, LessonProgress>>(new Map())
  const [custom, setCustom] = useState<CustomLesson[]>([])

  useEffect(() => {
    Promise.all([recentErrorCounts(), lessonProgress.getAll(), customLessons.getAll()]).then(([c, p, cl]) => {
      setCounts(c)
      setProgress(new Map(p.map((x) => [x.id, x])))
      setCustom(cl.filter((x) => !x.deleted).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    })
  }, [])

  const ordered = useMemo(() => [...LESSONS].sort((a, b) => (counts?.[b.type] ?? 0) - (counts?.[a.type] ?? 0)), [counts])
  const maxCount = Math.max(1, ...Object.values(counts ?? {}))

  const row = (href: string, title: string, sub: string, p?: LessonProgress, badge?: boolean) => (
    <li key={href}>
      <Link href={href} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{title}</span>
            {badge && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white">Nên học</span>}
          </div>
          <p className="text-xs text-gray-500 mt-1 tabular-nums">
            {sub}
            {p && ` · điểm cao nhất ${p.bestScore}/${p.total ?? 5}`}
          </p>
        </div>
        {p?.completedAt ? <Check className="w-4 h-4 text-green-600" /> : <ArrowRight className="w-4 h-4 text-gray-300" />}
      </Link>
    </li>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Practice Situation
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
        <GraduationCap className="w-6 h-6" /> Bài học nhanh
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Quy tắc → ví dụ công trường → lỗi hay mắc → 10 câu (trắc nghiệm + gõ sửa câu). Đạt 8/10 là hoàn thành. Xếp theo số lỗi của bạn trong 30 ngày.
      </p>

      {!counts ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : (
        <>
          {custom.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Bài học của tôi
              </h2>
              <ul className="space-y-2">
                {custom.map((c) => row(`/lessons/${c.id}`, c.lesson.title, `Mở rộng từ: ${lessonFor(c.parent)?.title ?? c.parent}`, progress.get(c.id)))}
              </ul>
            </section>
          )}
          <ul className="space-y-2">
            {ordered.map((l) => {
              const n = counts[l.type] ?? 0
              return row(`/lessons/${l.type}`, l.title, `${n ? `${n} lỗi trong 30 ngày` : 'Chưa mắc lỗi này'} · ${l.minutes} phút`, progress.get(l.type), n > 0 && n >= maxCount * 0.5)
            })}
          </ul>
        </>
      )}
    </div>
  )
}

// ─── Quiz (10 questions, two kinds) ───────────────────────────────────────────

function Underlined({ sentence, wrong }: { sentence: string; wrong: string }) {
  const i = sentence.indexOf(wrong)
  if (i < 0) return <>{sentence}</>
  return (
    <>
      {sentence.slice(0, i)}
      <span className="underline decoration-red-500 decoration-2 underline-offset-4 text-red-700">{wrong}</span>
      {sentence.slice(i + wrong.length)}
    </>
  )
}

/** Lets the learner overrule an AI answer key that marked a correct answer wrong. */
function Overrule({ onClick }: { onClick: () => void }) {
  const [done, setDone] = useState(false)
  if (done) return <span className="block text-xs text-gray-500 mt-1">Đã tính là đúng.</span>
  return (
    <button
      onClick={() => {
        setDone(true)
        onClick()
      }}
      className="block text-xs text-gray-500 underline mt-1 hover:text-gray-900"
    >
      Đáp án của tôi cũng đúng — tính là đúng
    </button>
  )
}

function Question({ q, onAnswer, onOverrule }: { q: QuizQ; onAnswer: (ok: boolean) => void; onOverrule: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState<boolean | null>(null)

  if (q.kind === 'fix') {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-2">{q.mine ? '✍️ ' : ''}{q.q}</p>
        {q.sentence && (
          <p className="text-base sm:text-lg text-gray-900 leading-relaxed mb-4">
            <Underlined sentence={q.sentence} wrong={q.wrong ?? ''} />
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (result !== null || !text.trim()) return
            const ok = checkFix(q, text)
            setResult(ok)
            onAnswer(ok)
          }}
          className="flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={result !== null}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Gõ cụm đúng…"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {result === null && <button className="px-4 py-2.5 bg-gray-900 text-white text-sm rounded-md">Kiểm tra</button>}
        </form>
        {result !== null && (
          <p className={`mt-3 text-sm ${result ? 'text-green-700' : 'text-red-600'}`}>
            {result ? '✓ ' : '✗ '}Đáp án: <b>{q.answer}</b>
            {q.alts?.length ? <span className="text-gray-500"> (hoặc: {q.alts.join(' / ')})</span> : null}
            <span className="block text-gray-600 mt-0.5">{q.why}</span>
            {!result && <Overrule onClick={onOverrule} />}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-base sm:text-lg text-gray-900 mb-4">{q.q}</p>
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
                onAnswer(k === q.answer)
              }}
              className={`text-left px-4 py-3 rounded-md border text-base ${cls}`}
            >
              {o}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <p className={`mt-3 text-sm ${picked === q.answer ? 'text-green-700' : 'text-red-600'}`}>
          {picked === q.answer ? '✓ ' : '✗ '}
          {q.why}
          {picked !== q.answer && <Overrule onClick={onOverrule} />}
        </p>
      )}
    </div>
  )
}

/** Puts the options of a multiple-choice item in random order (written items list the answer first). */
function shuffleOptions(q: QuizQ): QuizQ {
  if (q.kind === 'fix') return q
  const order = shuffle(q.options.map((_, k) => k))
  return { ...q, options: order.map((k) => q.options[k]), answer: order.indexOf(q.answer) }
}

export function Quiz({
  questions: input,
  onDone,
  onResult,
}: {
  questions: QuizQ[]
  onDone: (score: number, wrong: QuizQ[]) => void
  onResult?: (index: number, ok: boolean) => void // per question, e.g. to track mastery
}) {
  const [questions] = useState(() => input.map(shuffleOptions))
  const [i, setI] = useState(0)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<QuizQ[]>([])
  const q = questions[i]
  const pass = Math.ceil(questions.length * PASS_RATIO)

  if (!q) {
    return (
      <div className="p-5 border border-gray-200 rounded-lg text-center">
        <p className="text-3xl font-semibold text-gray-900 tabular-nums">
          {score}/{questions.length}
        </p>
        <p className="text-sm text-gray-500 mt-1">{score >= pass ? 'Đạt! Bài học được đánh dấu hoàn thành.' : `Chưa đạt ${pass}/${questions.length} — đọc lại quy tắc rồi thử lần nữa.`}</p>
        {wrong.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-xs font-medium text-gray-900 mb-1">Câu sai cần nhớ:</p>
            <ul className="space-y-1">
              {wrong.map((w, k) => (
                <li key={k} className="text-xs text-gray-600">
                  • {w.kind === 'fix' ? `${w.wrong ?? w.sentence ?? w.q} → ${w.answer}` : `${w.q} → ${w.options[w.answer]}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 tabular-nums">
          Câu {i + 1}/{questions.length}
        </p>
        <div className="flex gap-0.5">
          {questions.map((_, k) => (
            <span key={k} className={`w-2 h-2 rounded-full ${k < i ? 'bg-gray-900' : k === i ? 'bg-gray-400' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
      <Question
        key={i}
        q={q}
        onAnswer={(ok) => {
          setAnswered(ok)
          if (ok) setScore((s) => s + 1)
          else setWrong((w) => [...w, q])
          onResult?.(i, ok)
        }}
        onOverrule={() => {
          setScore((s) => s + 1)
          setWrong((w) => w.filter((x) => x !== q))
          onResult?.(i, true)
        }}
      />
      {answered !== null && (
        <button
          onClick={() => {
            const last = i === questions.length - 1
            setI(i + 1)
            setAnswered(null)
            if (last) onDone(score, wrong)
          }}
          className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md"
        >
          {i === questions.length - 1 ? 'Xem kết quả' : 'Tiếp'}
        </button>
      )}
    </div>
  )
}

// ─── One lesson ───────────────────────────────────────────────────────────────

export function LessonView({ type }: { type: string }) {
  const builtIn = lessonFor(type)
  const [custom, setCustom] = useState<CustomLesson | null | undefined>(builtIn ? null : undefined)
  const lesson = builtIn ?? custom?.lesson
  const parentType = builtIn ? type : custom?.parent ?? type

  const [stage, setStage] = useState<'learn' | 'quiz'>('learn')
  const [questions, setQuestions] = useState<QuizQ[]>([])
  const [round, setRound] = useState(0)
  const [prev, setPrev] = useState<LessonProgress | undefined>()
  const [mine, setMine] = useState<FixQ[]>([])

  useEffect(() => {
    lessonProgress.getAll().then((all) => setPrev(all.find((p) => p.id === type)))
    if (!builtIn) customLessons.getAll().then((all) => setCustom(all.find((c) => c.id === type && !c.deleted) ?? null))
  }, [type, builtIn])

  useEffect(() => {
    myErrorQuestions(parentType).then(setMine)
  }, [parentType])

  const theory: TheorySection[] | undefined = builtIn ? THEORY[type]?.sections : custom?.lesson.theory
  const ref = builtIn ? THEORY[type]?.ref : undefined

  if (custom === undefined) return <div className="max-w-2xl mx-auto px-4 py-12"><div className="h-24 bg-gray-50 rounded-lg animate-pulse" /></div>
  if (!lesson) return <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-gray-500">Không tìm thấy bài học.</div>

  /** Up to 10 of the lesson's written questions, in a new order each round. */
  function start() {
    setQuestions(shuffle(lesson!.quiz).slice(0, SESSION_SIZE))
    setRound((r) => r + 1)
    setStage('quiz')
  }

  function finish(score: number) {
    const now = new Date().toISOString()
    const total = questions.length
    const next: LessonProgress = {
      id: type,
      updatedAt: now,
      attempts: (prev?.attempts ?? 0) + 1,
      bestScore: Math.max(prev?.total === total ? prev.bestScore : 0, score),
      total,
      completedAt: prev?.completedAt ?? (score >= Math.ceil(total * PASS_RATIO) ? now : undefined),
    }
    lessonProgress.save([next])
    setPrev(next)
  }

  async function remove() {
    if (!custom || !confirm('Xóa bài học này?')) return
    await customLessons.save([{ ...custom, deleted: true, updatedAt: new Date().toISOString() }])
    window.location.href = '/lessons'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/lessons" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Bài học nhanh
      </Link>
      {custom && (
        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Bài học mở rộng từ “{lessonFor(custom.parent)?.title ?? custom.parent}”
        </p>
      )}
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">{lesson.title}</h1>
      <p className="text-xs text-gray-500 mb-6">
        {lesson.minutes} phút
        {prev && ` · điểm cao nhất ${prev.bestScore}/${prev.total ?? 5}`}
        {prev?.completedAt && ' · ✓ đã hoàn thành'}
        {mine.length > 0 && ` · ${mine.length} lỗi của bạn thuộc loại này`}
      </p>

      {stage === 'quiz' ? (
        <>
          <Quiz key={round} questions={questions} onDone={finish} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setStage('learn')} className="py-2.5 border border-gray-300 rounded-md text-sm">
              Đọc lại quy tắc
            </button>
            <button onClick={start} className="py-2.5 border border-gray-300 rounded-md text-sm flex items-center justify-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Làm lại
            </button>
          </div>
          <Link href="/situation/cards" className="mt-4 block text-center text-sm text-gray-600 hover:text-gray-900">
            Luyện tiếp trong Gym lỗ hổng →
          </Link>
        </>
      ) : (
        <div className="space-y-6">
          {theory ? (
            <section className="space-y-5">
              {theory.map((s, k) => (
                <div key={k}>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">
                    {k + 1}. {s.heading}
                  </h2>
                  <ul className="space-y-2.5">
                    {s.points.map((p, j) => (
                      <li key={j} className="text-sm leading-relaxed pl-3 border-l-2 border-gray-200">
                        <p className="text-gray-800">{p.rule}</p>
                        {p.ex && (
                          <p className="text-gray-900 italic mt-0.5 flex items-start gap-1.5">
                            <span className="not-italic text-gray-400">→</span>
                            <span className="flex-1">{p.ex}</span>
                            <button onClick={() => speak(p.ex!.replace(/\(.*?\)/g, ''))} className="not-italic text-gray-300 hover:text-gray-900" title="Nghe">
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </p>
                        )}
                        {p.warn && <p className="text-xs text-amber-700 mt-0.5">⚠ {p.warn}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {ref && <p className="text-xs text-gray-400">Tham khảo: {ref}</p>}
            </section>
          ) : (
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
          )}
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
          {mine.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 select-none">Xem {mine.length} lỗi bạn từng mắc thuộc loại này</summary>
              <ul className="space-y-1.5 mt-2">
                {mine.slice(0, 8).map((m, k) => (
                  <li key={k}>
                    <span className="text-red-600 line-through">{m.wrong}</span> → <span className="text-green-700">{m.answer}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <button onClick={start} className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-lg flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Luyện {Math.min(SESSION_SIZE, lesson.quiz.length)} câu theo bài này
          </button>
          <p className="-mt-4 text-xs text-gray-500 text-center">Trắc nghiệm + gõ sửa câu, bám đúng các quy tắc ở trên. Đạt 8/10 là hoàn thành.</p>
          {custom && (
            <button onClick={remove} className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Xóa bài học này
            </button>
          )}
        </div>
      )}
    </div>
  )
}
