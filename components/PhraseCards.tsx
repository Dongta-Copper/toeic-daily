'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Layers, Loader2, Plus, Search, Sparkles, Volume2, X } from 'lucide-react'
import { getAttempts, type Attempt } from '@/lib/situation'
import {
  MODE_LABEL,
  NONE,
  applyResult,
  buildSession,
  checkOwnSentence,
  checkTyped,
  clozeText,
  exampleText,
  generateCards,
  loadBuiltinCards,
  modeFor,
  phraseStates,
  shuffledChoices,
  userCards,
  type PhraseCard,
  type PhraseState,
  type SentenceCheck,
} from '@/lib/phrases'

const PHRASE_ERROR_TYPES = new Set(['preposition', 'collocation', 'word_choice'])
const PROCESSED_KEY = 'phrase_processed_attempts'

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

function readProcessed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(PROCESSED_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function markProcessed(ids: string[]) {
  try {
    localStorage.setItem(PROCESSED_KEY, JSON.stringify([...readProcessed(), ...ids]))
  } catch {}
}

/** Example sentence with the tested part in bold. */
function Example({ card }: { card: PhraseCard }) {
  const m = card.example.match(/^(.*)\[([^\]]+)\](.*)$/)
  if (!m) return <>{card.example}</>
  return (
    <>
      {m[1]}
      {m[2] === NONE ? <span className="text-green-700 font-medium">∅</span> : <b className="text-green-700">{m[2]}</b>}
      {m[3]}
    </>
  )
}

function StatusBadge({ state }: { state?: PhraseState }) {
  if (!state) return <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Mới</span>
  if (state.status === 'mastered') return <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700">Đã thuộc</span>
  return <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 tabular-nums">Bậc {state.box + 1}/5</span>
}

function CardFace({ card, siblings }: { card: PhraseCard; siblings: PhraseCard[] }) {
  return (
    <div className="p-5 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-xl font-semibold text-gray-900">{card.phrase}</p>
        <button onClick={() => speak(exampleText(card))} className="p-1 text-gray-400 hover:text-gray-900" title="Nghe">
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">{card.meaning}</p>
      <p className="text-sm text-gray-900 leading-relaxed mb-3">
        <Check className="inline w-3.5 h-3.5 text-green-600 mr-1" />
        <Example card={card} />
      </p>
      {card.trap && (
        <p className="text-sm text-red-600 leading-relaxed mb-3">
          <X className="inline w-3.5 h-3.5 mr-1" />
          {card.trap}
        </p>
      )}
      {siblings.length > 0 && (
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-medium text-gray-400 uppercase tracking-widest mr-1">Cùng nhóm {card.family}</span>
          {siblings.map((s) => s.phrase).join(' · ')}
        </p>
      )}
    </div>
  )
}

// ─── Review session (one card at a time) ──────────────────────────────────────

function Session({
  queue: initialQueue,
  allCards,
  states,
  onState,
  onExit,
}: {
  queue: PhraseCard[]
  allCards: PhraseCard[]
  states: Map<string, PhraseState>
  onState: (s: PhraseState) => void
  onExit: () => void
}) {
  const [queue, setQueue] = useState(initialQueue)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'learn' | 'ask' | 'result'>(() => (states.has(initialQueue[0]?.id) ? 'ask' : 'learn'))
  const [correct, setCorrect] = useState(false)
  const [picked, setPicked] = useState('')
  const [typed, setTyped] = useState('')
  const [checking, setChecking] = useState(false)
  const [check, setCheck] = useState<SentenceCheck | null>(null)
  const [error, setError] = useState('')
  const [requeued, setRequeued] = useState<Set<string>>(new Set())
  const [score, setScore] = useState({ right: 0, total: 0 })

  const card = queue[index]
  if (!card) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg text-center">
        <p className="text-3xl font-semibold text-gray-900 tabular-nums mb-1">
          {score.right}/{score.total}
        </p>
        <p className="text-sm text-gray-500 mb-5">thẻ trả lời đúng ngay lần đầu</p>
        <button onClick={onExit} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700">
          Xong
        </button>
      </div>
    )
  }

  const state = states.get(card.id)
  const isRetry = requeued.has(card.id) && queue.indexOf(card) !== index
  const mode = isRetry ? 'choice' : modeFor(state)
  const siblings = allCards.filter((c) => c.family && c.family === card.family && c.id !== card.id).slice(0, 5)

  function finish(ok: boolean) {
    setCorrect(ok)
    setPhase('result')
    if (isRetry) return // a second try in the same session does not move the card
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }))
    const next = applyResult(card, state, ok)
    phraseStates.save([next])
    onState(next)
    if (!ok && !requeued.has(card.id)) {
      setRequeued((r) => new Set(r).add(card.id))
      setQueue((q) => [...q, card])
    }
  }

  async function submitSentence() {
    if (!typed.trim()) return
    setChecking(true)
    setError('')
    try {
      const res = await checkOwnSentence(card, typed)
      setCheck(res)
      finish(res.ok)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI chưa chấm được.')
    } finally {
      setChecking(false)
    }
  }

  function nextCard() {
    const n = index + 1
    setIndex(n)
    setPicked('')
    setTyped('')
    setCheck(null)
    setError('')
    const nc = queue[n]
    setPhase(nc && !states.has(nc.id) && !requeued.has(nc.id) ? 'learn' : 'ask')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <span className="tabular-nums">
          {index + 1}/{queue.length}
        </span>
        <span>{phase === 'learn' ? 'Thẻ mới' : MODE_LABEL[mode]}</span>
        <button onClick={onExit} className="text-gray-400 hover:text-gray-900">Dừng</button>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-gray-900 transition-all" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      {phase === 'learn' && (
        <>
          <CardFace card={card} siblings={siblings} />
          <button
            onClick={() => setPhase('ask')}
            className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700"
          >
            Đã đọc — kiểm tra ngay
          </button>
        </>
      )}

      {phase !== 'learn' && (
        <div className="p-5 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-3">{card.meaning}</p>

          {mode === 'choice' && (
            <>
              <p className="text-lg text-gray-900 mb-4">{card.prompt}</p>
              <div className="grid grid-cols-2 gap-2">
                {shuffledChoices(card, index).map((opt) => {
                  const isAnswer = opt === card.answer
                  let cls = 'border-gray-300 text-gray-800 hover:border-gray-900'
                  if (phase === 'result') {
                    if (isAnswer) cls = 'border-green-500 bg-green-50 text-green-700'
                    else if (opt === picked) cls = 'border-red-400 bg-red-50 text-red-600'
                    else cls = 'border-gray-100 text-gray-400'
                  }
                  return (
                    <button
                      key={opt}
                      disabled={phase === 'result'}
                      onClick={() => {
                        setPicked(opt)
                        finish(isAnswer)
                      }}
                      className={`py-3 px-2 border rounded-md text-base font-medium transition-colors ${cls}`}
                    >
                      {opt === NONE ? '∅ (không cần)' : opt}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {mode === 'cloze' && (
            <>
              <p className="text-base text-gray-900 leading-relaxed mb-4">{clozeText(card)}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (phase === 'ask') finish(checkTyped(card, typed))
                }}
                className="flex gap-2"
              >
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  readOnly={phase === 'result'}
                  autoFocus
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={card.type === 'prep' ? 'giới từ (để trống nếu không cần)' : 'từ còn thiếu'}
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {phase === 'ask' && (
                  <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                    Kiểm tra
                  </button>
                )}
              </form>
              {phase === 'result' && (
                <p className={`mt-3 text-sm ${correct ? 'text-green-700' : 'text-red-600'}`}>
                  {correct ? 'Chính xác!' : `Đáp án: ${card.answer === NONE ? 'không cần giới từ' : card.answer}`}
                </p>
              )}
            </>
          )}

          {mode === 'write' && (
            <>
              <p className="text-base text-gray-900 mb-3">
                Viết một câu về công việc của bạn có dùng <b>{card.phrase}</b>
              </p>
              <textarea
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                readOnly={phase === 'result'}
                rows={3}
                autoCorrect="off"
                spellCheck={false}
                placeholder="Câu của bạn…"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              {phase === 'ask' && (
                <button
                  onClick={submitSentence}
                  disabled={checking || !typed.trim()}
                  className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40"
                >
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {checking ? 'AI đang chấm…' : 'AI kiểm tra'}
                </button>
              )}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              {check && (
                <div className={`mt-3 p-3 rounded-md text-sm ${check.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
                  <p className="font-medium mb-1">{check.ok ? 'Dùng đúng!' : 'Chưa đúng'}</p>
                  <p className="leading-relaxed">{check.feedback}</p>
                  {!check.ok && <p className="mt-2 text-gray-900">→ {check.corrected}</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {phase === 'result' && (
        <>
          {mode !== 'write' && (
            <p className={`mt-4 text-sm font-medium ${correct ? 'text-green-700' : 'text-red-600'}`}>
              {correct ? '✓ Đúng' : isRetry ? '✗ Vẫn sai — thẻ sẽ quay lại vào ngày mai' : '✗ Sai — thẻ sẽ hỏi lại ở cuối lượt này'}
            </p>
          )}
          <div className="mt-3">
            <CardFace card={card} siblings={siblings} />
          </div>
          <button onClick={nextCard} className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700">
            Tiếp
          </button>
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'prep', label: 'Giới từ' },
  { key: 'colloc', label: 'Kết hợp từ' },
  { key: 'work', label: 'Công việc' },
  { key: 'ielts', label: 'IELTS' },
  { key: 'mine', label: 'Của tôi' },
  { key: 'learning', label: 'Đang học' },
] as const

export default function PhraseCards() {
  const [builtin, setBuiltin] = useState<PhraseCard[] | null>(null)
  const [mine, setMine] = useState<PhraseCard[]>([])
  const [states, setStates] = useState<Map<string, PhraseState>>(new Map())
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [processed, setProcessed] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<'review' | 'bank' | 'add'>('review')
  const [session, setSession] = useState<PhraseCard[] | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState('')
  const [message, setMessage] = useState('')
  const [created, setCreated] = useState<PhraseCard[]>([])

  useEffect(() => {
    Promise.all([loadBuiltinCards(), userCards.getAll(), phraseStates.getAll(), getAttempts()]).then(([b, u, s, a]) => {
      setBuiltin(b)
      setMine(u)
      setStates(new Map(s.map((x) => [x.id, x])))
      setAttempts(a)
      setProcessed(readProcessed())
    })
  }, [])

  const all = useMemo(() => [...mine, ...(builtin ?? [])], [mine, builtin])
  const plan = useMemo(() => buildSession(all, Array.from(states.values())), [all, states])

  const pendingErrors = useMemo(() => {
    const fromCards = new Set(mine.map((c) => c.fromAttempt).filter(Boolean))
    return attempts.flatMap((a) =>
      processed.has(a.id) || fromCards.has(a.id)
        ? []
        : a.errors
            .filter((e) => PHRASE_ERROR_TYPES.has(e.type))
            .map((e) => ({ ...e, context: a.answer, attemptId: a.id }))
    )
  }, [attempts, mine, processed])

  const bankList = useMemo(() => {
    const q = query.toLowerCase().trim()
    return all.filter((c) => {
      if (q && !`${c.phrase} ${c.meaning}`.toLowerCase().includes(q)) return false
      const s = states.get(c.id)
      switch (filter) {
        case 'prep':
        case 'colloc':
          return c.type === filter
        case 'work':
        case 'ielts':
          return c.domain === filter
        case 'mine':
          return c.source && c.source !== 'builtin'
        case 'learning':
          return s?.status === 'active'
        default:
          return true
      }
    })
  }, [all, states, filter, query])

  const learned = Array.from(states.values())
  const mastered = learned.filter((s) => s.status === 'mastered').length

  async function makeFromErrors() {
    const batch = pendingErrors.slice(0, 10)
    if (!batch.length) return
    setBusy(true)
    setMessage('')
    try {
      const cards = await generateCards({ mode: 'errors', errors: batch }, all)
      const ids = [...new Set(batch.map((e) => e.attemptId))]
      markProcessed(ids)
      setProcessed((p) => new Set([...p, ...ids]))
      setMine((m) => [...cards, ...m])
      setCreated(cards)
      setMessage(cards.length ? `Đã tạo ${cards.length} thẻ từ lỗi của bạn.` : 'Các lỗi này đã có thẻ hoặc không phải lỗi cụm từ.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'AI chưa tạo được thẻ.')
    } finally {
      setBusy(false)
    }
  }

  async function makeManual() {
    if (!manual.trim()) return
    setBusy(true)
    setMessage('')
    try {
      const cards = await generateCards({ mode: 'manual', text: manual.trim() }, all)
      setMine((m) => [...cards, ...m])
      setCreated(cards)
      setManual('')
      setMessage(cards.length ? `Đã tạo ${cards.length} thẻ.` : 'Cụm này đã có trong kho thẻ.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'AI chưa tạo được thẻ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Practice Situation
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Thẻ cụm từ</h1>
        <p className="text-sm text-gray-500 mt-1">Giới từ đi kèm và kết hợp từ — nhận diện → điền vào câu → tự đặt câu.</p>
      </div>

      {!builtin ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : session ? (
        <Session
          queue={session}
          allCards={all}
          states={states}
          onState={(s) => setStates((m) => new Map(m).set(s.id, s))}
          onExit={() => setSession(null)}
        />
      ) : (
        <>
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md text-sm w-fit mb-6">
            {(
              [
                ['review', 'Ôn tập'],
                ['bank', `Kho thẻ (${all.length})`],
                ['add', 'Thêm thẻ'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded transition-colors ${tab === k ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'review' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { value: plan.due.length, label: 'đến hạn ôn' },
                  { value: plan.fresh.length, label: 'thẻ mới hôm nay' },
                  { value: `${mastered}/${all.length}`, label: 'đã thuộc' },
                ].map((s) => (
                  <div key={s.label} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                    <div className="text-xl sm:text-2xl font-semibold text-gray-900 tabular-nums">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              {plan.queue.length ? (
                <button
                  onClick={() => setSession(plan.queue)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700"
                >
                  <Layers className="w-4 h-4" /> Bắt đầu ({plan.queue.length} thẻ)
                </button>
              ) : (
                <p className="p-5 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
                  Hôm nay đã xong. Thẻ mới sẽ có vào ngày mai{plan.unseen ? ` (còn ${plan.unseen} thẻ chưa học)` : ''}.
                </p>
              )}
              <div className="mt-8 text-xs text-gray-500 leading-relaxed space-y-1">
                <p>• Mỗi ngày 10 thẻ mới (thẻ của bạn được ưu tiên) + các thẻ đến hạn ôn.</p>
                <p>• Bậc 1–2: chọn nhanh · Bậc 3–4: điền vào câu · Bậc 5: tự đặt câu, AI chấm.</p>
                <p>• Thẻ quay lại sau 1 → 3 → 7 → 14 → 30 ngày. Sai thì về bậc 1.</p>
              </div>
            </>
          )}

          {tab === 'bank' && (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm cụm từ hoặc nghĩa…"
                  className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-2.5 py-1 rounded-full border text-xs ${
                      filter === f.key ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <ul className="divide-y divide-gray-100 border-y border-gray-100">
                {bankList.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => setOpen(open === c.id ? null : c.id)} className="w-full flex items-center gap-3 py-3 text-left">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.phrase}</p>
                        <p className="text-xs text-gray-500 truncate">{c.meaning}</p>
                      </div>
                      <StatusBadge state={states.get(c.id)} />
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open === c.id ? 'rotate-180' : ''}`} />
                    </button>
                    {open === c.id && (
                      <div className="pb-3">
                        <CardFace card={c} siblings={all.filter((x) => x.family && x.family === c.family && x.id !== c.id).slice(0, 5)} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {bankList.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">Không có thẻ nào.</p>}
            </>
          )}

          {tab === 'add' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-sm font-medium text-gray-900 mb-1">Từ lỗi của bạn</h2>
                <p className="text-xs text-gray-500 mb-3">
                  AI tạo thẻ từ các lỗi giới từ, kết hợp từ và chọn từ trong bài làm của bạn.{' '}
                  {pendingErrors.length ? `Còn ${pendingErrors.length} lỗi chưa có thẻ.` : 'Tất cả lỗi đã có thẻ.'}
                </p>
                <button
                  onClick={makeFromErrors}
                  disabled={busy || !pendingErrors.length}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Tạo thẻ từ {Math.min(10, pendingErrors.length)} lỗi
                </button>
              </section>

              <section>
                <h2 className="text-sm font-medium text-gray-900 mb-1">Tự thêm</h2>
                <p className="text-xs text-gray-500 mb-3">Gõ một cụm từ hoặc dán cả câu, ví dụ: <i>in charge of</i>, <i>be held liable for</i>.</p>
                <div className="flex gap-2">
                  <input
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !busy && makeManual()}
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Cụm từ hoặc câu…"
                    className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    onClick={makeManual}
                    disabled={busy || !manual.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" /> Thêm
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Trong bài học hằng ngày, bấm <b>＋ Lưu cụm từ hay</b> dưới câu mẫu để AI rút cụm từ đáng học thành thẻ.
                </p>
              </section>

              {message && <p className="text-sm text-gray-700">{message}</p>}
              {created.length > 0 && (
                <div className="space-y-3">
                  {created.map((c) => (
                    <CardFace key={c.id} card={c} siblings={[]} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
