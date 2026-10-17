// Checks an IELTS test JSON: numbering, answers, evidence quotes, word limits.
// Usage: node scripts-dev/validate-ielts.js public/ielts/gt-1.json [more files…]
const fs = require('fs')

const CHOICE = new Set(['tfng', 'yng', 'mcq', 'matching_features', 'matching_headings', 'matching_info'])
const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN']
const YNG = ['YES', 'NO', 'NOT GIVEN']

function validateTest(test) {
  const problems = []
  const numbers = []
  for (const section of test.sections) {
    const texts = new Map(section.texts.map((t) => [t.id, t.paragraphs.map((p) => `${p.heading ?? ''} ${p.text}`).join(' ')]))
    for (const g of section.groups) {
      const text = texts.get(g.textId)
      if (!text) problems.push(`${g.id}: unknown textId ${g.textId}`)
      const optionKeys = g.options?.map((o) => o.key)
      if (optionKeys && new Set(optionKeys).size !== optionKeys.length) problems.push(`${g.id}: duplicate option keys`)
      for (const q of g.questions) {
        numbers.push(q.n)
        const where = `Q${q.n} (${g.type})`
        if (!q.answer?.length) problems.push(`${where}: no answer`)
        if (!q.explanation) problems.push(`${where}: no explanation`)
        if (q.evidence && text && !text.includes(q.evidence)) problems.push(`${where}: evidence not found in text: "${q.evidence}"`)
        if (!q.evidence && !q.answer.includes('NOT GIVEN')) problems.push(`${where}: missing evidence`)
        if (CHOICE.has(g.type)) {
          const keys = g.type === 'tfng' ? TFNG : g.type === 'yng' ? YNG : g.type === 'mcq' ? q.options?.map((o) => o.key) : optionKeys
          if (!keys) problems.push(`${where}: no options`)
          else if (!q.answer.every((a) => keys.includes(a))) problems.push(`${where}: answer ${q.answer} not in options ${keys}`)
          if (g.type !== 'mcq' && g.type !== 'tfng' && g.type !== 'yng' && !q.prompt) problems.push(`${where}: no prompt`)
        } else {
          if (g.template && !g.template.includes(`{${q.n}}`)) problems.push(`${where}: placeholder missing in template`)
          if (!g.template && !q.prompt?.includes('___') && g.type === 'sentence_completion') problems.push(`${where}: prompt has no ___`)
          for (const a of q.answer) {
            const words = a.trim().split(/\s+/).length
            if (g.maxWords && words > g.maxWords) problems.push(`${where}: "${a}" has ${words} words > ${g.maxWords}`)
          }
          const first = q.answer[0].toLowerCase()
          if (text && !text.toLowerCase().includes(first)) problems.push(`${where}: answer "${q.answer[0]}" not found in text`)
        }
      }
    }
  }
  const sorted = [...numbers].sort((a, b) => a - b)
  sorted.forEach((n, i) => {
    if (n !== i + 1) problems.push(`numbering: expected ${i + 1}, got ${n}`)
  })
  return { problems, count: numbers.length }
}

module.exports = { validateTest }

if (require.main === module) {
  let failed = false
  for (const file of process.argv.slice(2)) {
    const test = JSON.parse(fs.readFileSync(file, 'utf8'))
    const { problems, count } = validateTest(test)
    const bySection = test.sections.map((s) => `S${s.number}: ${s.groups.reduce((n, g) => n + g.questions.length, 0)}`).join(', ')
    const words = test.sections.map((s) => `S${s.number} ${s.texts.reduce((n, t) => n + t.paragraphs.reduce((m, p) => m + p.text.split(/\s+/).length, 0), 0)}w`).join(', ')
    console.log(`${file}: ${count} questions (${bySection}) | ${words}`)
    if (problems.length) {
      failed = true
      console.log('  ' + problems.join('\n  '))
    } else console.log('  ALL CHECKS PASSED')
  }
  process.exit(failed ? 1 : 0)
}
