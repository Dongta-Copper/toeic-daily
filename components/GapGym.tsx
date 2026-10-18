'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Dumbbell, Lightbulb, Loader2, Map as MapIcon, Shuffle, Volume2, X } from 'lucide-react'
import {
  MODE_INFO,
  applyOutcome,
  blanked,
  clusterViews,
  gapProgress,
  hash01,
  loadGapData,
  modeFor,
  norm,
  shuffle,
  syncMistakes,
  todayPool,
  type ClusterView,
  type GapData,
  type GapItem,
  type GapProgress,
  type Mode,
  type Outcome,
} from '@/lib/gaps'

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

/** Sentence with one chunk in bold. */
function Marked({ sentence, chunk, className }: { sentence: string; chunk?: string; className: string }) {
  const i = chunk ? sentence.toLowerCase().indexOf(chunk.toLowerCase()) : -1
  if (i < 0) return <>{sentence}</>
  return (
    <>
      {sentence.slice(0, i)}
      <b className={className}>{sentence.slice(i, i + chunk!.length)}</b>
      {sentence.slice(i + chunk!.length)}
    </>
  )
}

function CardBack({ item, rule }: { item: GapItem; rule?: string }) {
  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-white space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold text-green-700">{item.correct}</p>
        <button onClick={() => speak(item.sentenceCorrect)} className="p-1 text-gray-400 hover:text-gray-900" title="Nghe">
          <Volume2 className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-gray-600">{item.vietnamese}</p>
      <p className="text-sm text-gray-900 leading-relaxed">
        <Check className="inline w-3.5 h-3.5 text-green-600 mr-1" />
        <Marked sentence={item.sentenceCorrect} chunk={item.correct} className="text-green-700" />
      </p>
      {item.sentenceWrong && (
        <p className="text-sm text-gray-500 leading-relaxed">
          <X className="inline w-3.5 h-3.5 text-red-500 mr-1" />
          {item.kind === 'mistake' && <span className="text-xs text-gray-400 mr-1">bạn đã viết:</span>}
          <Marked sentence={item.sentenceWrong} chunk={item.errorWord} className="text-red-600 line-through" />
        </p>
      )}
      {rule && <p className="text-xs text-gray-500 leading-relaxed pt-1 border-t border-gray-100">💡 {rule}</p>}
    </div>
  )
}

// ─── Match ────────────────────────────────────────────────────────────────────

function MatchRound({ items, seed, onDone }: { items: GapItem[]; seed: string; onDone: (results: Map<string, Outcome | null>) => void }) {
  const wrongVariant = items.every((i) => i.wrong) && hash01(seed) < 0.5
  const left = useMemo(() => shuffle(items, seed + 'L'), [items, seed])
  const right = useMemo(() => shuffle(items, seed + 'R'), [items, seed])
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [misses, setMisses] = useState<Map<string, number>>(new Map())
  const [flash, setFlash] = useState<string | null>(null)
  const startRef = useRef(0)
  useEffect(() => {
    startRef.current = performance.now()
  }, [])
  const [elapsed, setElapsed] = useState(0)

  function choose(rightId: string, at: number) {
    if (!picked) return
    if (picked === rightId) {
      const next = new Set(done).add(rightId)
      setDone(next)
      setPicked(null)
      if (next.size === items.length) {
        setElapsed(Math.max(1, Math.round((at - startRef.current) / 1000)))
        onDone(new Map(items.map((i) => [i.id, (misses.get(i.id) ?? 0) === 0 ? 'recognise' : null])))
      }
    } else {
      setMisses((m) => new Map(m).set(picked, (m.get(picked) ?? 0) + 1))
      setFlash(rightId)
      setTimeout(() => setFlash(null), 400)
    }
  }

  const tile = 'w-full min-h-12 px-3 py-2 rounded-md border text-sm text-left transition-colors'
  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        {wrongVariant ? 'Ghép lỗi sai (trái) với cách viết đúng (phải).' : 'Ghép nghĩa (trái) với cụm tiếng Anh (phải).'}
        {elapsed > 0 && <b className="ml-2 text-gray-900">{elapsed} giây</b>}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {left.map((i) =>
            done.has(i.id) ? (
              <div key={i.id} className={`${tile} border-transparent bg-green-50 text-green-700 opacity-60`}>
                ✓
              </div>
            ) : (
              <button
                key={i.id}
                onClick={() => setPicked(i.id)}
                className={`${tile} ${picked === i.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-800'}`}
              >
                {wrongVariant ? <span className="line-through decoration-red-400">{i.wrong}</span> : i.vietnamese}
              </button>
            )
          )}
        </div>
        <div className="space-y-2">
          {right.map((i) =>
            done.has(i.id) ? (
              <div key={i.id} className={`${tile} border-transparent bg-green-50 text-green-700 opacity-60`}>
                {i.correct}
              </div>
            ) : (
              <button
                key={i.id}
                onClick={(e) => choose(i.id, e.timeStamp)}
                className={`${tile} font-medium ${flash === i.id ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-300 text-gray-900'}`}
              >
                {i.correct}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Spot the error ───────────────────────────────────────────────────────────

function SpotCard({ item, seed, onResult }: { item: GapItem; seed: string; onResult: (o: Outcome) => void }) {
  const noError = hash01(seed + 'noerr') < 0.25
  const sentence = noError ? item.sentenceCorrect : item.sentenceWrong!
  const tokens = useMemo(() => {
    const out: { text: string; start: number; end: number }[] = []
    const re = /\S+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(sentence))) out.push({ text: m[0], start: m.index, end: m.index + m[0].length })
    return out
  }, [sentence])
  const errStart = noError ? -1 : sentence.indexOf(item.errorWord!)
  const errEnd = errStart + (item.errorWord?.length ?? 0)
  const isTarget = (t: { start: number; end: number }) => errStart >= 0 && t.start < errEnd && t.end > errStart

  const [stage, setStage] = useState<'find' | 'fix' | 'done'>('find')
  const [tapped, setTapped] = useState<number | null>(null)
  const [fix, setFix] = useState('')
  const [ok, setOk] = useState<boolean | null>(null)

  function tap(i: number | 'none') {
    if (stage !== 'find') return
    if (i === 'none') {
      const right = noError
      setOk(right)
      setStage('done')
      onResult(right ? 'recognise' : 'wrong')
      return
    }
    setTapped(i)
    if (!noError && isTarget(tokens[i])) setStage('fix')
    else {
      setOk(false)
      setStage('done')
      onResult('wrong')
    }
  }

  function submitFix(value: string) {
    const replaced = item.sentenceWrong!.replace(item.errorWord!, value).replace(/\s+/g, ' ')
    const right = norm(value) === norm(item.correct) || norm(replaced) === norm(item.sentenceCorrect)
    setOk(right)
    setStage('done')
    onResult(right ? 'produce' : 'wrong')
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">
        {stage === 'fix' ? 'Đúng chỗ sai rồi! Sửa lại thành gì?' : 'Chạm vào chữ SAI trong câu — hoặc chọn “Không có lỗi”.'}
      </p>
      <p className="text-lg leading-loose text-gray-900 mb-4">
        {tokens.map((t, i) => {
          let cls = 'hover:bg-gray-100'
          if (stage !== 'find') {
            if (isTarget(t)) cls = 'bg-red-100 text-red-700 line-through decoration-red-500'
            else if (i === tapped) cls = 'bg-amber-100'
          }
          return (
            <button key={i} onClick={() => tap(i)} className={`px-0.5 rounded ${cls}`}>
              {t.text}{' '}
            </button>
          )
        })}
      </p>
      {stage === 'find' && (
        <button onClick={() => tap('none')} className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:border-gray-900">
          Không có lỗi
        </button>
      )}
      {stage === 'fix' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitFix(fix)
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={fix}
            onChange={(e) => setFix(e.target.value)}
            autoFocus
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={`thay cho “${item.errorWord}”`}
            className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md">
            Sửa
          </button>
          <button type="button" onClick={() => submitFix('')} className="px-3 py-2.5 border border-gray-300 rounded-md text-sm text-gray-700">
            Bỏ chữ này
          </button>
        </form>
      )}
      {stage === 'done' && (
        <p className={`text-sm font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}>
          {noError
            ? ok
              ? '✓ Đúng — câu này không có lỗi.'
              : '✗ Câu này thực ra đúng.'
            : ok
              ? '✓ Tìm đúng và sửa đúng!'
              : tapped !== null && isTarget(tokens[tapped])
                ? `✗ Tìm đúng chỗ, nhưng phải sửa thành “${item.correct}”.`
                : `✗ Chữ sai là “${item.errorWord}”.`}
        </p>
      )}
    </div>
  )
}

// ─── Type the phrase ──────────────────────────────────────────────────────────

function TypeCard({ item, onResult }: { item: GapItem; onResult: (o: Outcome) => void }) {
  const [value, setValue] = useState('')
  const [hints, setHints] = useState(0)
  const [ok, setOk] = useState<boolean | null>(null)
  const hintText = item.correct.slice(0, hints) + (hints < item.correct.length ? '…' : '')

  function check() {
    const right = norm(value) === norm(item.correct)
    setOk(right)
    onResult(right ? (hints === 0 ? 'produce' : 'recognise') : 'wrong')
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">Nghĩa / gợi ý</p>
      <p className="text-base text-gray-900 mb-3">{item.vietnamese}</p>
      <p className="text-base text-gray-800 leading-relaxed mb-4 p-3 bg-gray-50 rounded-md">{blanked(item)}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (ok === null && value.trim()) check()
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={ok !== null}
          autoFocus
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Gõ cụm từ còn thiếu"
          className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        {ok === null && (
          <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md">
            Kiểm tra
          </button>
        )}
      </form>
      {ok === null && (
        <button
          onClick={() => setHints((h) => Math.min(item.correct.length, h + 1))}
          className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900"
        >
          <Lightbulb className="w-3.5 h-3.5" /> Gợi ý chữ cái {hints > 0 && <b className="text-gray-700 ml-1">{hintText}</b>}
        </button>
      )}
      {ok !== null && (
        <p className={`mt-3 text-sm font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}>
          {ok ? (hints ? '✓ Đúng (có dùng gợi ý — chưa tính là thuộc)' : '✓ Chính xác!') : `✗ Đáp án: ${item.correct}`}
        </p>
      )}
    </div>
  )
}

// ─── Rewrite my sentence ──────────────────────────────────────────────────────

function RewriteCard({ item, onResult }: { item: GapItem; onResult: (o: Outcome) => void }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<{ ok: boolean; feedback: string; corrected: string } | null>(null)
  const [error, setError] = useState('')

  async function submit() {
    if (!value.trim()) return
    if (norm(value) === norm(item.sentenceCorrect)) {
      setRes({ ok: true, feedback: 'Câu sửa chính xác.', corrected: value })
      onResult('produce')
      return
    }
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/gaps/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentenceWrong: item.sentenceWrong, sentenceCorrect: item.sentenceCorrect, correct: item.correct, wrong: item.wrong, answer: value }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      setRes(data)
      onResult(data.ok ? 'produce' : 'wrong')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI chưa chấm được.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">Đây là câu bạn từng viết. Viết lại cho đúng:</p>
      <p className="text-base text-red-700 leading-relaxed p-3 bg-red-50 rounded-md mb-3">{item.sentenceWrong}</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={!!res}
        rows={3}
        autoCorrect="off"
        spellCheck={false}
        placeholder="Câu đã sửa…"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      {!res && (
        <button
          onClick={submit}
          disabled={busy || !value.trim()}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md disabled:opacity-40"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} {busy ? 'AI đang chấm…' : 'Kiểm tra'}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {res && (
        <div className={`mt-3 p-3 rounded-md text-sm ${res.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          <p className="font-medium mb-1">{res.ok ? '✓ Sửa đúng!' : '✗ Chưa đúng'}</p>
          <p className="leading-relaxed">{res.feedback}</p>
          {!res.ok && <p className="mt-1 text-gray-900">→ {res.corrected}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Session ──────────────────────────────────────────────────────────────────

type Step = { kind: 'match'; items: GapItem[] } | { kind: Exclude<Mode, 'match'>; item: GapItem; retry?: boolean }

function buildSteps(pool: GapItem[], mode: Mode | 'auto', progress: Map<string, GapProgress>, seed: string): Step[] {
  if (mode === 'match') {
    const order = shuffle(pool, seed)
    const out: Step[] = []
    for (let i = 0; i < order.length; i += 6) if (order.slice(i, i + 6).length >= 3) out.push({ kind: 'match', items: order.slice(i, i + 6) })
    return out
  }
  if (mode !== 'auto') {
    return shuffle(pool, seed).map((item) => {
      const ok = mode === 'type' || (mode === 'spot' && item.sentenceWrong && item.errorWord) || (mode === 'rewrite' && item.kind === 'mistake' && item.sentenceWrong)
      return { kind: ok ? mode : 'type', item }
    })
  }
  // Auto: warm up by matching the new cards, then one exercise per card at its own level (interleaved).
  const fresh = pool.filter((i) => !progress.has(i.id))
  const steps: Step[] = []
  for (let i = 0; i < fresh.length; i += 6) if (fresh.slice(i, i + 6).length >= 3) steps.push({ kind: 'match', items: fresh.slice(i, i + 6) })
  for (const item of shuffle(pool, seed)) steps.push({ kind: modeFor(item, progress.get(item.id)), item })
  return steps
}

function Session({
  pool,
  mode,
  data,
  rules,
  onProgress,
  onExit,
}: {
  pool: GapItem[]
  mode: Mode | 'auto'
  data: GapData
  rules: Map<string, string>
  onProgress: (p: GapProgress) => void
  onExit: (again: boolean) => void
}) {
  const [seed] = useState(() => String(Date.now()))
  const [steps, setSteps] = useState(() => buildSteps(pool, mode, data.progress, seed))
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [tally, setTally] = useState({ produce: 0, recognise: 0, wrong: 0 })
  const [progress, setProgress] = useState(data.progress)
  const step = steps[index]

  function record(item: GapItem, outcome: Outcome, retry?: boolean) {
    setTally((t) => ({ ...t, [outcome]: t[outcome] + 1 }))
    if (retry) return // the second try in the same session does not change the schedule
    const next = applyOutcome(item.id, progress.get(item.id), outcome)
    gapProgress.save([next])
    setProgress((m) => new Map(m).set(item.id, next))
    onProgress(next)
    if (outcome === 'wrong') setSteps((s) => [...s, { kind: 'type', item, retry: true }])
  }

  if (!step) {
    return (
      <div className="p-6 border border-gray-200 rounded-lg text-center">
        <p className="text-sm text-gray-500 mb-4">Kết thúc lượt luyện</p>
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span className="text-green-700">
            <b className="text-2xl block tabular-nums">{tally.produce}</b>tự viết đúng
          </span>
          <span className="text-gray-700">
            <b className="text-2xl block tabular-nums">{tally.recognise}</b>nhận ra
          </span>
          <span className="text-red-600">
            <b className="text-2xl block tabular-nums">{tally.wrong}</b>sai
          </span>
        </div>
        <div className="flex justify-center gap-2">
          {mode !== 'auto' && (
            <button onClick={() => onExit(true)} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md">
              Luyện tiếp
            </button>
          )}
          <button onClick={() => onExit(false)} className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-md">
            Xong
          </button>
        </div>
      </div>
    )
  }

  const label = step.kind === 'match' ? MODE_INFO.match.label : MODE_INFO[step.kind].label
  return (
    <div>
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <span className="tabular-nums">
          {index + 1}/{steps.length}
        </span>
        <span>
          {label}
          {step.kind !== 'match' && step.retry ? ' · làm lại' : ''}
        </span>
        <button onClick={() => onExit(false)} className="text-gray-400 hover:text-gray-900">
          Dừng
        </button>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-gray-900 transition-all" style={{ width: `${(index / steps.length) * 100}%` }} />
      </div>

      <div key={index} className="p-4 sm:p-5 border border-gray-200 rounded-lg">
        {step.kind === 'match' && (
          <MatchRound
            items={step.items}
            seed={seed + index}
            onDone={(res) => {
              for (const item of step.items) {
                const o = res.get(item.id)
                if (o) record(item, o)
              }
              setAnswered(true)
            }}
          />
        )}
        {step.kind === 'spot' && <SpotCard item={step.item} seed={seed + step.item.id} onResult={(o) => (record(step.item, o, step.retry), setAnswered(true))} />}
        {step.kind === 'type' && <TypeCard item={step.item} onResult={(o) => (record(step.item, o, step.retry), setAnswered(true))} />}
        {step.kind === 'rewrite' && <RewriteCard item={step.item} onResult={(o) => (record(step.item, o, step.retry), setAnswered(true))} />}
      </div>

      {answered && step.kind !== 'match' && <CardBack item={step.item} rule={rules.get(step.item.clusterId)} />}
      {answered && (
        <button
          onClick={() => {
            setIndex(index + 1)
            setAnswered(false)
          }}
          className="mt-4 w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700"
        >
          Tiếp
        </button>
      )}
    </div>
  )
}

// ─── Gap map ──────────────────────────────────────────────────────────────────

const STATUS = {
  red: { dot: 'bg-red-500', label: 'Lỗ hổng lớn', text: 'text-red-700' },
  yellow: { dot: 'bg-amber-400', label: 'Đang vá', text: 'text-amber-700' },
  green: { dot: 'bg-green-500', label: 'Đã vá', text: 'text-green-700' },
}

function GapMap({ views, progress, onPractise }: { views: ClusterView[]; progress: Map<string, GapProgress>; onPractise: (v: ClusterView) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      {views.map((v) => {
        const s = STATUS[v.status]
        return (
          <div key={v.cluster.id} className="border border-gray-200 rounded-lg">
            <button onClick={() => setOpen(open === v.cluster.id ? null : v.cluster.id)} className="w-full text-left p-4">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{v.cluster.title}</p>
                  <p className="text-xs text-gray-500 mt-1 tabular-nums">
                    <span className={s.text}>{s.label}</span> · thuộc {v.mastered}/{v.items.length} ·{' '}
                    {v.recentErrors ? <span className="text-red-600">còn sai {v.recentErrors} lần trong 7 ngày</span> : 'không sai lại trong 7 ngày'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 mt-1 transition-transform ${open === v.cluster.id ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {open === v.cluster.id && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-600 leading-relaxed mb-3 p-2 bg-gray-50 rounded">💡 {v.cluster.rule}</p>
                <ul className="space-y-1.5 mb-3">
                  {v.items.map((i) => {
                    const p = progress.get(i.id)
                    return (
                      <li key={i.id} className="text-sm flex items-center gap-2">
                        {i.wrong && <span className="text-red-500 line-through">{i.wrong}</span>}
                        {i.wrong && <span className="text-gray-300">→</span>}
                        <span className="text-gray-900 font-medium">{i.correct}</span>
                        {i.kind === 'neighbour' && <span className="text-xs text-gray-400">(mở rộng)</span>}
                        <span className="ml-auto text-xs text-gray-400 tabular-nums">
                          {p?.status === 'mastered' ? '✓ thuộc' : p ? `${p.productiveDays.length}/2 ngày` : 'mới'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <button onClick={() => onPractise(v)} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md">
                  Luyện cụm này
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GapGym() {
  const [data, setData] = useState<GapData | null>(null)
  const [syncing, setSyncing] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'today' | 'map' | 'extra'>('today')
  const [session, setSession] = useState<{ pool: GapItem[]; mode: Mode | 'auto'; key: number } | null>(null)
  const [extraCluster, setExtraCluster] = useState('all')

  useEffect(() => {
    loadGapData().then(async (d) => {
      setData(d)
      if (!d.pending.length) return
      setSyncing({ done: 0, total: d.pending.length })
      try {
        setData(await syncMistakes(d, (done, total) => setSyncing({ done, total })))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'AI chưa phân tích được lỗi mới.')
      } finally {
        setSyncing(null)
      }
    })
  }, [])

  const views = useMemo(() => (data ? clusterViews(data.clusters, data.items, data.progress, data.attemptDates) : []), [data])
  const rules = useMemo(() => new Map((data?.clusters ?? []).map((c) => [c.id, c.rule])), [data])
  const pool = useMemo(() => (data ? todayPool(data.items, data.progress, views) : []), [data, views])

  function extraPool(): GapItem[] {
    if (!data) return []
    const list = extraCluster === 'all' ? data.items : data.items.filter((i) => i.clusterId === extraCluster)
    // Weakest first: not-yet-mastered, lowest box.
    return [...list]
      .sort((a, b) => {
        const pa = data.progress.get(a.id)
        const pb = data.progress.get(b.id)
        const sa = pa?.status === 'mastered' ? 10 : pa?.box ?? -1
        const sb = pb?.status === 'mastered' ? 10 : pb?.box ?? -1
        return sa - sb || hash01(a.id + Date.now()) - 0.5
      })
      .slice(0, 12)
  }

  const mastered = data ? data.items.filter((i) => data.progress.get(i.id)?.status === 'mastered').length : 0

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Practice Situation
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Dumbbell className="w-6 h-6" /> Phòng gym lỗ hổng
        </h1>
        <p className="text-sm text-gray-500 mt-1">Chỉ luyện đúng những lỗi bạn đã mắc — cho đến khi tự viết đúng ở 2 ngày khác nhau.</p>
      </div>

      {syncing && (
        <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-800">
          <p className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> AI đang phân tích {syncing.total} lỗi mới… ({syncing.done}/{syncing.total})
          </p>
          <p className="text-xs mt-1">Lần đầu có thể mất vài phút. Bạn vẫn luyện được với các thẻ đã có.</p>
        </div>
      )}
      {error && <p className="mb-6 text-sm text-red-600">{error}</p>}

      {!data ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : session ? (
        <Session
          key={session.key}
          pool={session.pool}
          mode={session.mode}
          data={data}
          rules={rules}
          onProgress={(p) => setData((d) => (d ? { ...d, progress: new Map(d.progress).set(p.id, p) } : d))}
          onExit={(again) => setSession(again && session.mode !== 'auto' ? { pool: extraPool(), mode: session.mode, key: Date.now() } : null)}
        />
      ) : data.items.length === 0 ? (
        <p className="p-5 border border-gray-200 rounded-lg text-sm text-gray-600">
          {syncing ? 'Đang tạo thẻ từ lỗi của bạn…' : 'Chưa có lỗi nào. Hãy làm vài câu Situation hoặc một bài IELTS — lỗi của bạn sẽ tự xuất hiện ở đây.'}
        </p>
      ) : (
        <>
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-md text-sm w-fit mb-6">
            {(
              [
                ['today', 'Hôm nay'],
                ['map', `Bản đồ (${views.length})`],
                ['extra', 'Luyện thêm'],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded ${tab === k ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500'}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === 'today' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { value: pool.length, label: 'thẻ hôm nay' },
                  { value: views.filter((v) => v.status === 'red').length, label: 'lỗ hổng lớn' },
                  { value: `${mastered}/${data.items.length}`, label: 'đã thuộc' },
                ].map((s) => (
                  <div key={s.label} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                    <div className="text-xl sm:text-2xl font-semibold text-gray-900 tabular-nums">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              {pool.length ? (
                <button
                  onClick={() => setSession({ pool, mode: 'auto', key: Date.now() })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700"
                >
                  <Dumbbell className="w-4 h-4" /> Luyện hôm nay ({pool.length} thẻ)
                </button>
              ) : (
                <p className="p-5 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">Hôm nay đã xong. Vào “Luyện thêm” nếu muốn tập tiếp.</p>
              )}
              <div className="mt-8 text-xs text-gray-500 leading-relaxed space-y-1">
                <p>• Thẻ mới: Ghép cặp để làm quen → Bắt lỗi / Gõ cụm từ → Sửa câu của chính bạn.</p>
                <p>• “Thuộc” = tự viết đúng (không gợi ý) ở 2 ngày khác nhau. Ghép cặp chỉ tính là “nhận ra”.</p>
                <p>• Sai lại một lỗi cũ trong bài Situation → thẻ đó tự quay về ôn lại từ đầu.</p>
              </div>
            </>
          )}

          {tab === 'map' && (
            <GapMap
              views={views}
              progress={data.progress}
              onPractise={(v) => setSession({ pool: v.items.slice(0, 12), mode: 'auto', key: Date.now() })}
            />
          )}

          {tab === 'extra' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Chọn lỗ hổng</p>
                <select
                  value={extraCluster}
                  onChange={(e) => setExtraCluster(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base sm:text-sm bg-white"
                >
                  <option value="all">Tất cả ({data.items.length} thẻ)</option>
                  {views.map((v) => (
                    <option key={v.cluster.id} value={v.cluster.id}>
                      {v.status === 'red' ? '🔴' : v.status === 'yellow' ? '🟡' : '🟢'} {v.cluster.title} ({v.items.length})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Chọn dạng luyện</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSession({ pool: extraPool(), mode: m, key: Date.now() })}
                      className="p-3 border border-gray-200 rounded-lg text-left hover:border-gray-900"
                    >
                      <p className="text-sm font-medium text-gray-900">{MODE_INFO[m].label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{MODE_INFO[m].desc}</p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSession({ pool: extraPool(), mode: 'auto', key: Date.now() })}
                  className="mt-2 w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-gray-900"
                >
                  <Shuffle className="w-4 h-4" /> Trộn các dạng
                </button>
              </div>
              <p className="text-xs text-gray-500">Mỗi lượt 12 thẻ yếu nhất của lỗ hổng đã chọn. Luyện bao nhiêu lượt cũng được.</p>
            </div>
          )}

          <div className="mt-10 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapIcon className="w-3.5 h-3.5" /> {data.items.length} thẻ từ {data.items.filter((i) => i.kind === 'mistake').length} lỗi thật của bạn
            </span>
            <Link href="/situation/cards/bank" className="hover:text-gray-900">
              Bộ 150 cụm soạn sẵn →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
