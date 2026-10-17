import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'
import type { GenerateRequest, PhraseCard } from '@/lib/phrases'

export const maxDuration = 120

const CARD_SPEC = `Mỗi thẻ là JSON:
{
  "type": "prep" (động từ/danh từ/tính từ + giới từ, cụm động từ, hoặc trường hợp KHÔNG dùng giới từ) | "colloc" (kết hợp từ: động từ + danh từ, tính từ + danh từ, tính từ ghép),
  "domain": "work" (công trường, dự án, hợp đồng, nhà máy, hồ sơ) | "ielts" (chủ đề xã hội, học thuật),
  "phrase": "dạng chuẩn của cụm, ví dụ: comply with / make a decision / discuss (no preposition)",
  "answer": "phần bị kiểm tra (giới từ hoặc từ then chốt); nếu đúng là KHÔNG cần giới từ thì ghi —",
  "prompt": "mặt trước ngắn, có ___ ở vị trí answer, ví dụ: comply ___ the regulations",
  "choices": [4 lựa chọn gồm answer và 3 phương án SAI; trong đúng ngữ cảnh của prompt chỉ được có ĐÚNG MỘT lựa chọn đúng],
  "meaning": "nghĩa tiếng Việt ngắn",
  "example": "một câu ví dụ tự nhiên trong bối cảnh dự án xây dựng (gói thầu ghế chờ nhà ga sân bay) hoặc IELTS, đặt answer trong ngoặc vuông, ví dụ: All subcontractors must comply [with] the regulations. Nếu answer là — thì viết [—] ở chỗ người học hay chèn giới từ thừa. Từ trong ngoặc phải GIỐNG HỆT answer (không chia động từ khác đi)",
  "trap": "lỗi người Việt hay mắc với cụm này",
  "family": "nhóm: tên giới từ viết hoa (WITH, ON…), 'Không giới từ', 'Cụm động từ', hoặc từ khóa của kết hợp từ (take, make, deadline…)"
}`

function valid(c: Partial<PhraseCard>): c is PhraseCard {
  if (!c.phrase || !c.answer || !c.prompt || !c.meaning || !c.example || !Array.isArray(c.choices)) return false
  const m = c.example.match(/\[([^\]]+)\]/g)
  if (!m || m.length !== 1 || m[0].slice(1, -1).toLowerCase() !== c.answer.toLowerCase()) return false
  if (new Set(c.choices).size !== 4 || !c.choices.includes(c.answer)) return false
  return c.prompt.includes('___') && (c.type === 'prep' || c.type === 'colloc') && (c.domain === 'work' || c.domain === 'ielts')
}

export async function POST(req: Request) {
  try {
    const body: GenerateRequest = await req.json()

    let task: string
    let source: PhraseCard['source']
    if (body.mode === 'errors') {
      source = 'mistake'
      task = `Học viên (kỹ sư quản lý dự án người Việt) đã mắc các lỗi giới từ / kết hợp từ / chọn từ sau:
${body.errors.map((e, i) => `${i + 1}. Câu: "${e.context}" | sai: "${e.wrong}" → đúng: "${e.correct}" | ${e.explanation}`).join('\n')}
Với MỖI lỗi, tạo 1 thẻ dạy đúng cụm từ đúng (phần "đúng"). Bỏ qua lỗi không phải về giới từ hay kết hợp từ. Thêm trường "index": số thứ tự lỗi (bắt đầu từ 1).`
    } else if (body.mode === 'sentence') {
      source = 'sentence'
      task = `Từ câu sau, chọn 1-3 cụm từ đáng học nhất (giới từ đi kèm, kết hợp từ, tính từ ghép) và tạo thẻ cho mỗi cụm. Không tạo thẻ cho từ đơn lẻ thông thường.
Câu: "${body.sentence}"
Nghĩa: "${body.vietnamese}"`
    } else {
      source = 'manual'
      task = `Học viên muốn học cụm từ / cấu trúc sau: "${body.text}". Tạo 1 thẻ cho cụm đó (nếu học viên đưa cả câu thì chọn cụm quan trọng nhất trong câu, tối đa 2 thẻ).`
    }

    const prompt = `Bạn là giáo viên tiếng Anh, đang tạo thẻ học (flashcard) về giới từ và kết hợp từ cho một kỹ sư quản lý dự án xây dựng người Việt đang luyện IELTS.

${task}

${CARD_SPEC}

Trả về JSON: { "cards": [ ... ] }`

    const out = await generateJSON<{ cards: (Partial<PhraseCard> & { index?: number })[] }>(prompt)
    const now = new Date().toISOString()
    const stamp = Date.now()
    const cards: PhraseCard[] = (out.cards ?? []).filter(valid).map((c, i) => {
      const index = (c as { index?: number }).index
      const fromAttempt = body.mode === 'errors' && index ? body.errors[index - 1]?.attemptId : undefined
      return {
        id: `u${stamp}-${i}`,
        type: c.type,
        domain: c.domain,
        phrase: c.phrase.trim(),
        answer: c.answer,
        prompt: c.prompt,
        choices: c.choices,
        meaning: c.meaning,
        example: c.example,
        trap: c.trap,
        family: c.family,
        source,
        ...(fromAttempt ? { fromAttempt } : {}),
        createdAt: now,
        updatedAt: now,
      }
    })
    return NextResponse.json({ cards })
  } catch (e) {
    console.error('Phrase generate error:', e)
    const detail = e instanceof Error ? e.message.slice(0, 300) : String(e)
    return NextResponse.json({ error: `AI chưa tạo được thẻ. Vui lòng thử lại. (${detail})` }, { status: 500 })
  }
}
