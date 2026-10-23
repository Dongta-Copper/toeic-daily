'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock, FileText, Scale, X } from 'lucide-react'
import { createStore } from '@/lib/store'
import { DEADLINES, SCENARIOS, TOPICS, topicFor, type Deadline, type QuizQ } from '@/lib/fidic'

// One record per topic ("topic:<id>"), deadline ("deadline:<id>") and scenario ("scenario:<id>").
export type FidicProgress = { id: string; updatedAt: string; right: number; wrong: number; bestScore?: number; completedAt?: string }
export const fidicProgress = createStore<FidicProgress>('fidic_progress')

function bump(prev: FidicProgress | undefined, id: string, ok: boolean, extra: Partial<FidicProgress> = {}): FidicProgress {
  return {
    id,
    updatedAt: new Date().toISOString(),
    right: (prev?.right ?? 0) + (ok ? 1 : 0),
    wrong: (prev?.wrong ?? 0) + (ok ? 0 : 1),
    bestScore: prev?.bestScore,
    completedAt: prev?.completedAt,
    ...extra,
  }
}

function useProgress() {
  const [map, setMap] = useState<Map<string, FidicProgress> | null>(null)
  useEffect(() => {
    fidicProgress.getAll().then((all) => setMap(new Map(all.map((p) => [p.id, p]))))
  }, [])
  function save(p: FidicProgress) {
    fidicProgress.save([p])
    setMap((m) => new Map(m ?? []).set(p.id, p))
  }
  return { map, save }
}

const unitOf = (d: Deadline) => d.unit ?? 'ngày'

// ─── Shared MCQ card ──────────────────────────────────────────────────────────

function Choice({ q, onAnswer, footer }: { q: QuizQ; onAnswer: (ok: boolean) => void; footer?: string }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <div>
      <p className="text-base sm:text-lg text-gray-900 leading-relaxed mb-4">{q.q}</p>
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
              className={`text-left px-4 py-3 rounded-md border text-sm sm:text-base ${cls}`}
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
          {footer && <span className="block text-xs text-gray-500 mt-1">{footer}</span>}
        </p>
      )}
    </div>
  )
}

// ─── Home with three tabs ─────────────────────────────────────────────────────

type Tab = 'topics' | 'scenarios' | 'deadlines'

export function FidicHome() {
  const [tab, setTab] = useState<Tab>('topics')
  const { map, save } = useProgress()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">FIDIC Red Book 2017</p>
      <h1 className="text-2xl font-semibold text-gray-900">Học FIDIC</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Điều kiện chung (General Conditions). Hợp đồng thật có thể thay đổi thời hạn trong Particular Conditions / Contract Data.</p>

      <div className="flex p-0.5 bg-gray-100 rounded-md text-sm mb-6">
        {(
          [
            ['topics', 'Chủ đề', FileText],
            ['scenarios', 'Tình huống', Scale],
            ['deadlines', 'Mốc thời hạn', Clock],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded ${tab === id ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {!map ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : tab === 'topics' ? (
        <TopicList map={map} />
      ) : tab === 'scenarios' ? (
        <ScenarioDrill map={map} save={save} />
      ) : (
        <DeadlineDrill map={map} save={save} />
      )}
    </div>
  )
}

function TopicList({ map }: { map: Map<string, FidicProgress> }) {
  const done = TOPICS.filter((t) => map.get(`topic:${t.id}`)?.completedAt).length
  return (
    <>
      <p className="text-xs text-gray-500 mb-3 tabular-nums">
        Hoàn thành {done}/{TOPICS.length} chủ đề · theo thứ tự vòng đời hợp đồng
      </p>
      <ol className="space-y-2">
        {TOPICS.map((t, i) => {
          const p = map.get(`topic:${t.id}`)
          return (
            <li key={t.id}>
              <Link href={`/fidic/${t.id}`} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-900">
                <span className="w-6 text-xs text-gray-400 tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ĐK {t.clauses}
                    {p?.bestScore !== undefined && ` · điểm cao nhất ${p.bestScore}/${t.quiz.length}`}
                  </p>
                </div>
                {p?.completedAt ? <Check className="w-4 h-4 text-green-600" /> : <ArrowRight className="w-4 h-4 text-gray-300" />}
              </Link>
            </li>
          )
        })}
      </ol>
    </>
  )
}

/** Weak items first: never seen, then most wrong relative to right, then oldest. */
function weakFirst<T extends { id: string }>(items: T[], map: Map<string, FidicProgress>, prefix: string, n: number) {
  const score = (it: T) => {
    const p = map.get(`${prefix}:${it.id}`)
    if (!p) return 1000 + Math.random()
    return (p.wrong + 1) / (p.right + 1) * 10 - p.right + Math.random()
  }
  return [...items].sort((a, b) => score(b) - score(a)).slice(0, n)
}

function ScenarioDrill({ map, save }: { map: Map<string, FidicProgress>; save: (p: FidicProgress) => void }) {
  const [round, setRound] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => weakFirst(SCENARIOS, map, 'scenario', 5), [round])
  const [i, setI] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const s = list[i]

  if (!s)
    return (
      <div className="p-6 border border-gray-200 rounded-lg text-center">
        <p className="text-3xl font-semibold tabular-nums">
          {score}/{list.length}
        </p>
        <p className="text-sm text-gray-500 mt-1">Tình huống sai sẽ được hỏi lại ở lượt sau.</p>
        <button
          onClick={() => {
            setRound(round + 1)
            setI(0)
            setScore(0)
          }}
          className="mt-4 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-md"
        >
          Lượt mới 5 tình huống
        </button>
      </div>
    )

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <p className="text-xs text-gray-400 mb-2 tabular-nums">
        Tình huống {i + 1}/{list.length}
      </p>
      <Choice
        key={s.id}
        q={{ q: s.situation, options: s.options, answer: s.answer, why: s.why }}
        footer={`Căn cứ: FIDIC 2017 – ĐK ${s.clause}`}
        onAnswer={(ok) => {
          setAnswered(true)
          if (ok) setScore(score + 1)
          save(bump(map.get(`scenario:${s.id}`), `scenario:${s.id}`, ok))
        }}
      />
      {answered && (
        <button
          onClick={() => {
            setI(i + 1)
            setAnswered(false)
          }}
          className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md"
        >
          {i === list.length - 1 ? 'Xem kết quả' : 'Tình huống tiếp'}
        </button>
      )}
    </div>
  )
}

function DeadlineDrill({ map, save }: { map: Map<string, FidicProgress>; save: (p: FidicProgress) => void }) {
  const [round, setRound] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => weakFirst(DEADLINES, map, 'deadline', 10), [round])
  const [i, setI] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const d = list[i]
  const known = DEADLINES.filter((x) => (map.get(`deadline:${x.id}`)?.right ?? 0) >= 2).length

  if (!d)
    return (
      <div className="p-6 border border-gray-200 rounded-lg text-center">
        <p className="text-3xl font-semibold tabular-nums">
          {score}/{list.length}
        </p>
        <p className="text-sm text-gray-500 mt-1">Mốc nào sai sẽ được ưu tiên ở lượt sau.</p>
        <button
          onClick={() => {
            setRound(round + 1)
            setI(0)
            setScore(0)
          }}
          className="mt-4 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-md"
        >
          Lượt mới 10 mốc
        </button>
      </div>
    )

  function check() {
    const ok = Number(input.trim()) === d.days
    setResult(ok)
    if (ok) setScore(score + 1)
    save(bump(map.get(`deadline:${d.id}`), `deadline:${d.id}`, ok))
  }

  return (
    <>
      <p className="text-xs text-gray-500 mb-3 tabular-nums">
        Đã thuộc {known}/{DEADLINES.length} mốc (đúng ≥ 2 lần)
      </p>
      <div className="p-5 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-400 mb-2 tabular-nums">
          {i + 1}/{list.length} · ĐK {d.clause}
        </p>
        <p className="text-base sm:text-lg text-gray-900 leading-relaxed mb-4">{d.what}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (result === null && input.trim()) check()
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            autoFocus
            disabled={result !== null}
            placeholder="?"
            className="w-24 border border-gray-300 rounded-md px-3 py-2.5 text-lg text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <span className="text-gray-600">{unitOf(d)}</span>
          {result === null && (
            <button type="submit" className="ml-auto px-4 py-2.5 bg-gray-900 text-white text-sm rounded-md">
              Kiểm tra
            </button>
          )}
        </form>
        {result !== null && (
          <>
            <p className={`mt-3 text-sm ${result ? 'text-green-700' : 'text-red-600'}`}>
              {result ? <Check className="inline w-4 h-4 mr-1" /> : <X className="inline w-4 h-4 mr-1" />}
              Đáp án: <b>
                {d.days} {unitOf(d)}
              </b>{' '}
              (FIDIC 2017 – ĐK {d.clause})
            </p>
            <button
              onClick={() => {
                setI(i + 1)
                setInput('')
                setResult(null)
              }}
              className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md"
            >
              {i === list.length - 1 ? 'Xem kết quả' : 'Tiếp'}
            </button>
          </>
        )}
      </div>
    </>
  )
}

// ─── One topic ────────────────────────────────────────────────────────────────

export function FidicTopicView({ id }: { id: string }) {
  const topic = topicFor(id)
  const { map, save } = useProgress()
  const [stage, setStage] = useState<'learn' | 'quiz'>('learn')
  const [i, setI] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)

  if (!topic) return <div className="max-w-2xl mx-auto px-4 py-12 text-sm text-gray-500">Không tìm thấy chủ đề.</div>
  const key = `topic:${topic.id}`
  const prev = map?.get(key)
  const deadlines = DEADLINES.filter((d) => d.topic === topic.id)
  const next = TOPICS[TOPICS.findIndex((t) => t.id === topic.id) + 1]
  const q = topic.quiz[i]

  function finish(final: number) {
    const now = new Date().toISOString()
    save({
      id: key,
      updatedAt: now,
      right: (prev?.right ?? 0) + final,
      wrong: (prev?.wrong ?? 0) + topic!.quiz.length - final,
      bestScore: Math.max(prev?.bestScore ?? 0, final),
      completedAt: prev?.completedAt ?? (final >= 4 ? now : undefined),
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/fidic" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Học FIDIC
      </Link>
      <p className="text-xs text-gray-400 mb-1">FIDIC 2017 · ĐK {topic.clauses}</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">{topic.title}</h1>
      <p className="text-xs text-gray-500 mb-6">
        {prev?.bestScore !== undefined && `Điểm cao nhất ${prev.bestScore}/${topic.quiz.length}`}
        {prev?.completedAt && ' · ✓ đã hoàn thành'}
      </p>

      {stage === 'learn' ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Nội dung chính</h2>
            <ul className="space-y-2.5">
              {topic.summary.map((s, k) => (
                <li key={k} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                  <span className="text-gray-400">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </section>
          {deadlines.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-gray-900 mb-2">Mốc thời hạn</h2>
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {deadlines.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                    <span className="w-16 shrink-0 font-semibold text-gray-900 tabular-nums">
                      {d.days} {unitOf(d)}
                    </span>
                    <span className="flex-1 text-gray-700">{d.what}</span>
                    <span className="text-xs text-gray-400 shrink-0">{d.clause}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <h2 className="text-sm font-medium text-gray-900 mb-2">Thuật ngữ</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {topic.terms.map((t) => (
                <li key={t.en} className="p-2.5 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">{t.en}</p>
                  <p className="text-xs text-gray-500">{t.vi}</p>
                </li>
              ))}
            </ul>
          </section>
          <button onClick={() => setStage('quiz')} className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-lg">
            Kiểm tra {topic.quiz.length} câu
          </button>
        </div>
      ) : q ? (
        <div className="p-5 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-400 mb-2 tabular-nums">
            Câu {i + 1}/{topic.quiz.length}
          </p>
          <Choice
            key={`${i}`}
            q={q}
            onAnswer={(ok) => {
              setAnswered(true)
              if (ok) setScore(score + 1)
            }}
          />
          {answered && (
            <button
              onClick={() => {
                if (i === topic.quiz.length - 1) finish(score)
                setI(i + 1)
                setAnswered(false)
              }}
              className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md"
            >
              {i === topic.quiz.length - 1 ? 'Xem kết quả' : 'Tiếp'}
            </button>
          )}
        </div>
      ) : (
        <div className="p-6 border border-gray-200 rounded-lg text-center">
          <p className="text-3xl font-semibold tabular-nums">
            {score}/{topic.quiz.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">{score >= 4 ? 'Đạt! Chủ đề được đánh dấu hoàn thành.' : 'Chưa đạt 4/5 — đọc lại nội dung rồi thử lại.'}</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => {
                setStage('learn')
                setI(0)
                setScore(0)
              }}
              className="px-4 py-2.5 border border-gray-300 rounded-md text-sm"
            >
              Đọc lại & làm lại
            </button>
            {next && (
              <Link href={`/fidic/${next.id}`} className="px-4 py-2.5 bg-gray-900 text-white rounded-md text-sm">
                Chủ đề tiếp: {next.title} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
