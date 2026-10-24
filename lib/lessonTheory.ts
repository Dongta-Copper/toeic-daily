// Fuller theory for each quick lesson, structured after Cambridge Grammar for IELTS (Hopkins & Cullen)
// and the Destination B2/C1 grammar books — paraphrased, with construction-workplace examples.

export type TheoryPoint = { rule: string; ex?: string; warn?: string }
export type TheorySection = { heading: string; points: TheoryPoint[] }
export type Theory = { ref: string; sections: TheorySection[] }

export const THEORY: Record<string, Theory> = {
  article: {
    ref: 'Cambridge Grammar for IELTS – Unit 8',
    sections: [
      {
        heading: 'a / an',
        points: [
          { rule: 'Nhắc đến lần đầu, người nghe chưa biết cái nào.', ex: 'We found a crack in the slab.' },
          { rule: 'Một cái bất kỳ trong nhiều cái cùng loại.', ex: 'Late approval is a common cause of delay.' },
          { rule: 'Xếp vào một nhóm / nói nghề nghiệp.', ex: 'He is a quantity surveyor. This is a fire-rated door.' },
          { rule: 'Chỉ dùng với danh từ đếm được số ít.', warn: 'an information ✗ → a piece of information ✓' },
        ],
      },
      {
        heading: 'the',
        points: [
          { rule: 'Người nghe biết là cái nào: đã nhắc trước, hoặc rõ từ ngữ cảnh.', ex: 'We found a crack in the slab. The crack is 2 mm wide.' },
          { rule: 'Chỉ có một trong bối cảnh đó.', ex: 'the Engineer, the site manager, the main entrance, the Contract' },
          { rule: 'Có cụm xác định phía sau (of…, mệnh đề, so sánh nhất).', ex: 'the cost of the variation, the drawings you sent, the biggest risk' },
          { rule: 'Vai trò trong hợp đồng FIDIC luôn có the.', ex: 'the Employer, the Contractor, the Engineer' },
        ],
      },
      {
        heading: 'Không mạo từ',
        points: [
          { rule: 'Danh từ số nhiều / không đếm được khi nói CHUNG.', ex: 'Contractors must follow safety rules. Concrete needs time to cure.' },
          { rule: 'Tên công ty, thành phố, quốc gia (đa số).', ex: 'Coteccons, Ho Chi Minh City, Vietnam' },
          { rule: 'Một số cụm cố định.', ex: 'on site, at work, by email, in progress, on time' },
          { rule: 'Nói chung thì bỏ the; nói nhóm cụ thể thì có the.', warn: 'The safety is important ✗ → Safety is important ✓ · The workers on Zone B are tired ✓' },
        ],
      },
    ],
  },
  plural_countable: {
    ref: 'Cambridge Grammar for IELTS – Unit 7',
    sections: [
      {
        heading: 'Đếm được vs không đếm được',
        points: [
          { rule: 'Đếm được: có số nhiều, đi với a/an, many, a few.', ex: 'a defect – several defects – many drawings' },
          { rule: 'Không đếm được: không có -s, động từ số ít, đi với much, a little.', ex: 'equipment, information, feedback, progress, advice, furniture, research, evidence, concrete, steel' },
          { rule: 'Muốn đếm danh từ không đếm được → thêm đơn vị.', ex: 'a piece of equipment, two items of feedback, 30 m³ of concrete, three tonnes of steel' },
          { rule: 'Có từ nhìn như số nhiều nhưng không đếm được.', warn: 'news, economics: The news is good ✓' },
        ],
      },
      {
        heading: 'Từ chỉ số lượng',
        points: [
          { rule: 'many / a few / few / a number of + danh từ đếm được số nhiều.', ex: 'a number of issues, few complaints' },
          { rule: 'much / a little / little / an amount of + không đếm được.', ex: 'a large amount of rework, little progress' },
          { rule: 'a lot of / plenty of / some / any dùng cho cả hai.', ex: 'a lot of defects, a lot of rework' },
          { rule: 'a few / a little = một ít (tích cực); few / little = rất ít (tiêu cực).', ex: 'We still have a few days. · Little progress was made.' },
        ],
      },
      {
        heading: 'Các cấu trúc hay sai',
        points: [
          { rule: 'one of the + danh từ số nhiều + động từ số ít.', ex: 'One of the main reasons is late approval.' },
          { rule: 'each / every + danh từ số ít.', ex: 'Each worker has a pass. Every drawing must be signed.' },
          { rule: 'Danh từ có thể vừa đếm được vừa không, nghĩa khác nhau.', ex: 'There is not much room (chỗ trống). We have two meeting rooms (phòng).' },
        ],
      },
    ],
  },
  subject_verb_agreement: {
    ref: 'Cambridge Grammar for IELTS – Unit 7, 8 · Destination B2',
    sections: [
      {
        heading: 'Tìm đúng chủ ngữ chính',
        points: [
          { rule: 'Bỏ qua cụm giới từ / mệnh đề chen giữa.', ex: 'The quality of the materials is good. The drawings that you sent are approved.' },
          { rule: 'V-ing hoặc mệnh đề làm chủ ngữ → số ít.', ex: 'Coordinating subcontractors takes time. What we need is more labour.' },
          { rule: 'Danh từ không đếm được → số ít.', ex: 'The equipment has arrived. The information was wrong.' },
        ],
      },
      {
        heading: 'Từ đi kèm quyết định số ít / số nhiều',
        points: [
          { rule: 'each / every / either / neither / one of … → số ít.', ex: 'Each of the zones has a supervisor.' },
          { rule: 'a number of + số nhiều → động từ số nhiều; the number of → số ít.', ex: 'A number of defects were found. The number of defects is falling.' },
          { rule: 'both / several / many / a few → số nhiều.', ex: 'Both options are acceptable.' },
        ],
      },
      {
        heading: 'Cẩn thận với there is / there are',
        points: [
          { rule: 'Chia theo danh từ đứng SAU.', ex: 'There are three open RFIs. There is a gap in the schedule.' },
          { rule: 'Danh từ tập hợp (team, staff, management) thường chia số ít trong văn bản quốc tế.', ex: 'The team has completed Zone A.' },
        ],
      },
    ],
  },
  tense: {
    ref: 'Cambridge Grammar for IELTS – Units 1–6',
    sections: [
      {
        heading: 'Hiện tại hoàn thành vs quá khứ đơn',
        points: [
          { rule: 'Quá khứ đơn: việc xong ở thời điểm cụ thể (yesterday, last week, on 5 May, in 2025, ago).', ex: 'We submitted the RFI yesterday.' },
          { rule: 'Hiện tại hoàn thành: kết quả còn liên quan đến bây giờ, không nêu thời điểm.', ex: 'We have submitted the RFI. (đã nộp — giờ đang chờ trả lời)' },
          { rule: 'HTHT với for / since / so far / yet / already / recently.', ex: 'We have worked on this project since 2025. The Engineer has not replied yet.' },
          { rule: 'Có mốc thời gian quá khứ thì không dùng HTHT.', warn: 'We have sent it last Monday ✗ → We sent it last Monday ✓' },
        ],
      },
      {
        heading: 'Hiện tại đơn vs tiếp diễn',
        points: [
          { rule: 'Hiện tại đơn: thói quen, quy định, sự thật.', ex: 'We hold a toolbox talk every morning.' },
          { rule: 'Tiếp diễn: việc đang diễn ra / tạm thời.', ex: 'We are installing the seats in Zone B this week.' },
          { rule: 'Động từ trạng thái không dùng tiếp diễn: know, need, believe, belong, consist of, include.', warn: 'We are needing more workers ✗ → We need more workers ✓' },
        ],
      },
      {
        heading: 'Tương lai trong email công việc',
        points: [
          { rule: 'will: cam kết, quyết định ngay lúc nói, dự đoán.', ex: 'We will send the revised drawing by Friday.' },
          { rule: 'be going to: kế hoạch đã định / dự đoán có căn cứ.', ex: 'We are going to pour the slab on Saturday.' },
          { rule: 'Hiện tại tiếp diễn: lịch đã sắp xếp.', ex: 'We are meeting the Engineer at 9 am tomorrow.' },
          { rule: 'Sau when / before / after / until / as soon as / if: dùng hiện tại, không dùng will.', warn: 'as soon as we will receive ✗ → as soon as we receive ✓' },
        ],
      },
    ],
  },
  passive: {
    ref: 'Cambridge Grammar for IELTS – Unit 22',
    sections: [
      {
        heading: 'Cách tạo: be (chia thì) + V3',
        points: [
          { rule: 'is done / is being done / was done / has been done / will be done / must be done / needs to be done.', ex: 'The slab is being poured. The NCR has been closed. The defects must be fixed before handover.' },
          { rule: 'Nội động từ (arrive, happen, occur, remain) không có bị động.', warn: 'The materials were arrived ✗ → The materials arrived ✓' },
        ],
      },
      {
        heading: 'Khi nào dùng bị động',
        points: [
          { rule: 'Việc quan trọng hơn người làm, hoặc người làm đã rõ / không cần nói.', ex: 'All materials are tested before use.' },
          { rule: 'Văn bản trang trọng, khách quan (báo cáo, biên bản, thư hợp đồng).', ex: 'It was agreed that… · You are requested to submit…' },
          { rule: 'Mô tả quy trình.', ex: 'The panels are cut, drilled and then delivered to site.' },
          { rule: 'Chủ ngữ là người tự làm / tự cảm nhận thì dùng chủ động.', warn: 'I am appreciated your help ✗ → I appreciate your help ✓' },
        ],
      },
      {
        heading: 'Cấu trúc bị động hay dùng',
        points: [
          { rule: 'It is reported / expected / agreed that…', ex: 'It is expected that the works will be completed in May.' },
          { rule: 'have something done: thuê người khác làm.', ex: 'We had the scaffold inspected.' },
          { rule: 'need + V-ing = need to be done.', ex: 'The joints need sealing.' },
        ],
      },
    ],
  },
  preposition: {
    ref: 'Cambridge Grammar for IELTS – Unit 19',
    sections: [
      {
        heading: 'Động từ + giới từ (học theo cụm)',
        points: [
          { rule: 'comply with, depend on, rely on, insist on, apply for, wait for, respond to, refer to, consist of, result in, result from.', ex: 'The works must comply with the specification.' },
          { rule: 'Động từ KHÔNG có giới từ: discuss, contact, approve, enter, reach, request, mention, attend.', warn: 'discuss about ✗ · contact with ✗ · request for (động từ) ✗' },
          { rule: 'apologise / explain / report / speak + to + người.', ex: 'Please explain the delay to the client.' },
        ],
      },
      {
        heading: 'Tính từ / danh từ + giới từ',
        points: [
          { rule: 'responsible for, aware of, familiar with, satisfied with, subject to, similar to, different from.', ex: 'The price is subject to change.' },
          { rule: 'impact on, effect on, delay in, increase in, demand for, request for, solution to, access to, approval of.', ex: 'The rain had an impact on the schedule. There was a delay in delivery.' },
        ],
      },
      {
        heading: 'Giới từ thời gian trong văn bản công việc',
        points: [
          { rule: 'by = trước / chậm nhất là; until = kéo dài đến.', ex: 'Reply by Friday. The road is closed until Friday.' },
          { rule: 'within = trong vòng; after = sau.', ex: 'within 28 days after receiving the Notice' },
          { rule: 'on + ngày, at + giờ, in + tháng/năm.', ex: 'on 5 May at 9:00 am, in June' },
          { rule: 'by + V-ing = bằng cách.', ex: 'By adding a night shift, we recovered a week.' },
        ],
      },
    ],
  },
  collocation: {
    ref: 'Cambridge Vocabulary for IELTS · Destination B2/C1 (collocations)',
    sections: [
      {
        heading: 'Động từ + danh từ cố định',
        points: [
          { rule: 'make: a decision, a proposal, progress, an effort, a mistake, a request, a payment.', ex: 'We made good progress this week.' },
          { rule: 'take: action, measures, responsibility, place, steps, into account.', ex: 'We took immediate action.' },
          { rule: 'do: work, business, research, a job, your best.', ex: 'The subcontractor did a good job.' },
          { rule: 'raise: a concern, an issue, a question, an RFI · place: an order · hold: a meeting · meet: a deadline / requirements.', ex: 'The consultant raised a concern about the fixing detail.' },
        ],
      },
      {
        heading: 'Không dịch từng chữ từ tiếng Việt',
        points: [
          { rule: 'gặp khó khăn → face / encounter difficulties.', warn: 'meet difficulties ✗' },
          { rule: 'đạt hiệu quả cao → be highly effective / achieve good results.', warn: 'reach high efficiency ✗' },
          { rule: 'làm cuộc họp → hold / arrange / set up a meeting.', warn: 'make a meeting ✗' },
          { rule: 'tăng cao → rise sharply / increase significantly.', warn: 'increase highly ✗' },
        ],
      },
      {
        heading: 'Tính từ / trạng từ + danh từ / động từ',
        points: [
          { rule: 'tight deadline, heavy rain, major milestone, minor defect, high quality, low cost, strong demand.', ex: 'We are working to a tight deadline.' },
          { rule: 'fully aware, highly recommended, closely monitor, significantly increase, strictly prohibited.', ex: 'Smoking is strictly prohibited on site.' },
        ],
      },
    ],
  },
  word_choice: {
    ref: 'Cambridge Vocabulary for IELTS · Destination C1 (formal register)',
    sections: [
      {
        heading: 'Từ trang trọng trong văn bản công việc',
        points: [
          { rule: 'finish → complete; ask for → request; tell → inform; get → receive/obtain; about → approximately; help → assist; start → commence.', ex: 'The works will commence on 3 November.' },
          { rule: 'Dùng thuật ngữ chuẩn của ngành thay vì từ chung chung.', ex: 'local authorities (cơ quan chức năng), senior management, professional background' },
        ],
      },
      {
        heading: 'Cặp từ dễ nhầm',
        points: [
          { rule: 'affect (động từ) / effect (danh từ); advice (danh từ) / advise (động từ).', ex: 'The rain affected progress. The rain had an effect on progress.' },
          { rule: 'economic (thuộc kinh tế) / economical (tiết kiệm); historic / historical.', ex: 'an economical design' },
          { rule: 'ensure (đảm bảo) / insure (mua bảo hiểm) / assure (cam đoan với ai).', ex: 'Please ensure the area is cordoned off.' },
          { rule: 'Từ chỉ lĩnh vực: platform (nền tảng công nghệ) ≠ background (nền tảng chuyên môn).', warn: 'professionals from different platforms ✗ → backgrounds ✓' },
        ],
      },
      {
        heading: 'Chọn từ đúng sắc thái',
        points: [
          { rule: 'problem (chung) / issue (vấn đề cần xử lý) / defect (lỗi kỹ thuật) / risk (chưa xảy ra).', ex: 'Two defects were found; one risk remains open.' },
          { rule: 'delay (chậm) / postpone (dời có chủ đích) / suspend (tạm dừng).', ex: 'The inspection was postponed to Monday.' },
        ],
      },
    ],
  },
  word_form: {
    ref: 'Cambridge Grammar for IELTS – Units 10, 25',
    sections: [
      {
        heading: 'Vị trí quyết định từ loại',
        points: [
          { rule: 'Trước danh từ → tính từ.', ex: 'environmental regulations, structural engineer, additional cost' },
          { rule: 'Sau a/the/my/this hoặc sau giới từ → danh từ.', ex: 'the importance of safety, in accordance with, for approval' },
          { rule: 'Bổ nghĩa cho động từ / tính từ → trạng từ.', ex: 'carefully check, significantly delayed, fully completed' },
          { rule: 'Sau be / become / seem → tính từ.', ex: 'The design is economical.' },
        ],
      },
      {
        heading: 'Đuôi từ thường gặp',
        points: [
          { rule: 'Danh từ: -tion, -ment, -ance/-ence, -ity, -ness, -ure.', ex: 'installation, commitment, compliance, safety, failure' },
          { rule: 'Tính từ: -al, -ive, -able, -ous, -ful, -ic.', ex: 'structural, effective, reliable, hazardous, successful' },
          { rule: 'Trạng từ: thường -ly.', ex: 'promptly, approximately, accordingly' },
        ],
      },
      {
        heading: 'Danh từ hóa (văn trang trọng, IELTS)',
        points: [
          { rule: 'Đổi động từ / tính từ thành danh từ để câu gọn và khách quan.', ex: 'The client approved it late → The late approval… · We installed the seats → The installation of the seats…' },
          { rule: 'Danh từ hóa đi kèm of và tính từ.', ex: 'a significant increase in cost, the rapid completion of Zone A' },
        ],
      },
    ],
  },
  relative_clause: {
    ref: 'Cambridge Grammar for IELTS – Units 12, 20',
    sections: [
      {
        heading: 'who / which / that / whose / where',
        points: [
          { rule: 'who: người; which: vật/sự việc; that: thay who/which trong mệnh đề xác định.', ex: 'The engineer who inspected the site… The drawings that you sent…' },
          { rule: 'whose: sở hữu; where: nơi chốn.', ex: 'the supplier whose delivery was late · the zone where the leak occurred' },
        ],
      },
      {
        heading: 'Xác định vs không xác định',
        points: [
          { rule: 'Xác định (không dấu phẩy): cần để biết là cái nào.', ex: 'The subcontractor that installed the ceiling has left.' },
          { rule: 'Không xác định (có dấu phẩy): thêm thông tin; KHÔNG dùng that.', warn: 'Zone C, that is…✗ → Zone C, which is still closed, …✓' },
          { rule: ', which … thay cho cả vế trước → động từ số ít.', ex: 'Access was given late, which has delayed the works.' },
        ],
      },
      {
        heading: 'Rút gọn mệnh đề quan hệ',
        points: [
          { rule: 'Bị động → V3.', ex: 'the materials (which were) delivered today' },
          { rule: 'Chủ động → V-ing.', ex: 'workers (who are) working at height' },
          { rule: 'Mục đích / kế hoạch → to V.', ex: 'the decision to extend the deadline' },
        ],
      },
    ],
  },
  linking: {
    ref: 'Cambridge Grammar for IELTS – Unit 23',
    sections: [
      {
        heading: 'Tương phản',
        points: [
          { rule: 'although / even though / while + mệnh đề.', ex: 'Although it rained, the pour went ahead.' },
          { rule: 'despite / in spite of + danh từ hoặc V-ing.', ex: 'Despite the rain, … · Despite working overtime, …' },
          { rule: 'However, / Nevertheless, đứng đầu câu mới, có dấu phẩy.', ex: 'The price is high. However, the quality is excellent.' },
          { rule: 'Không dùng although và but trong cùng một câu.', warn: 'Although it rained, but… ✗' },
        ],
      },
      {
        heading: 'Nguyên nhân – kết quả',
        points: [
          { rule: 'because / as / since + mệnh đề; because of / due to / owing to + danh từ.', ex: 'due to late access, because access was late' },
          { rule: 'Therefore, / As a result, / Consequently, + câu kết quả.', ex: 'Access was late. As a result, we request an EOT.' },
          { rule: 'so that + mệnh đề (mục đích); in order to + V.', ex: 'We added a night shift so that we could recover the delay.' },
        ],
      },
      {
        heading: 'Bổ sung & sắp xếp ý',
        points: [
          { rule: 'In addition, / Furthermore, / Moreover, (văn trang trọng); also đứng trước động từ.', ex: 'In addition, two RFIs remain open.' },
          { rule: 'Firstly, … Secondly, … Finally, / To sum up,', ex: 'Firstly, the access was late. Secondly, …' },
        ],
      },
    ],
  },
  word_order: {
    ref: 'Cambridge Grammar for IELTS – Units 10, 21',
    sections: [
      {
        heading: 'Vị trí trạng từ',
        points: [
          { rule: 'Trạng từ tần suất: trước động từ thường, sau be, sau trợ động từ đầu tiên.', ex: 'We always check… · The site is always clean. · We have never missed…' },
          { rule: 'Trạng từ cách thức / nơi chốn / thời gian thường ở cuối, theo thứ tự cách thức → nơi chốn → thời gian.', ex: 'The team worked hard on site yesterday.' },
          { rule: 'Không đặt trạng từ giữa động từ và tân ngữ.', warn: 'We check carefully the drawings ✗ → We check the drawings carefully ✓' },
        ],
      },
      {
        heading: 'Câu hỏi gián tiếp',
        points: [
          { rule: 'Sau Could you tell me / Please confirm / I wonder… → trật tự câu khẳng định (không đảo).', ex: 'Could you confirm when the materials will arrive?' },
          { rule: 'Câu hỏi Yes/No → if / whether.', ex: 'Please let me know whether the drawing is approved.' },
        ],
      },
      {
        heading: 'Cụm danh từ',
        points: [
          { rule: 'Danh từ chính đứng cuối; từ bổ nghĩa đứng trước.', ex: 'project management team, fire safety inspection' },
          { rule: 'Thứ tự tính từ: ý kiến → kích thước → tuổi/hình dạng → màu → chất liệu → mục đích.', ex: 'a large steel storage rack' },
        ],
      },
    ],
  },
  conditional: {
    ref: 'Cambridge Grammar for IELTS – Units 17, 18',
    sections: [
      {
        heading: 'Loại 0, 1, 2',
        points: [
          { rule: 'Loại 0 (luôn đúng): If + hiện tại, hiện tại.', ex: 'If concrete freezes, it loses strength.' },
          { rule: 'Loại 1 (có thể xảy ra): If + hiện tại, will / can / may + V.', ex: 'If the RFI is late, the works will stop.' },
          { rule: 'Loại 2 (giả định / lịch sự khi đàm phán): If + quá khứ, would / could + V.', ex: 'If you approved it today, we could start on Monday.' },
          { rule: 'Không dùng will trong mệnh đề if.', warn: 'If we will receive… ✗' },
        ],
      },
      {
        heading: 'Loại 3 & hỗn hợp (phân tích nguyên nhân, bài học)',
        points: [
          { rule: 'Loại 3: If + had V3, would have V3 (điều đã không xảy ra).', ex: 'If we had ordered earlier, we would have avoided the delay.' },
          { rule: 'should have V3: lẽ ra nên làm.', ex: 'We should have checked the levels before pouring.' },
        ],
      },
      {
        heading: 'Từ thay cho if',
        points: [
          { rule: 'unless = if … not; provided (that) / as long as = với điều kiện.', ex: 'Unless payment is made, we may suspend the works.' },
          { rule: 'Trang trọng: Should you + V … (= If you …).', ex: 'Should you have any questions, please contact me.' },
          { rule: 'in case = phòng khi; otherwise = nếu không.', ex: 'Please bring your PPE in case the site is open.' },
        ],
      },
    ],
  },
  noun_phrase: {
    ref: 'Cambridge Grammar for IELTS – Unit 12',
    sections: [
      {
        heading: 'Cấu tạo cụm danh từ',
        points: [
          { rule: 'Thông tin TRƯỚC danh từ: từ hạn định + tính từ + danh từ bổ nghĩa.', ex: 'the revised fire safety plan' },
          { rule: 'Thông tin SAU danh từ: cụm giới từ, V3, V-ing, to V.', ex: 'the delay in delivery · the drawings issued yesterday · workers working at height · a decision to extend' },
          { rule: 'Danh từ bổ nghĩa luôn ở dạng số ít.', warn: 'a drawings register ✗ → a drawing register ✓ · safety rules (không phải safeties rules)' },
        ],
      },
      {
        heading: 'Danh từ + giới từ',
        points: [
          { rule: 'of: số lượng, bộ phận, sở hữu với vật.', ex: 'the number of defects, a section of the wall, the price of the hotel (không dùng hotel’s price)' },
          { rule: 'Danh từ đi với giới từ cố định.', ex: 'increase in cost, impact on progress, access to the site, approval of the drawings, solution to the problem' },
          { rule: 'with = có (thay mệnh đề which have).', ex: 'rooms with natural light' },
        ],
      },
      {
        heading: 'Rút gọn bằng V3 / V-ing / to V',
        points: [
          { rule: 'V3 thay mệnh đề bị động.', ex: 'the data (which was) collected on site → the data collected on site' },
          { rule: 'V-ing thay mệnh đề chủ động.', ex: 'the contractor (who is) responsible for MEP → the contractor responsible for MEP' },
          { rule: 'to V sau danh từ chỉ kế hoạch, quyết định, thời gian, cách thức.', ex: 'our plan to build a new warehouse, the time to act, a way to reduce cost' },
        ],
      },
    ],
  },
}
