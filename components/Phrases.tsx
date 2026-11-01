'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, ArrowRight, BarChart3, Check, FileText, Loader2, Repeat, Sparkles, Volume2, X } from 'lucide-react'
import { downloadWord } from '@/lib/wordExport'
import { Quiz, lessonProgress, type LessonProgress } from '@/components/Lessons'
import { VERB_PRACTICE } from '@/lib/verbPractice'
import { LEVEL_LABEL, loadBank, mastery, pickQuestions, record, verbStats, type BankItem, type GroupStats, type Mastery } from '@/lib/verbBank'
import { PASS_RATIO, type QuizQ } from '@/lib/lessons'
import { FORMALITY, VERB_GROUPS, dateForGroup, groupForDate, isoDate, weekGroups, type VerbEntry, type VerbGroup } from '@/lib/verbGroups'
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

/** Right-or-wrong items from the verb cards: pick the correct version of each pattern. */
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

/**
 * 10 questions drawn at random from the groups' 100-question banks (unseen and last-wrong first),
 * optionally for one verb. Each answer updates that question's record, which drives per-verb mastery.
 * Falls back to the right/wrong items from the cards if a bank cannot be loaded.
 */
function usePractice(groups: VerbGroup[]) {
  const [round, setRound] = useState(0)
  const [bank, setBank] = useState<BankItem[] | null>(null)
  const [stats, setStats] = useState<Map<string, GroupStats>>(new Map())
  const [current, setCurrent] = useState<BankItem[]>([])
  const key = groups.map((g) => g.id).join(',')

  useEffect(() => {
    if (!groups.length) return
    Promise.all([Promise.all(groups.map((g) => loadBank(g.id).catch(() => [] as BankItem[]))), verbStats.getAll()]).then(([banks, all]) => {
      setBank(banks.flat())
      setStats(new Map(all.map((s) => [s.id, s])))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  function next(verb?: string): QuizQ[] {
    setRound((r) => r + 1)
    const picked = bank?.length ? pickQuestions(bank, stats, SESSION, verb) : []
    setCurrent(picked)
    if (picked.length) return picked.map((x) => x.q)
    const practice = shuffle(groups.flatMap((g) => VERB_PRACTICE[g.id] ?? []))
    return shuffle([...practice.slice(0, 5), ...fallbackQuiz(groups)]).slice(0, SESSION)
  }

  function result(index: number, ok: boolean) {
    const item = current[index]
    if (!item) return
    setStats((prev) => {
      const s = record(prev.get(item.group), item.group, item.id, ok)
      verbStats.save([s])
      return new Map(prev).set(item.group, s)
    })
  }

  return { next, round, result, bank, stats }
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

// ─── Per-verb mastery ────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<string, string> = {
  new: 'bg-gray-100 text-gray-500',
  weak: 'bg-red-50 text-red-700',
  ok: 'bg-amber-50 text-amber-700',
  solid: 'bg-green-50 text-green-700',
}

function MasteryPanel({ levels, solid, bankSize, onPractise }: { levels: Mastery[]; solid: number; bankSize: number; onPractise: (verb: string) => void }) {
  if (!bankSize) return null
  return (
    <section className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Mức thuộc từng động từ</h2>
        <span className="text-xs text-gray-500 tabular-nums">
          {solid}/{levels.length} động từ đã chắc
        </span>
      </div>
      <ul className="space-y-2.5">
        {levels.map((m) => (
          <li key={m.verb} className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium text-gray-900 truncate">{m.verb}</span>
            <div className="flex-1 min-w-0">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900" style={{ width: `${m.total ? (m.lastRight / m.total) * 100 : 0}%` }} />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 tabular-nums">
                đúng {m.lastRight} · đã làm {m.answered}/{m.total} câu
              </p>
            </div>
            <span className={`text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap ${LEVEL_STYLE[m.level]}`}>{LEVEL_LABEL[m.level]}</span>
            <button onClick={() => onPractise(m.verb)} className="text-xs px-2 py-1 border border-gray-300 rounded hover:border-gray-900 whitespace-nowrap">
              Luyện riêng
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-400 mt-3">“Chắc” = đã làm ít nhất nửa số câu của động từ đó và lần gần nhất đúng từ 85% trở lên.</p>
    </section>
  )
}

// ─── One group ────────────────────────────────────────────────────────────────

export function PhraseGroupView({ id }: { id: string }) {
  const group = VERB_GROUPS.find((g) => g.id === id)
  const groups = useMemo(() => (group ? [group] : []), [group])
  const { next, round, result, bank, stats } = usePractice(groups)
  const [stage, setStage] = useState<'learn' | 'quiz'>('learn')
  const [focus, setFocus] = useState<string | undefined>()
  const [questions, setQuestions] = useState<QuizQ[]>([])
  const [prev, setPrev] = useState<LessonProgress | undefined>()

  useEffect(() => {
    if (group) lessonProgress.getAll().then((all) => setPrev(all.find((p) => p.id === progressId(group))))
  }, [group])

  if (!group) return <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-gray-500">Không tìm thấy nhóm.</div>

  function start(verb?: string) {
    setFocus(verb)
    setQuestions(next(verb))
    setStage('quiz')
    window.scrollTo({ top: 0 })
  }

  const groupBank = (bank ?? []).filter((x) => x.group === group.id)
  const levels = group.verbs.map((v) => mastery(groupBank, stats.get(group.id), v.verb))
  const solid = levels.filter((m) => m.level === 'solid').length

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
          <MasteryPanel levels={levels} solid={solid} bankSize={groupBank.length} onPractise={start} />
          {group.verbs.map((v) => (
            <VerbCard key={v.verb} v={v} />
          ))}
          <button onClick={() => start()} className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Luyện 10 câu ngẫu nhiên
          </button>
          <p className="-mt-2 text-xs text-gray-500 text-center">
            Rút từ kho {groupBank.length || 100} câu (email, biên bản họp, hợp đồng, công trường, IELTS) — ưu tiên câu chưa làm và câu làm sai.
          </p>
        </div>
      ) : (
        <>
          {focus && (
            <p className="mb-2 text-sm text-gray-600">
              Đang luyện riêng: <b>{focus}</b>
            </p>
          )}
          <Quiz key={round} questions={questions} onDone={finish} onResult={result} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setStage('learn')} className="py-2.5 border border-gray-300 rounded-md text-sm">
              Xem thẻ & mức thuộc
            </button>
            <button onClick={() => start(focus)} className="py-2.5 border border-gray-300 rounded-md text-sm flex items-center justify-center gap-1.5">
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
  const { next, round, result } = usePractice(groups)
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

  function start() {
    setQuestions(next())
    setStage('quiz')
  }

  /** Weekly report for any AI chat: progress, error types, wrong sentences and the week's verb groups. */
  function weekReport() {
    const fmt = (d: Date) => d.toLocaleDateString('vi-VN')
    const sunday = new Date(monday.getTime() + 6 * 86400000)
    const lines = [
      `# Báo cáo tuần ${fmt(monday)} – ${fmt(sunday)}`,
      '',
      '## Yêu cầu cho AI',
      'Tôi là kỹ sư quản lý dự án xây dựng người Việt, đang luyện viết tiếng Anh công việc (email, biên bản, thư FIDIC) và IELTS General (mục tiêu 6.5). Dựa trên báo cáo tuần này, hãy:',
      '- Với mỗi câu sai: chỉ ra lỗi, sửa lại, giải thích ngắn bằng tiếng Việt.',
      '- Tìm 3 lỗ hổng lớn nhất và cho mỗi lỗ hổng 5 câu luyện (có đáp án ở cuối).',
      '- Kiểm tra tôi các nhóm động từ đã học trong tuần bằng 10 câu chọn từ theo sắc thái và cấu trúc đi sau.',
      '',
      '## Tiến bộ',
      `- Tuần trước: ${lastWeek?.perTen ?? '—'} lỗi / 10 câu (${lastWeek?.sentences ?? 0} câu)`,
      `- Tuần này: ${thisWeek?.perTen ?? '—'} lỗi / 10 câu (${thisWeek?.sentences ?? 0} câu)`,
      `- Lỗi nhiều nhất: ${topTypes.map(([t, n]) => `${ERROR_TYPES[t] ?? t} (${n})`).join(', ') || '—'}`,
      '',
      '## Nhóm động từ đã học',
      ...(groups.length ? groups.map((g) => `- ${g.vi}: ${g.verbs.map((v) => v.verb).join(', ')}`) : ['- (chưa có)']),
      '',
      '## Câu Situation làm chưa đúng',
    ]
    for (const a of (thisWeek?.list ?? []).filter((x) => x.verdict !== 'correct')) {
      lines.push(
        '',
        `### ${a.vietnamese}`,
        `- **Tôi viết:** ${a.answer}`,
        `- **Câu mẫu:** ${a.model}`,
        `- **Tôi tự đánh dấu:** ${a.errors.map((e) => (e.wrong ? `${ERROR_TYPES[e.type] ?? e.type}: ${e.wrong} → ${e.correct}` : ERROR_TYPES[e.type] ?? e.type)).join('; ') || '—'}`
      )
    }
    return lines.join('\n')
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
            <Quiz key={round} questions={questions} onDone={() => {}} onResult={result} />
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
        <button
          onClick={() => downloadWord(weekReport(), `bao-cao-tuan-${isoDate(monday)}`)}
          disabled={!attempts}
          className="mb-3 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <FileText className="w-4 h-4" /> Xuất báo cáo tuần (Word) để hỏi AI
        </button>
        <Link href="/summary" className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900">
          <BarChart3 className="w-4 h-4" /> Tổng kết lỗi & xuất cho AI →
        </Link>
      </section>
    </div>
  )
}
