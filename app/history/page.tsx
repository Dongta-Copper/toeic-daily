'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  TrendingUp,
  Trash2,
  XCircle,
  X,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { getSessions, clearSessions, type Session, type QuestionResult } from '@/lib/history'

// ─── Overview card per part ────────────────────────────────────────────────────

function PartCard({ part, sessions }: { part: number; sessions: Session[] }) {
  const partSessions = sessions.filter((s) => s.part === part)

  if (partSessions.length === 0) {
    return (
      <div className="p-5 border border-dashed border-gray-200 rounded-lg">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Part {part}</p>
        <p className="text-sm text-gray-300">—</p>
      </div>
    )
  }

  const totalScore = partSessions.reduce((s, x) => s + x.score, 0)
  const totalQ = partSessions.reduce((s, x) => s + x.total, 0)
  const avgPct = Math.round((totalScore / totalQ) * 100)

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Part {part}</p>
      <div className="text-3xl font-bold text-gray-900 tabular-nums leading-none mb-1">{avgPct}%</div>
      <div className="text-xs text-gray-400 mb-4">
        {totalScore}/{totalQ} đúng · {partSessions.length} lần làm
      </div>
      <div className="bg-gray-100 rounded-full h-1.5">
        <div className="bg-gray-900 h-1.5 rounded-full" style={{ width: `${avgPct}%` }} />
      </div>
    </div>
  )
}

// ─── Full review modal ─────────────────────────────────────────────────────────

function ReviewModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const pct = Math.round((session.score / session.total) * 100)
  const correct = session.results.filter((r) => r.isCorrect).length
  const wrong = session.results.filter((r) => !r.isCorrect).length

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Part {session.part}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(session.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-3xl font-bold text-gray-900 tabular-nums">{pct}%</span>
                <span className="text-sm text-gray-400 ml-2">{session.score}/{session.total}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-gray-700">{correct}</span>
                  <span className="text-gray-400">đúng</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="font-medium text-gray-700">{wrong}</span>
                  <span className="text-gray-400">sai</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {session.results.map((r, i) => (
            <ReviewQuestion key={r.questionId} result={r} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewQuestion({ result: r, index }: { result: QuestionResult; index: number }) {
  const hasOptions = r.options && Object.keys(r.options).length === 4

  return (
    <div className="relative">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-0.5">
          {r.isCorrect
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <XCircle className="w-4 h-4 text-red-400" />
          }
        </div>
        <p className="text-sm text-gray-900 leading-relaxed">
          <span className="text-gray-400 mr-2 select-none">{index + 1}.</span>
          {r.question}
        </p>
      </div>

      {hasOptions ? (
        <div className="ml-7 space-y-2">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
            const isCorrect = r.correctAnswer === opt
            const isUserWrong = r.userAnswer === opt && !r.isCorrect

            let cls = 'flex items-start gap-3 px-3 py-2.5 rounded-md border text-sm '
            if (isCorrect) cls += 'border-green-500 bg-green-50'
            else if (isUserWrong) cls += 'border-red-400 bg-red-50'
            else cls += 'border-gray-100 opacity-50'

            return (
              <div key={opt} className={cls}>
                <span className={`font-medium mr-1 flex-shrink-0 ${isCorrect ? 'text-green-600' : isUserWrong ? 'text-red-500' : 'text-gray-400'}`}>
                  {opt}.
                </span>
                <span className={isCorrect ? 'text-green-800 font-medium' : isUserWrong ? 'text-red-700' : 'text-gray-500'}>
                  {r.options[opt]}
                </span>
                {isCorrect && <span className="ml-auto flex-shrink-0 text-xs text-green-600 font-medium">✓ Đúng</span>}
                {isUserWrong && <span className="ml-auto flex-shrink-0 text-xs text-red-500 font-medium">✗ Bạn chọn</span>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="ml-7 flex items-center gap-4 text-sm">
          {r.userAnswer
            ? <span className={r.isCorrect ? 'text-green-600' : 'text-red-500'}>
                Bạn chọn: <strong>{r.userAnswer}</strong>
              </span>
            : <span className="text-gray-400">Bỏ trống</span>
          }
          {!r.isCorrect && (
            <span className="text-green-600">Đáp án đúng: <strong>{r.correctAnswer}</strong></span>
          )}
        </div>
      )}

      {r.explanation && (
        <div className="ml-7 mt-3 p-3 bg-gray-50 rounded-md border-l-2 border-gray-300">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Giải thích</p>
          <p className="text-xs text-gray-700 leading-relaxed">{r.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ─── Session row ───────────────────────────────────────────────────────────────

function SessionCard({ session, onReview }: { session: Session; onReview: () => void }) {
  const pct = Math.round((session.score / session.total) * 100)

  return (
    <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 hover:border-gray-300 transition-colors">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-widest w-12 flex-shrink-0">
        Part {session.part}
      </span>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div className="flex-1 bg-gray-100 rounded-full h-1">
          <div className="bg-gray-900 h-1 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{pct}%</span>
      </div>

      <span className="text-sm font-semibold text-gray-900 tabular-nums">
        {session.score}
        <span className="text-xs font-normal text-gray-400">/{session.total}</span>
      </span>

      <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0 hidden sm:block">
        {new Date(session.createdAt).toLocaleDateString('vi-VN', {
          day: '2-digit', month: '2-digit', year: '2-digit',
        })}
      </span>

      <button
        onClick={onReview}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors flex-shrink-0"
      >
        <BookOpen className="w-3 h-3" />
        Xem lại
      </button>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<Session | null>(null)

  useEffect(() => {
    getSessions().then((data) => {
      setSessions(data)
      setLoading(false)
    })
  }, [])

  async function handleClear() {
    await clearSessions()
    setSessions([])
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-6 py-12 w-full">
        <div className="mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            Home
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
              <p className="text-sm text-gray-500">Thống kê luyện tập của bạn</p>
            </div>
            {sessions.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors pb-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Overview cards */}
        <div className="mb-10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Tổng quan
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[5, 6, 7].map((part) => (
              <PartCard key={part} part={part} sessions={sessions} />
            ))}
          </div>
        </div>

        {/* Session list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-400">Chưa có session nào.</p>
            <p className="text-xs text-gray-400 mt-1">Hoàn thành một bài quiz để xem kết quả ở đây.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
              Chi tiết · {sessions.length} session{sessions.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onReview={() => setReviewing(session)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewModal session={reviewing} onClose={() => setReviewing(null)} />
      )}
    </>
  )
}
