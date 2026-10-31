// Written practice items added to each quick lesson so every session has 10 questions (no AI).
// Mix of multiple choice and "type the corrected phrase". New items are added weekly.

import type { QuizQ } from './lessons'

const fix = (sentence: string, wrong: string, answer: string, why: string, alts?: string[]): QuizQ => ({
  kind: 'fix',
  q: 'Sửa cụm gạch chân',
  sentence,
  wrong,
  answer,
  alts,
  why,
})
const choose = (q: string, options: string[], answer: number, why: string): QuizQ => ({ q, options, answer, why })

export const EXTRA_QUIZ: Record<string, QuizQ[]> = {
  article: [
    fix('We need an information about the delivery date.', 'an information', 'information', 'information không đếm được → không dùng a/an.', ['some information']),
    fix('The delay was caused by Employer.', 'by Employer', 'by the Employer', 'Vai trò trong hợp đồng FIDIC → the Employer.'),
    choose('This is ___ best offer we have received.', ['the', 'a', '(không mạo từ)'], 0, 'So sánh nhất → the.'),
    choose('He works as ___ site engineer.', ['a', 'the', '(không mạo từ)'], 0, 'Nói nghề nghiệp → a/an.'),
    fix('The safety is our top priority on this site.', 'The safety', 'Safety', 'Danh từ không đếm được, nói chung → bỏ the.'),
  ],
  plural_countable: [
    fix('We have received many feedbacks from the client.', 'many feedbacks', 'a lot of feedback', 'feedback không đếm được: không -s, không dùng many.', ['much feedback', 'plenty of feedback', 'some feedback']),
    choose('A number of defects ___ found during the inspection.', ['were', 'was'], 0, 'a number of + số nhiều → động từ số nhiều.'),
    fix('Each workers must wear a helmet.', 'Each workers', 'Each worker', 'each + danh từ số ít.'),
    choose('Two ___ of equipment were damaged.', ['pieces', 'piece', 'equipments'], 0, 'Đếm danh từ không đếm được → two pieces of.'),
    choose('Only ___ progress was made last week because of the rain.', ['little', 'few', 'many'], 0, 'progress không đếm được → little (rất ít).'),
  ],
  subject_verb_agreement: [
    fix('The number of defects are falling.', 'are falling', 'is falling', 'the number of … → động từ số ít.'),
    choose('There ___ three open RFIs on the log.', ['are', 'is'], 0, 'Chia theo danh từ sau there: RFIs số nhiều.'),
    fix('Managing subcontractors require patience.', 'require', 'requires', 'V-ing làm chủ ngữ → số ít.'),
    choose('Each of the zones ___ its own supervisor.', ['has', 'have'], 0, 'each of … → số ít.'),
    choose('The drawings you sent yesterday ___ approved this morning.', ['were', 'was'], 0, 'Chủ ngữ chính: The drawings (số nhiều).'),
  ],
  tense: [
    fix('I work on this project since 2025.', 'work', 'have worked', 'since → hiện tại hoàn thành.', ['have been working']),
    fix('We will send the report as soon as we will receive the data.', 'will receive', 'receive', 'Sau as soon as dùng hiện tại, không dùng will.'),
    choose('The Engineer ___ the drawings two days ago.', ['approved', 'has approved'], 0, '"ago" → quá khứ đơn.'),
    choose('We ___ more workers for Zone C.', ['need', 'are needing'], 0, 'need là động từ trạng thái → không dùng tiếp diễn.'),
    choose('So far this month, we ___ 12 RFIs.', ['have issued', 'issued', 'issue'], 0, '"So far" → hiện tại hoàn thành.'),
  ],
  passive: [
    fix('The materials were arrived on site this morning.', 'were arrived', 'arrived', 'arrive là nội động từ → không có bị động.'),
    fix('The meeting will hold next Tuesday.', 'will hold', 'will be held', 'Cuộc họp được tổ chức → bị động will be + V3.'),
    choose('It ___ that the works will be completed in May.', ['is expected', 'expects', 'is expecting'], 0, 'Cấu trúc bị động: It is expected that…'),
    choose('We had the scaffold ___ by a third party.', ['inspected', 'inspect', 'inspecting'], 0, 'have something done → V3.'),
    fix('All defects must fix before handover.', 'must fix', 'must be fixed', 'Lỗi được sửa → must be + V3.'),
  ],
  preposition: [
    fix('We discussed about the variation with the client.', 'discussed about', 'discussed', 'discuss không có giới từ.'),
    fix('Please contact with the supplier today.', 'contact with', 'contact', 'contact + tân ngữ trực tiếp.'),
    choose('The price is subject ___ change.', ['to', 'for', 'with'], 0, 'subject to (phụ thuộc vào).'),
    choose('There was a delay ___ the delivery of the steel.', ['in', 'at', 'with'], 0, 'a delay in + việc gì.'),
    choose('All works must comply ___ the specification.', ['with', 'to', 'for'], 0, 'comply with.'),
  ],
  collocation: [
    fix('We made a meeting with the MEP team yesterday.', 'made a meeting', 'held a meeting', 'Tổ chức họp → hold / have / arrange a meeting.', ['had a meeting', 'arranged a meeting', 'set up a meeting']),
    choose('The consultant ___ a concern about the fixing detail.', ['raised', 'rose', 'made up'], 0, 'raise a concern.'),
    choose('We are working to a very ___ deadline.', ['tight', 'narrow', 'thin'], 0, 'tight deadline.'),
    fix('We met many difficulties during the pour.', 'met many difficulties', 'faced many difficulties', 'Gặp khó khăn → face / encounter difficulties.', ['encountered many difficulties', 'had many difficulties']),
    choose('Please ___ the order for the aluminium this week.', ['place', 'make', 'do'], 0, 'place an order.'),
  ],
  word_choice: [
    choose('Please ___ that the area is cordoned off before lifting.', ['ensure', 'insure', 'assure'], 0, 'Đảm bảo việc gì xảy ra → ensure.'),
    choose('The works will ___ on 3 November.', ['commence', 'beginning', 'starting'], 0, 'Văn bản hợp đồng, trang trọng → commence.'),
    fix('The rain had a big affect on progress.', 'affect', 'effect', 'Danh từ → effect (affect là động từ).'),
    choose('The inspection was ___ to Monday at the client’s request.', ['postponed', 'suspended', 'cancelled'], 0, 'Dời có chủ đích sang ngày khác → postpone.'),
    fix('We need your advise on this issue.', 'advise', 'advice', 'Danh từ → advice (advise là động từ).'),
  ],
  word_form: [
    fix('All works must follow environment regulations.', 'environment regulations', 'environmental regulations', 'Trước danh từ → tính từ.'),
    fix('Please check the drawings careful.', 'careful', 'carefully', 'Bổ nghĩa cho động từ → trạng từ.'),
    choose('This shows the ___ of good planning.', ['importance', 'important', 'importantly'], 0, 'Sau the → danh từ.'),
    choose('We hired a ___ engineer for the roof.', ['structural', 'structure', 'structurally'], 0, 'Trước danh từ → tính từ.'),
    fix('The installation was success.', 'was success', 'was successful', 'Sau be → tính từ.', ['was a success']),
  ],
  relative_clause: [
    fix('Zone C, that is still closed, will open next week.', 'that', 'which', 'Sau dấu phẩy không dùng that.'),
    choose('The supplier ___ delivery was late has apologised.', ['whose', 'who', 'which'], 0, 'Sở hữu → whose.'),
    choose('This is the zone ___ the leak occurred.', ['where', 'which', 'who'], 0, 'Nơi chốn → where.'),
    fix('Access was given late, which have delayed the works.', 'have delayed', 'has delayed', ', which thay cho cả vế → số ít.'),
    choose('Workers ___ at height must wear harnesses.', ['working', 'worked', 'works'], 0, 'Rút gọn mệnh đề chủ động → V-ing.'),
  ],
  linking: [
    fix('Although it rained, but the pour went ahead.', 'but the pour', 'the pour', 'Không dùng although và but trong cùng câu.'),
    choose('___ the rain, the pour went ahead.', ['Despite', 'Although', 'However'], 0, 'Sau là danh từ → Despite.'),
    fix('Because the heavy rain, the works stopped.', 'Because the heavy rain', 'Because of the heavy rain', 'because of / due to + danh từ.', ['Due to the heavy rain', 'Owing to the heavy rain']),
    choose('Access was given late. ___, we request an extension of time.', ['Therefore', 'Because', 'Although'], 0, 'Kết quả, đầu câu mới → Therefore.'),
    choose('We added a night shift ___ we could recover the delay.', ['so that', 'in order', 'because of'], 0, 'Mục đích + mệnh đề → so that.'),
  ],
  word_order: [
    fix('We check carefully the drawings before issue.', 'check carefully the drawings', 'check the drawings carefully', 'Không đặt trạng từ giữa động từ và tân ngữ.', ['carefully check the drawings']),
    fix('Could you tell me when will the materials arrive?', 'when will the materials arrive', 'when the materials will arrive', 'Câu hỏi gián tiếp → không đảo ngữ.'),
    choose('The site ___ clean at the end of each day.', ['is always', 'always is'], 0, 'Trạng từ tần suất đứng sau be.'),
    choose('We ___ a toolbox talk at 7 am.', ['always hold', 'hold always'], 0, 'Trạng từ tần suất đứng trước động từ thường.'),
    choose('Please let me know ___ the drawing has been approved.', ['whether', 'that', 'what'], 0, 'Câu hỏi Yes/No gián tiếp → whether / if.'),
  ],
  conditional: [
    fix('If we will receive the drawings today, we will start tomorrow.', 'will receive', 'receive', 'Không dùng will trong mệnh đề if.'),
    choose('If we ___ the steel earlier, we would have avoided the delay.', ['had ordered', 'ordered', 'have ordered'], 0, 'Loại 3: If + had V3, would have V3.'),
    choose('___ you need further information, please contact me.', ['Should', 'Would', 'Could'], 0, 'Trang trọng: Should you… = If you…'),
    choose('We will start on Monday, ___ the access is ready.', ['provided that', 'unless', 'in case'], 0, 'Với điều kiện → provided that.'),
    fix('Unless payment is not made, we may suspend the works.', 'is not made', 'is made', 'unless = if … not → không thêm not.'),
  ],
  noun_phrase: [
    fix('Please update the drawings register.', 'drawings register', 'drawing register', 'Danh từ bổ nghĩa để số ít.'),
    choose('We need access ___ Zone C by Monday.', ['to', 'for', 'into'], 0, 'access to.'),
    fix('The data collecting on site was wrong.', 'collecting', 'collected', 'Dữ liệu được thu thập → V3.'),
    choose('This is our plan ___ a new warehouse.', ['to build', 'building', 'for build'], 0, 'plan + to V.'),
    choose('The impact ___ the schedule was serious.', ['on', 'to', 'for'], 0, 'impact on.'),
  ],
}
