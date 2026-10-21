import { ERROR_TYPES, type Attempt } from '@/lib/situation'
import { TYPE_LABEL, bandGT, type Group, type IeltsAttempt, type QType, type Question } from '@/lib/ielts'

// ─── Error summary: computed locally (no AI), so it is instant and consistent ─

const DAY = 86400000

// Fine-grained error types are grouped into a few knowledge gaps, so that 80/20 is meaningful.
export const FAMILIES: { id: string; label: string; types: string[] }[] = [
  { id: 'verb', label: 'Động từ: chia theo chủ ngữ, thì, bị động', types: ['subject_verb_agreement', 'tense', 'passive', 'conditional'] },
  { id: 'noun', label: 'Danh từ & mạo từ: số ít/số nhiều, a/an/the', types: ['plural_countable', 'article'] },
  { id: 'vocab', label: 'Dùng từ: chọn từ, kết hợp từ, giới từ', types: ['word_choice', 'collocation', 'preposition'] },
  { id: 'structure', label: 'Từ loại & cấu trúc câu', types: ['word_form', 'word_order', 'relative_clause', 'linking', 'missing_word'] },
  { id: 'spelling', label: 'Chính tả & dấu câu', types: ['spelling', 'punctuation'] },
  { id: 'meaning', label: 'Sai ý / khác', types: ['meaning', 'other'] },
]

function familyOf(type: string) {
  return FAMILIES.find((f) => f.types.includes(type))?.id ?? 'meaning'
}

export type Trend = 'down' | 'flat' | 'up' | 'unknown'

export type ErrorRow = {
  type: string
  label: string
  count: number // errors in the analysis window
  share: number // % of all errors in the window
  rateThis: number | null // errors per 10 sentences, last 7 days
  rateLast: number | null // errors per 10 sentences, 7–14 days ago
  trend: Trend
  weeks: number // number of different weeks this error appeared in (persistence)
  examples: Example[]
  parts: { label: string; count: number }[] // breakdown by fine-grained error type
}

export type Example = {
  vietnamese: string
  answer: string
  corrected: string
  wrong: string
  correct: string
  explanation: string
  at: string
}

export type IeltsRow = { type: QType; label: string; right: number; total: number; pct: number }

export type Summary = {
  generatedAt: string
  windowDays: number
  sentences: number
  errorFree: number // % of sentences with no error
  avgScore: number
  perTen: number // errors per 10 sentences in the window
  thisWeek: { sentences: number; perTen: number | null }
  lastWeek: { sentences: number; perTen: number | null }
  totalErrors: number
  top: ErrorRow[] // the few error types that make up ~80% of all errors
  others: ErrorRow[]
  fixed: string[] // labels of error types that used to occur but have stopped
  practice: { drills: number; reviews: number }
  ielts: { attempts: number; band: number | null; bandNote: string; byType: IeltsRow[]; paraphrases: string[] }
}

function rate(errors: number, sentences: number) {
  return sentences ? Math.round((errors / sentences) * 100) / 10 : null
}

function trendOf(rThis: number | null, rLast: number | null, nThis: number, nLast: number): Trend {
  if (rThis === null || rLast === null || nThis < 5 || nLast < 5) return 'unknown'
  if (rLast === 0) return rThis === 0 ? 'flat' : 'up'
  const change = (rThis - rLast) / rLast
  if (change <= -0.3) return 'down'
  if (change >= 0.2) return 'up'
  return 'flat'
}

export function buildSummary(
  attempts: Attempt[],
  ielts: IeltsAttempt[],
  ieltsIndex: Map<string, { g: Group; q: Question }>,
  windowDays = 30,
  now = Date.now()
): Summary {
  const daily = attempts.filter((a) => !a.source || a.source === 'daily')
  const inWindow = daily.filter((a) => now - new Date(a.at).getTime() <= windowDays * DAY)
  const thisWeek = daily.filter((a) => now - new Date(a.at).getTime() <= 7 * DAY)
  const lastWeek = daily.filter((a) => {
    const age = now - new Date(a.at).getTime()
    return age > 7 * DAY && age <= 14 * DAY
  })
  const recent14 = [...thisWeek, ...lastWeek]

  // `type` here is a family id; errors are matched through their fine-grained type.
  const count = (list: Attempt[], type?: string) =>
    list.reduce((n, a) => n + a.errors.filter((e) => !type || familyOf(e.type) === type).length, 0)

  const totalErrors = count(inWindow)
  const types = [...new Set(inWindow.flatMap((a) => a.errors.map((e) => familyOf(e.type))))]

  const rows: ErrorRow[] = types
    .map((type) => {
      const c = count(inWindow, type)
      const rThis = rate(count(thisWeek, type), thisWeek.length)
      const rLast = rate(count(lastWeek, type), lastWeek.length)
      const weeks = new Set(
        daily
          .filter((a) => a.errors.some((e) => familyOf(e.type) === type))
          .map((a) => Math.floor((now - new Date(a.at).getTime()) / (7 * DAY)))
      ).size
      const partCounts = new Map<string, number>()
      for (const a of inWindow)
        for (const e of a.errors) if (familyOf(e.type) === type) partCounts.set(e.type, (partCounts.get(e.type) ?? 0) + 1)
      const parts = [...partCounts.entries()].sort((x, y) => y[1] - x[1]).map(([t, n]) => ({ label: ERROR_TYPES[t] ?? t, count: n }))
      // Representative examples: the most recent, one per sentence, covering the most frequent sub-types first.
      const order = [...partCounts.entries()].sort((x, y) => y[1] - x[1]).map(([t]) => t)
      const seen = new Set<string>()
      const examples: Example[] = []
      for (const sub of [...order, ...order]) {
        const a = inWindow.find((x) => !seen.has(x.sentenceId) && x.errors.some((e) => e.type === sub))
        if (!a || examples.length >= 3) continue
        const e = a.errors.find((x) => x.type === sub)!
        seen.add(a.sentenceId)
        examples.push({
          vietnamese: a.vietnamese,
          answer: a.answer,
          corrected: a.feedback?.corrected || a.model,
          wrong: e.wrong,
          correct: e.correct,
          explanation: e.explanation.length > 180 ? e.explanation.slice(0, 177) + '…' : e.explanation,
          at: a.at,
        })
      }
      return {
        type,
        label: FAMILIES.find((f) => f.id === type)?.label ?? type,
        parts,
        count: c,
        share: totalErrors ? Math.round((c / totalErrors) * 100) : 0,
        rateThis: rThis,
        rateLast: rLast,
        trend: trendOf(rThis, rLast, thisWeek.length, lastWeek.length),
        weeks,
        examples,
      }
    })
    .sort((a, b) => b.count - a.count)

  // 80/20: the smallest set of knowledge gaps covering 80% of errors (1–3 gaps).
  const top: ErrorRow[] = []
  let covered = 0
  for (const r of rows) {
    if (top.length >= 3 || (top.length >= 1 && covered >= 80)) break
    top.push(r)
    covered += r.share
  }
  const others = rows.slice(top.length)

  const countFine = (list: Attempt[], t: string) => list.reduce((n, a) => n + a.errors.filter((e) => e.type === t).length, 0)
  const everTypes = [...new Set(daily.flatMap((a) => a.errors.map((e) => e.type)))]
  const fixed =
    recent14.length >= 10
      ? everTypes.filter((t) => countFine(daily, t) >= 3 && countFine(recent14, t) === 0).map((t) => ERROR_TYPES[t] ?? t)
      : []

  const sentences = inWindow.length
  const errorFree = sentences ? Math.round((inWindow.filter((a) => a.errors.length === 0).length / sentences) * 100) : 0
  const avgScore = sentences ? Math.round((inWindow.reduce((n, a) => n + a.score, 0) / sentences) * 10) / 10 : 0

  // IELTS
  const results = ielts.flatMap((a) => a.results)
  const byTypeMap = new Map<QType, { right: number; total: number }>()
  for (const r of results) {
    const s = byTypeMap.get(r.type) ?? { right: 0, total: 0 }
    s.total++
    if (r.correct) s.right++
    byTypeMap.set(r.type, s)
  }
  const byType: IeltsRow[] = [...byTypeMap.entries()]
    .map(([type, s]) => ({ type, label: TYPE_LABEL[type], ...s, pct: Math.round((s.right / s.total) * 100) }))
    .sort((a, b) => a.pct - b.pct)
  const full = [...ielts].sort((a, b) => b.at.localeCompare(a.at)).find((a) => a.mode === 'full')
  const recentResults = results.slice(-60)
  const band = full ? bandGT(full.score) : recentResults.length >= 10 ? bandGT(recentResults.filter((r) => r.correct).length, recentResults.length) : null
  const bandNote = full ? `bài thi đủ đề gần nhất ${full.score}/40` : recentResults.length >= 10 ? `ước tính từ ${recentResults.length} câu gần nhất` : 'chưa đủ dữ liệu'
  const paraphrases = [
    ...new Set(
      results
        .filter((r) => !r.correct)
        .map((r) => ieltsIndex.get(r.qid)?.q.paraphrase)
        .filter((p): p is string => !!p && p.includes('↔'))
    ),
  ].slice(0, 8)

  return {
    generatedAt: new Date(now).toISOString(),
    windowDays,
    sentences,
    errorFree,
    avgScore,
    perTen: rate(totalErrors, sentences) ?? 0,
    thisWeek: { sentences: thisWeek.length, perTen: rate(count(thisWeek), thisWeek.length) },
    lastWeek: { sentences: lastWeek.length, perTen: rate(count(lastWeek), lastWeek.length) },
    totalErrors,
    top,
    others,
    fixed,
    practice: {
      drills: attempts.filter((a) => a.source === 'drill').length,
      reviews: attempts.filter((a) => a.source === 'review').length,
    },
    ielts: { attempts: ielts.length, band, bandNote, byType, paraphrases },
  }
}

// ─── Markdown export (readable by Claude, ChatGPT, Gemini, DeepSeek…) ─────────

export const TREND_LABEL: Record<Trend, string> = {
  down: '✅ đang giảm',
  flat: '⚠️ chưa đổi',
  up: '❌ tăng',
  unknown: '— chưa đủ dữ liệu',
}

export type Purpose = 'diagnose' | 'drill' | 'review' | 'speak' | 'explain'

export const PURPOSES: Record<Purpose, { label: string; desc: string }> = {
  diagnose: { label: 'Chẩn đoán tuần', desc: 'Nguyên nhân gốc, hiệu quả, trọng tâm tuần tới' },
  drill: { label: 'Ra bài luyện', desc: '15 câu có ngữ cảnh cho lỗi số 1, đáp án ở cuối' },
  review: { label: 'Chấm đoạn văn', desc: 'Dán email/đoạn viết của bạn sau khi gửi' },
  speak: { label: 'Luyện nói', desc: 'Nhập vai, nhắc khi mắc lỗi trong hồ sơ' },
  explain: { label: 'Giải thích sâu', desc: 'Giảng kỹ lỗi số 1, so sánh với tiếng Việt' },
}

function requestText(p: Purpose, s: Summary): string {
  const main = s.top[0]?.label ?? 'lỗi phổ biến nhất'
  const all = s.top.map((r) => r.label).join(', ')
  switch (p) {
    case 'diagnose':
      return `Bạn là giáo viên tiếng Anh, chuyên luyện IELTS General cho người Việt. Dựa trên hồ sơ trên, hãy trả lời bằng tiếng Việt, ngắn gọn:
1. Với mỗi nhóm trong TOP LỖ HỔNG: nguyên nhân gốc là gì (chuyển từ tiếng Việt? chưa nắm quy tắc? sơ ý?) — chỉ ra bằng chính các ví dụ của tôi.
2. Đánh giá hiệu quả: lỗi nào đang giảm, lỗi nào cứng đầu, vì sao.
3. Chọn MỘT lỗi trọng tâm cho tuần tới và cách luyện cụ thể (10–15 phút/ngày).
4. Một mẹo tự soát lỗi trước khi gửi email công việc.
Không giảng lại các mục trong "ĐÃ VÁ".`
    case 'drill':
      return `Tạo 15 câu luyện tập tập trung vào lỗi "${main}" của tôi:
- 5 câu dịch Việt → Anh, 5 câu tìm và sửa lỗi (mỗi câu chứa đúng 1 lỗi loại này), 5 câu điền vào chỗ trống.
- Ngữ cảnh: công trường, quản lý dự án, email cho chủ đầu tư/tư vấn, và chủ đề IELTS General.
- Độ khó B1–B2, câu tự nhiên như người bản xứ.
- KHÔNG ghi đáp án cạnh câu hỏi. Đặt toàn bộ đáp án + giải thích ngắn (tiếng Việt) ở cuối, dưới tiêu đề "ĐÁP ÁN".`
    case 'review':
      return `Tôi sẽ dán bên dưới một đoạn tiếng Anh tôi viết (email/báo cáo công việc). Hãy:
1. Sửa đoạn văn, giữ giọng văn của tôi.
2. Liệt kê từng lỗi: sai → đúng, loại lỗi, giải thích 1 câu tiếng Việt. ƯU TIÊN bắt các lỗi thuộc TOP LỖ HỔNG (${all}).
3. Cho biết đoạn này có mắc lại lỗi nào trong hồ sơ không.
4. Đưa 1 phiên bản tự nhiên, chuyên nghiệp hơn.

ĐOẠN VĂN CỦA TÔI:
[dán vào đây]`
    case 'speak':
      return `Hãy nhập vai một tư vấn giám sát người Anh trong dự án nhà ga sân bay. Tôi là quản lý dự án phía nhà thầu. Tiến hành một cuộc họp phối hợp công trường: hỏi tôi từng câu một, trình độ B2.
Mỗi khi tôi mắc lỗi thuộc TOP LỖ HỔNG (${all}), hãy nhắc ngay bằng một dòng ngắn trong ngoặc vuông [sai → đúng] rồi tiếp tục cuộc hội thoại.
Sau 8 lượt trao đổi, dừng lại và tổng kết: lỗi nào tôi lặp lại, tiến bộ so với hồ sơ.`
    case 'explain':
      return `Hãy giảng kỹ cho tôi lỗi "${main}" (tiếng Việt, dễ hiểu):
1. Quy tắc cốt lõi, viết thành 3–5 gạch đầu dòng.
2. Vì sao người Việt hay sai (so sánh với cách nói tiếng Việt), dùng chính ví dụ của tôi.
3. Mẹo nhận biết nhanh khi viết.
4. 10 câu ví dụ đúng trong bối cảnh công trường / IELTS.
5. 5 câu hỏi kiểm tra nhanh, đáp án ở cuối.`
  }
}

export function toMarkdown(s: Summary, purpose: Purpose): string {
  const d = new Date(s.generatedAt).toLocaleDateString('vi-VN')
  const coverage = s.top.reduce((n, r) => n + r.share, 0)
  const lines: string[] = []
  lines.push(`# HỒ SƠ LỖI TIẾNG ANH CỦA TÔI (cập nhật ${d})`)
  lines.push('')
  lines.push('Người học: kỹ sư quản lý dự án xây dựng người Việt, trình độ khoảng B1–B2.')
  lines.push('Mục tiêu: IELTS General Training band 6.5; viết email/báo cáo công việc bằng tiếng Anh chính xác.')
  lines.push(
    `Dữ liệu ${s.windowDays} ngày qua: ${s.sentences} câu tự dịch Việt → Anh, ${s.totalErrors} lỗi (${s.perTen} lỗi/10 câu), ${s.errorFree}% câu không lỗi, điểm TB ${s.avgScore}/10.`
  )
  lines.push(
    `Tuần này: ${s.thisWeek.perTen ?? '—'} lỗi/10 câu (${s.thisWeek.sentences} câu) · tuần trước: ${s.lastWeek.perTen ?? '—'} lỗi/10 câu (${s.lastWeek.sentences} câu).`
  )
  lines.push('')
  lines.push(`## A. TOP LỖ HỔNG (80/20) — ${s.top.length} nhóm chiếm ${coverage}% tổng số lỗi`)
  lines.push('')
  lines.push('| # | Nhóm lỗi | % tổng lỗi | Chi tiết (số lỗi) | Lỗi/10 câu: tuần trước → tuần này | Xu hướng |')
  lines.push('|---|---|---|---|---|---|')
  s.top.forEach((r, i) =>
    lines.push(
      `| ${i + 1} | ${r.label} | ${r.share}% | ${r.parts.map((p) => `${p.label} ${p.count}`).join(', ')} | ${r.rateLast ?? '—'} → ${r.rateThis ?? '—'} | ${TREND_LABEL[r.trend]} |`
    )
  )
  lines.push('')
  lines.push('## B. VÍ DỤ THẬT (câu tiếng Việt → câu tôi viết → câu đúng)')
  s.top.forEach((r, i) => {
    lines.push('')
    lines.push(`### Nhóm ${i + 1}: ${r.label}`)
    for (const e of r.examples) {
      lines.push(`- Tiếng Việt: "${e.vietnamese}"`)
      lines.push(`  - Tôi viết: "${e.answer}"`)
      lines.push(`  - Đúng: "${e.corrected}"`)
      lines.push(`  - Chỗ sai: "${e.wrong}" → "${e.correct}" — ${e.explanation}`)
    }
  })
  if (s.others.length) {
    lines.push('')
    lines.push(`## C. LỖI ÍT GẶP (để sau): ${s.others.map((r) => `${r.label} (${r.share}%)`).join(', ')}`)
  }
  lines.push('')
  lines.push(`## D. ĐÃ VÁ (không cần dạy lại): ${s.fixed.length ? s.fixed.join(', ') : 'chưa có'}`)
  if (s.ielts.attempts) {
    lines.push('')
    lines.push(`## E. IELTS GENERAL READING — band ≈ ${s.ielts.band ?? '—'} (${s.ielts.bandNote})`)
    lines.push(`Tỷ lệ đúng theo dạng câu hỏi: ${s.ielts.byType.map((r) => `${r.label} ${r.pct}% (${r.right}/${r.total})`).join(' · ')}`)
    if (s.ielts.paraphrases.length) lines.push(`Paraphrase tôi đã bỏ lỡ: ${s.ielts.paraphrases.join(' ; ')}`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(`## YÊU CẦU: ${PURPOSES[purpose].label.toUpperCase()}`)
  lines.push('')
  lines.push(requestText(purpose, s))
  return lines.join('\n')
}
