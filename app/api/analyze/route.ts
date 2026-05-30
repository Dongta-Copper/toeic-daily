import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'
import type { Session } from '@/lib/history'

export async function POST(req: Request) {
  try {
    const { sessions }: { sessions: Session[] } = await req.json()

    const recentSessions = sessions.slice(0, 10)
    const wrongAnswers = recentSessions.flatMap((s) =>
      s.results.filter((r) => !r.isCorrect)
    )

    if (wrongAnswers.length === 0) {
      return NextResponse.json({
        analysis: 'Bạn chưa có câu trả lời sai nào trong 10 session gần nhất. Tiếp tục luyện tập nhé!',
      })
    }

    const wrongList = wrongAnswers
      .map(
        (r, i) =>
          `${i + 1}. Câu: "${r.question}"\n   Bạn chọn: ${r.userAnswer || '(bỏ trống)'} | Đáp án đúng: ${r.correctAnswer}\n   Giải thích: ${r.explanation}`
      )
      .join('\n\n')

    const prompt = `Bạn là chuyên gia luyện thi TOEIC Reading. Học viên đã trả lời sai ${wrongAnswers.length} câu trong 10 bài kiểm tra gần nhất:

${wrongList}

Dựa vào các câu sai trên, hãy phân tích và trình bày theo đúng cấu trúc sau (dùng emoji, ngắn gọn, dễ đọc):

📌 ĐIỂM YẾU PHÁT HIỆN
(Liệt kê 3-5 dạng kiến thức/ngữ pháp bị sai nhiều nhất, ví dụ: giới từ, thì động từ, từ loại...)

📊 MỨC ĐỘ
(Đánh giá sơ bộ: Yếu / Trung bình / Cần chú ý cho từng điểm)

💡 GỢI Ý CẢI THIỆN
(Gợi ý cụ thể, thực tế cho từng điểm yếu)

Trả lời hoàn toàn bằng tiếng Việt.`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const analysis = result.response.text()

    return NextResponse.json({ analysis })
  } catch (e) {
    console.error('Gemini error:', e)
    return NextResponse.json(
      { error: 'Không thể phân tích lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
