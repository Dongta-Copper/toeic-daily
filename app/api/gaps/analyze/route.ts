import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import type { GapCluster, GapItem, RawError } from '@/lib/gaps'

export const maxDuration = 300

type DraftItem = {
  cluster: string // existing cluster id or the key of a new cluster
  kind: 'mistake' | 'neighbour' | 'paraphrase'
  correct: string
  wrong?: string
  vietnamese: string
  sentenceCorrect: string
  sentenceWrong?: string
  errorWord?: string
  sources?: number[] // 1-based indexes of the errors this item covers
}

type Draft = {
  newClusters: { key: string; title: string; rule: string }[]
  items: DraftItem[]
}

function findCI(haystack: string, needle: string) {
  const i = haystack.toLowerCase().indexOf(needle.toLowerCase())
  return i < 0 ? null : haystack.slice(i, i + needle.length)
}

export async function POST(req: Request) {
  try {
    const { errors, clusters }: { errors: RawError[]; clusters: Pick<GapCluster, 'id' | 'title' | 'rule'>[] } = await req.json()
    if (!errors?.length) return NextResponse.json({ clusters: [], items: [] })

    const prompt = `Bạn là giáo viên tiếng Anh. Học viên là kỹ sư quản lý dự án xây dựng người Việt (B1–B2, luyện IELTS). Dưới đây là các lỗi THẬT học viên đã mắc. Nhiệm vụ: gom lỗi theo LỖ HỔNG KIẾN THỨC gốc và tạo thẻ luyện tập.

Các cụm lỗ hổng đã có (dùng lại id nếu lỗi thuộc cụm đó):
${clusters.length ? clusters.map((c) => `- id "${c.id}": ${c.title} — ${c.rule}`).join('\n') : '(chưa có)'}

Lỗi mới:
${errors.map((e, i) => `${i + 1}. [${e.type}] sai: "${e.wrong}" → đúng: "${e.correct}" | câu của học viên: "${e.context}" | ${e.explanation}`).join('\n')}

Quy tắc:
- Cụm lỗ hổng = một quy tắc cụ thể học viên chưa nắm, đặt tên tiếng Việt rõ ràng, ví dụ "Danh từ không đếm được bị thêm -s", "Thêm giới từ thừa sau động từ (discuss about…)", "Chủ ngữ số ít nhưng động từ không chia -s". KHÔNG đặt tên chung chung như "Ngữ pháp" hay "Từ vựng".
- Mỗi lỗi thật → 1 item kind "mistake" (nhiều lỗi cùng một cụm từ → gộp thành 1 item, liệt kê nhiều sources). Bỏ qua lỗi không thực sự sai (sai giống đúng) hoặc chỉ là khác cách diễn đạt.
  • correct: cụm ĐÚNG ngắn gọn (1–5 từ) thể hiện đúng quy tắc, ví dụ "work on", "feedback was", "environmental regulations".
  • wrong: cụm sai tương ứng của học viên.
  • sentenceWrong: chép NGUYÊN VĂN câu của học viên nếu câu đó chứa lỗi; nếu không thì viết một câu ngắn chứa lỗi.
  • errorWord: đúng (các) chữ sai nằm trong sentenceWrong — ngắn nhất có thể (thường 1–2 từ), phải là chuỗi con chính xác của sentenceWrong.
  • sentenceCorrect: câu đã sửa đúng, phải chứa nguyên văn "correct".
  • vietnamese: nghĩa / gợi ý ngắn bằng tiếng Việt cho cụm đúng (không chứa đáp án tiếng Anh).
- Lỗi loại ielts_paraphrase: tạo item kind "paraphrase" — correct = cụm trong bài đọc ("đúng"), vietnamese = nghĩa tiếng Việt + "(≈ <cụm trong câu hỏi>)", sentenceCorrect = câu ngữ cảnh chứa correct; không cần sentenceWrong.
- Với MỖI cụm MỚI, thêm 2–3 item kind "neighbour": cùng quy tắc nhưng từ khác (để học viên tổng quát hóa), kèm sentenceWrong là lỗi điển hình người Việt hay mắc và errorWord. Bối cảnh công trường / dự án / IELTS.

Trả về JSON:
{
  "newClusters": [ { "key": "n1", "title": "…", "rule": "1–3 câu tiếng Việt giải thích quy tắc + mẹo nhớ" } ],
  "items": [ { "cluster": "<id cụm cũ hoặc key cụm mới>", "kind": "mistake" | "neighbour" | "paraphrase", "correct": "…", "wrong": "…", "vietnamese": "…", "sentenceCorrect": "…", "sentenceWrong": "…", "errorWord": "…", "sources": [1, 3] } ]
}`

    const draft = await generateJSON<Draft>(prompt, { timeoutMs: 150000, attemptsPerModel: 2 })
    const now = new Date().toISOString()
    const stamp = Date.now()

    const newClusters: GapCluster[] = []
    const keyToId = new Map<string, string>()
    ;(draft.newClusters ?? []).forEach((c, i) => {
      if (!c.title || !c.key) return
      const id = `c${stamp}-${i}`
      keyToId.set(c.key, id)
      newClusters.push({ id, title: c.title, rule: c.rule ?? '', createdAt: now, updatedAt: now })
    })
    const existingIds = new Set(clusters.map((c) => c.id))

    const items: GapItem[] = []
    ;(draft.items ?? []).forEach((d, i) => {
      const clusterId = existingIds.has(d.cluster) ? d.cluster : keyToId.get(d.cluster)
      if (!clusterId || !d.correct?.trim() || !d.sentenceCorrect || !d.vietnamese) return
      const correct = findCI(d.sentenceCorrect, d.correct.trim())
      if (!correct) return
      let sentenceWrong = d.sentenceWrong?.trim() || undefined
      let errorWord = sentenceWrong && d.errorWord ? findCI(sentenceWrong, d.errorWord.trim()) ?? undefined : undefined
      if (!errorWord) {
        sentenceWrong = d.kind === 'mistake' ? sentenceWrong : undefined
        errorWord = undefined
      }
      const sourceIds = d.kind === 'neighbour' ? [] : [...new Set((d.sources ?? []).map((n) => errors[n - 1]?.sourceId).filter((x): x is string => !!x))]
      items.push({
        id: `g${stamp}-${i}`,
        clusterId,
        kind: d.kind === 'paraphrase' || d.kind === 'neighbour' ? d.kind : 'mistake',
        correct,
        wrong: d.wrong?.trim() || undefined,
        vietnamese: d.vietnamese,
        sentenceCorrect: d.sentenceCorrect,
        sentenceWrong,
        errorWord,
        sourceIds,
        createdAt: now,
        updatedAt: now,
      })
    })

    return NextResponse.json({ clusters: newClusters, items })
  } catch (e) {
    console.error('Gap analyze error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa phân tích được lỗi. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
