// Written practice for each verb group: choosing the verb by nuance and the structure that follows it.
// Combined with the right/wrong items from the verb cards to make 10 questions (no AI).

import type { ChooseQ } from './lessons'

const q = (text: string, options: string[], why: string): ChooseQ => ({ q: text, options, answer: 0, why })

export const VERB_PRACTICE: Record<string, ChooseQ[]> = {
  request: [
    q('The Contract ___ the Contractor to submit a programme within 28 days.', ['requires', 'asks', 'demands'], 'Bắt buộc theo hợp đồng → require.'),
    q('We ___ your approval of the revised drawings. (thư chính thức)', ['request', 'request for', 'ask'], 'Động từ request không có for; ask cần "ask for".'),
    q('The Engineer instructed us ___ the benches.', ['to relocate', 'relocate', 'relocating'], 'instruct + sb + to V.'),
    q('All visitors are required ___ a safety induction.', ['to attend', 'attending', 'attend'], 'be required + to V.'),
    q('The client demanded ___ the delay.', ['that we explain', 'us to explain', 'we to explain'], 'demand that + sb + V (không dùng demand sb to V).'),
  ],
  suggest: [
    q('I suggest ___ the inspection to Monday.', ['moving', 'to move', 'move'], 'suggest + V-ing.'),
    q('We suggest that the MEP team ___ first.', ['start', 'to start', 'starting'], 'suggest that + sb + V nguyên mẫu.'),
    q('The consultant recommends ___ the damaged gaskets.', ['replacing', 'to replace', 'replace'], 'recommend + V-ing.'),
    q('We advise you ___ deliveries 48 hours in advance.', ['to book', 'booking', 'book'], 'advise + sb + to V.'),
    q('Please ___ us of any change to the schedule.', ['advise', 'advice', 'suggest'], 'advise sb of sth = thông báo; advice là danh từ.'),
  ],
  ensure: [
    q('Please ___ that the area is cordoned off before lifting.', ['ensure', 'assure', 'insure'], 'Làm cho chắc chắn xảy ra → ensure.'),
    q('We ___ you that the works will be completed on time.', ['assure', 'ensure', 'insure'], 'Trấn an NGƯỜI → assure + sb.'),
    q('The Contractor shall ___ the Works against loss and damage.', ['insure', 'ensure', 'assure'], 'Mua bảo hiểm → insure.'),
    q('The supplier ___ the frames for ten years.', ['guarantees', 'assures', 'ensures to'], 'Cam kết bảo hành → guarantee + N.'),
    q('Make sure ___ the scaffold tag is green.', ['(that)', 'about', 'of'], 'make sure (that) + mệnh đề.'),
  ],
  approve: [
    q('The client ___ the mock-up yesterday.', ['approved', 'approved of', 'accepted with'], 'Duyệt chính thức → approve + N.'),
    q('I ___ with you on this point.', ['agree', 'am agree', 'am agreed'], 'agree là động từ, không đi với am.'),
    q('Both parties agreed ___ the new rate.', ['on', 'with', 'about to'], 'Thống nhất điều khoản → agree on.'),
    q('We accept ___ proposal for the revised rate.', ['your', 'with your', 'to your'], 'accept + tân ngữ trực tiếp.'),
    q('All materials must ___ by the Engineer before use.', ['be approved', 'approve', 'approved'], 'Vật liệu được duyệt → bị động.'),
  ],
  delay: [
    q('We cannot delay ___ the steel any longer.', ['ordering', 'to order', 'order'], 'delay + V-ing.'),
    q('The inspection was postponed ___ Monday.', ['until', 'since', 'during'], 'postpone + until/to + thời điểm.'),
    q('The client deferred ___ the retention.', ['paying', 'to pay', 'pay'], 'defer + V-ing.'),
    q('The Contractor may ___ work after giving 21 days’ notice.', ['suspend', 'postpone to', 'delay to'], 'Tạm dừng công việc (FIDIC 16.1) → suspend + work.'),
    q('Can we push the meeting ___ to Thursday?', ['back', 'off', 'out'], 'push back = lùi lại.'),
  ],
  resolve: [
    q('The parties ___ the dispute through mediation.', ['resolved', 'solved', 'dealt'], 'Tranh chấp → resolve.'),
    q('All comments have been ___ in Rev. B.', ['addressed', 'addressed to', 'dealt'], 'Xử lý ý kiến góp ý → address + N.'),
    q('Who will deal ___ the NCR from yesterday?', ['with', 'about', 'for'], 'deal with.'),
    q('Our QS will ___ the variation claim.', ['handle', 'handle with', 'deal'], 'handle + N (không with).'),
    q('We ___ the final account at USD 2.4 million.', ['settled', 'settled down', 'solved'], 'Quyết toán, dàn xếp → settle + N.'),
  ],
  inform: [
    q('Please inform ___ any changes to the delivery date.', ['us of', 'to us', 'us to'], 'inform + người + of.'),
    q('We would like to inform ___ that the pour will take place on Saturday.', ['you', 'to you', 'about'], 'inform cần tân ngữ chỉ người, không có to.'),
    q('The Contractor shall notify ___ of any accident immediately.', ['the Engineer', 'to the Engineer', 'with the Engineer'], 'notify + người trực tiếp + of.'),
    q('Please let me ___ if you need anything else.', ['know', 'to know', 'knowing'], 'let + sb + V nguyên mẫu.'),
    q('I will update you ___ the progress every Friday.', ['on', 'to', 'for'], 'update sb on sth.'),
  ],
  check: [
    q('The Engineer has 21 days to ___ the shop drawings.', ['review', 'review about', 'inspect on'], 'Xem xét hồ sơ → review + N.'),
    q('The Engineer will ___ the reinforcement on site at 10 am.', ['inspect', 'inspect on', 'review about'], 'Kiểm tra hiện trường → inspect + N.'),
    q('Please verify ___ the quantities are correct.', ['whether', 'about', 'on'], 'verify + whether/that.'),
    q('We ___ progress against the baseline every week.', ['monitor', 'monitor on', 'check about'], 'Theo dõi liên tục → monitor + N.'),
    q('Please check ___ the anchors are tight.', ['that', 'about', 'on'], 'check (that) + mệnh đề.'),
  ],
  refuse: [
    q('The subcontractor refused ___ the variation order.', ['to sign', 'signing', 'sign'], 'refuse + to V.'),
    q('The Engineer ___ two submittals last week.', ['rejected', 'rejected to', 'denied'], 'Bác bỏ hồ sơ trình → reject + N.'),
    q('Unfortunately, we must ___ your invitation.', ['decline', 'deny', 'reject to'], 'Từ chối lịch sự → decline.'),
    q('The supplier denied ___ the damage.', ['causing', 'to cause', 'cause'], 'deny + V-ing.'),
    q('We decline ___ the meeting on Sunday.', ['to attend', 'attending', 'attend'], 'decline + to V.'),
  ],
  allow: [
    q('Guardrails prevent workers ___ falling.', ['from', 'to', 'of'], 'prevent sb from V-ing.'),
    q('BIM enables ___ clashes early.', ['us to detect', 'to detect', 'us detecting'], 'enable + sb + to V.'),
    q('Let the team ___ the pour before you start.', ['finish', 'to finish', 'finishing'], 'let + sb + V nguyên mẫu.'),
    q('Smoking is strictly ___ on site.', ['prohibited', 'prohibit', 'prohibiting'], 'Bị động: be + V3.'),
    q('Visitors are not allowed ___ without PPE.', ['to enter', 'entering', 'enter'], 'be allowed + to V.'),
  ],
  increase: [
    q('Steel prices ___ sharply last month.', ['rose', 'raised', 'were risen'], 'Tự tăng, không tân ngữ → rise (rose).'),
    q('The supplier ___ the price by 8%.', ['raised', 'rose', 'risen'], 'Có tân ngữ → raise.'),
    q('Material costs increased ___ 5% in October.', ['by', 'of', 'with'], 'Mức thay đổi → by.'),
    q('Productivity ___ in December because of the rain.', ['fell', 'felled', 'was fallen'], 'Tự giảm, không tân ngữ → fall (fell).'),
    q('Prefabrication ___ the duration by two weeks.', ['reduced', 'fell', 'decreased of'], 'Có tân ngữ → reduce.'),
  ],
  complete: [
    q('The works shall commence ___ 3 November.', ['on', 'at', 'in'], 'Ngày → on.'),
    q('The installation in Zone B ___ on 12 November.', ['was completed', 'has been completing', 'completing'], 'Công việc được hoàn thành → bị động.'),
    q('The painters finished ___ Zone A yesterday.', ['painting', 'to paint', 'paint'], 'finish + V-ing.'),
    q('We will ___ Zone A to the client on Friday.', ['hand over', 'handover', 'hand on'], 'Động từ viết rời: hand over.'),
    q('We will start installing the seats ___ Monday.', ['on', 'at', 'in'], 'Ngày trong tuần → on.'),
  ],
}
