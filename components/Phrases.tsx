'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, ArrowRight, BarChart3, Check, Loader2, Repeat, Sparkles, Volume2, X } from 'lucide-react'
import { Quiz, generate, lessonProgress, type LessonProgress } from '@/components/Lessons'
import { PASS_RATIO, type QuizQ } from '@/lib/lessons'
import { FORMALITY, VERB_GROUPS, dateForGroup, groupForDate, groupRules, isoDate, weekGroups, type VerbEntry, type VerbGroup } from '@/lib/verbGroups'
import { ERROR_TYPES, getAttempts, type Attempt } from '@/lib/situation'

const SESSION = 10

/** Today on this device (null while pre-rendering), so the schedule never uses the build date. */
function useToday(): Date | null {
  const iso = useSyncExternalStore(
    () => () => {},
    () => isoDate(new Date()),
    () => null
  )
  return useMemo(() => (iso ? new Date(`${iso}T12:00:00`) : null), [iso])
}
const progressId = (g: VerbGroup) => `vg:${g.id}`

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-GB'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

/** Built-in fallback questions: pick the correct version of each pattern. */
function fallbackQuiz(groups: VerbGroup[]): QuizQ[] {
  return shuffle(
    groups.flatMap((g) =>
      g.verbs.flatMap((v) =>
        v.patterns.map((p) => {
          const right = Math.random() < 0.5
          return { q: `Chọn câu đúng (${v.verb} – ${p.form}):`, options: right ? [p.right, p.wrong] : [p.wrong, p.right], answer: right ? 0 : 1, why: p.why }
        })
      )
    )
  ).slice(0, SESSION)
}

/** Prepares AI questions for the given groups in the background; falls back to built-in items. */
function usePractice(groups: VerbGroup[], title: string) {
  const [round, setRound] = useState(0)
  const ready = useRef<Promise<QuizQ[]> | null>(null)
  const key = groups.map((g) => g.id).join(',')
  const fetchSet = useCallback(
    () =>
      generate({
        mode: 'quiz',
        count: SESSION,
        base: {
          title: `${title}. Test choosing the right verb for the nuance/formality AND the structure that follows it (to V, V-ing, that-clause, object + to V, preposition).`,
          rules: groupRules(groups),
        },
      }).then((d) => d.quiz as QuizQ[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, title]
  )
  // Only the first set is prepared in advance; later sets are generated when asked for.
  useEffect(() => {
    if (!groups.length) return
    const p = fetchSet()
    p.catch(() => {})
    ready.current = p
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  async function next(): Promise<QuizQ[]> {
    let list: QuizQ[] = []
    try {
      const pending = ready.current
      ready.current = null
      list = (await (pending ?? fetchSet())) ?? []
    } catch {
      list = []
    }
    setRound((r) => r + 1)
    return list.length >= SESSION ? list.slice(0, SESSION) : [...list, ...fallbackQuiz(groups)].slice(0, SESSION)
  }
  return { next, round }
}

// ─── One verb card ────────────────────────────────────────────────────────────

function VerbCard({ v }: { v: VerbEntry }) {
  return (
    <article className="border border-gray-200 rounded-lg overflow-hidden">
      <header className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-900">{v.verb}</h3>
          <span className="text-sm text-gray-500">{v.ipa}</span>
          <button onClick={() => speak(v.verb)} className="text-gray-400 hover:text-gray-900" title="Nghe">
            <Volume2 className="w-4 h-4" />
          </button>
          <span className="ml-auto flex gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">{v.kind}</span>
            <span className={`px-1.5 py-0.5 rounded ${v.formality === 3 ? 'bg-gray-900 text-white' : v.formality === 2 ? 'bg-gray-200 text-gray-800' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {FORMALITY[v.formality]}
            </span>
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-1">
          <span className="italic">{v.en}</span> — {v.vi}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{v.nuance}</p>
      </header>
      <ul className="divide-y divide-gray-100">
        {v.patterns.map((p, k) => (
          <li key={k} className="px-4 py-3 text-sm">
            <p className="font-mono text-[13px] text-gray-900 bg-amber-50 inline-block px-1.5 py-0.5 rounded">{p.form}</p>
            <p className="mt-1.5 text-gray-900 flex items-start gap-1.5">
              <span className="flex-1">{p.ex}</span>
              <button onClick={() => speak(p.ex)} className="text-gray-300 hover:text-gray-900" title="Nghe ví dụ">
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </p>
            <p className="mt-1.5 text-red-600">
              <X className="inline w-3.5 h-3.5 mr-1" />
              <span className="line-through">{p.wrong}</span>
            </p>
            <p className="text-green-700">
              <Check className="inline w-3.5 h-3.5 mr-1" />
              {p.right}
            </p>
            <p className="text-xs text-gray-500 ml-5">{p.why}</p>
          </li>
        ))}
      </ul>
    </article>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function PhraseHome() {
  const [progress, setProgress] = useState<Map<string, LessonProgress> | null>(null)
  useEffect(() => {
    lessonProgress.getAll().then((all) => setProgress(new Map(all.map((p) => [p.id, p]))))
  }, [])
  const today = useToday()
  const todayGroup = today ? groupForDate(today) : null
  const todayIso = today ? isoDate(today) : ''

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Practice Situation
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">Động từ theo nhóm nghĩa</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Mỗi ngày (Thứ 2–7) một nhóm: phiên âm, nghĩa tiếng Anh, sắc thái, ngoại/nội động từ, cấu trúc đi sau — mỗi cấu trúc có ví dụ và lỗi hay mắc. Chủ nhật ôn cả tuần.
      </p>

      {!today ? (
        <div className="h-20 mb-6 bg-gray-50 rounded-lg animate-pulse" />
      ) : todayGroup ? (
        <Link href={`/phrases/${todayGroup.id}`} className="block p-4 mb-6 border-2 border-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Hôm nay</p>
          <p className="text-lg font-semibold text-gray-900">{todayGroup.vi}</p>
          <p className="text-sm text-gray-600">{todayGroup.verbs.map((v) => v.verb).join(' · ')}</p>
        </Link>
      ) : (
        <Link href="/review" className="block p-4 mb-6 border-2 border-gray-900 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Chủ nhật</p>
          <p className="text-lg font-semibold text-gray-900">Ôn tập tuần →</p>
        </Link>
      )}

      <ol className="space-y-2">
        {VERB_GROUPS.map((g, i) => {
          const date = dateForGroup(i)
          const p = progress?.get(progressId(g))
          return (
            <li key={g.id}>
              <Link href={`/phrases/${g.id}`} className={`flex items-center gap-3 p-4 border rounded-lg hover:border-gray-900 ${date === todayIso ? 'border-gray-900' : 'border-gray-200'}`}>
                <span className="w-10 text-xs text-gray-400 tabular-nums">{date.slice(8)}/{date.slice(5, 7)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{g.vi}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {g.verbs.map((v) => v.verb).join(' · ')}
                    {p && ` · ${p.bestScore}/${p.total ?? SESSION}`}
                  </p>
                </div>
                {p?.completedAt ? <Check className="w-4 h-4 text-green-600" /> : <ArrowRight className="w-4 h-4 text-gray-300" />}
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ─── One group ────────────────────────────────────────────────────────────────

export function PhraseGroupView({ id }: { id: string }) {
  const group = VERB_GROUPS.find((g) => g.id === id)
  const groups = useMemo(() => (group ? [group] : []), [group])
  const { next, round } = usePractice(groups, group ? `Verb group "${group.vi}"` : '')
  const [stage, setStage] = useState<'learn' | 'loading' | 'quiz'>('learn')
  const [questions, setQuestions] = useState<QuizQ[]>([])
  const [prev, setPrev] = useState<LessonProgress | undefined>()

  useEffect(() => {
    if (group) lessonProgress.getAll().then((all) => setPrev(all.find((p) => p.id === progressId(group))))
  }, [group])

  if (!group) return <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-gray-500">Không tìm thấy nhóm.</div>

  async function start() {
    setStage('loading')
    setQuestions(await next())
    setStage('quiz')
  }

  function finish(score: number) {
    const now = new Date().toISOString()
    const total = questions.length
    const p: LessonProgress = {
      id: progressId(group!),
      updatedAt: now,
      attempts: (prev?.attempts ?? 0) + 1,
      bestScore: Math.max(prev?.bestScore ?? 0, score),
      total,
      completedAt: prev?.completedAt ?? (score >= Math.ceil(total * PASS_RATIO) ? now : undefined),
    }
    lessonProgress.save([p])
    setPrev(p)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/phrases" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Động từ theo nhóm nghĩa
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">Nhóm “{group.vi}”</h1>
      <p className="text-xs text-gray-500 mt-1 mb-4">
        {group.verbs.length} động từ
        {prev && ` · điểm cao nhất ${prev.bestScore}/${prev.total ?? SESSION}`}
        {prev?.completedAt && ' · ✓ đã hoàn thành'}
      </p>

      {stage === 'learn' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{group.intro}</p>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
            <b>Chọn từ nào?</b> {group.tip}
          </div>
          {group.verbs.map((v) => (
            <VerbCard key={v.verb} v={v} />
          ))}
          <button onClick={start} className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Luyện 10 câu nhóm này
          </button>
          <p className="-mt-2 text-xs text-gray-500 text-center">Chọn đúng động từ theo sắc thái và cấu trúc đi sau. Đạt 8/10 là hoàn thành.</p>
        </div>
      ) : stage === 'loading' ? (
        <div className="p-8 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang chuẩn bị câu hỏi…
        </div>
      ) : (
        <>
          <Quiz key={round} questions={questions} onDone={finish} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setStage('learn')} className="py-2.5 border border-gray-300 rounded-md text-sm">
              Xem lại thẻ
            </button>
            <button onClick={start} className="py-2.5 border border-gray-300 rounded-md text-sm flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 10 câu mới
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sunday: weekly review ────────────────────────────────────────────────────

function weekStats(attempts: Attempt[], from: number, to: number) {
  const list = attempts.filter((a) => (!a.source || a.source === 'daily') && new Date(a.at).getTime() >= from && new Date(a.at).getTime() < to)
  const errors = list.reduce((n, a) => n + a.errors.length, 0)
  const types: Record<string, number> = {}
  for (const a of list) for (const e of a.errors) types[e.type] = (types[e.type] ?? 0) + 1
  return { list, sentences: list.length, perTen: list.length ? Math.round((errors / list.length) * 100) / 10 : null, types }
}

export function WeeklyReview() {
  const device = useToday()
  const today = device ?? new Date()
  const groups = useMemo(() => (device ? weekGroups(device) : []), [device])
  const { next, round } = usePractice(groups, 'Weekly review of verb groups')
  const [stage, setStage] = useState<'home' | 'loading' | 'quiz'>('home')
  const [questions, setQuestions] = useState<QuizQ[]>([])
  const [attempts, setAttempts] = useState<Attempt[] | null>(null)

  useEffect(() => {
    getAttempts().then(setAttempts)
  }, [])

  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
  const thisWeek = attempts ? weekStats(attempts, monday.getTime(), monday.getTime() + 7 * 86400000) : null
  const lastWeek = attempts ? weekStats(attempts, monday.getTime() - 7 * 86400000, monday.getTime()) : null
  const toRedo = (thisWeek?.list ?? []).filter((a) => a.verdict !== 'correct').sort((a, b) => b.errors.length - a.errors.length).slice(0, 8)
  const topTypes = Object.entries(thisWeek?.types ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3)

  async function start() {
    setStage('loading')
    setQuestions(await next())
    setStage('quiz')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Chủ nhật</p>
      <h1 className="text-2xl font-semibold text-gray-900">Ôn tập tuần</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Không học mới — ôn cụm từ của tuần, làm lại câu sai, xem tiến bộ so với tuần trước.</p>

      {/* 1. Phrase recall */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">1. Ôn {groups.length} nhóm động từ của tuần</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-gray-500">
            Chưa có nhóm nào trong tuần này — nhóm đầu tiên bắt đầu Thứ 2 ({dateForGroup(0).split('-').reverse().join('/')}).{' '}
            <Link href="/phrases" className="underline">Xem trước</Link>
          </p>
        ) : stage === 'home' ? (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {groups.map((g) => (
                <Link key={g.id} href={`/phrases/${g.id}`} className="px-2.5 py-1 rounded-full border border-gray-300 text-xs text-gray-700 hover:border-gray-900">
                  {g.vi}
                </Link>
              ))}
            </div>
            <button onClick={start} className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> 10 câu trộn cả tuần
            </button>
          </>
        ) : stage === 'loading' ? (
          <div className="p-6 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Đang chuẩn bị câu hỏi…
          </div>
        ) : (
          <>
            <Quiz key={round} questions={questions} onDone={() => {}} />
            <button onClick={start} className="mt-3 w-full py-2.5 border border-gray-300 rounded-md text-sm">
              10 câu khác
            </button>
          </>
        )}
      </section>

      {/* 2. Redo wrong sentences */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">2. Câu Situation cần làm lại</h2>
        {!attempts ? (
          <div className="h-16 bg-gray-50 rounded-lg animate-pulse" />
        ) : toRedo.length === 0 ? (
          <p className="text-sm text-gray-500">Tuần này không có câu sai — tốt lắm!</p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">Đọc câu tiếng Việt, tự dịch lại trong đầu (hoặc ra giấy) rồi mở đáp án.</p>
            <ul className="space-y-2">
              {toRedo.map((a) => (
                <li key={a.id} className="p-3 border border-gray-200 rounded-lg text-sm">
                  <p className="text-gray-900">{a.vietnamese}</p>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-gray-500">Xem câu của bạn và câu đúng</summary>
                    <p className="mt-1 text-red-600 line-through">{a.answer}</p>
                    <p className="text-green-700">{a.feedback?.corrected ?? a.model}</p>
                    <p className="text-xs text-gray-500 mt-1">{a.errors.map((e) => `${e.wrong} → ${e.correct}`).join(' · ')}</p>
                  </details>
                </li>
              ))}
            </ul>
            <Link href="/situation/review" className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900">
              <Repeat className="w-4 h-4" /> Ôn câu cũ đến hạn →
            </Link>
          </>
        )}
      </section>

      {/* 3. Progress vs last week */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-2">3. Tiến bộ so với tuần trước</h2>
        {thisWeek && lastWeek && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              ['Tuần trước', lastWeek],
              ['Tuần này', thisWeek],
            ].map(([label, w]) => {
              const s = w as ReturnType<typeof weekStats>
              return (
                <div key={label as string} className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500">{label as string}</p>
                  <p className="text-2xl font-semibold text-gray-900 tabular-nums">{s.perTen ?? '—'}</p>
                  <p className="text-xs text-gray-500">lỗi / 10 câu · {s.sentences} câu</p>
                </div>
              )
            })}
          </div>
        )}
        {topTypes.length > 0 && (
          <p className="text-sm text-gray-700 mb-3">
            Lỗi nhiều nhất tuần này: {topTypes.map(([t, n]) => `${ERROR_TYPES[t] ?? t} (${n})`).join(', ')}.{' '}
            <Link href="/lessons" className="underline">Ôn bài học tương ứng</Link>
          </p>
        )}
        <Link href="/summary" className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900">
          <BarChart3 className="w-4 h-4" /> Tổng kết lỗi & xuất cho AI →
        </Link>
      </section>
    </div>
  )
}
