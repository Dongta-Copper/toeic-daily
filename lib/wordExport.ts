// Builds .docx files in the browser from simple Markdown (headings, bullets, bold, quotes),
// so every report can be opened in Word and pasted into any AI chat (ChatGPT, Claude, DeepSeek, Copilot…).

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

/** **bold** spans inside a line → runs. */
function runs(text: string): TextRun[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part) =>
    part.startsWith('**') && part.endsWith('**') ? new TextRun({ text: part.slice(2, -2), bold: true }) : new TextRun(part)
  )
}

export function markdownToDocx(markdown: string): Document {
  const children: Paragraph[] = []
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      children.push(new Paragraph(''))
      continue
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      const level = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][h[1].length - 1]
      children.push(new Paragraph({ heading: level, children: runs(h[2]) }))
      continue
    }
    const b = line.match(/^(\s*)[-*•]\s+(.*)$/)
    if (b) {
      children.push(new Paragraph({ bullet: { level: Math.min(2, Math.floor(b[1].length / 2)) }, children: runs(b[2]) }))
      continue
    }
    const q = line.match(/^>\s?(.*)$/)
    if (q) {
      children.push(new Paragraph({ indent: { left: 400 }, children: [new TextRun({ text: q[1], italics: true })] }))
      continue
    }
    if (/^---+$/.test(line)) {
      children.push(new Paragraph({ border: { bottom: { style: 'single', size: 6, color: '999999', space: 1 } }, children: [] }))
      continue
    }
    children.push(new Paragraph({ children: runs(line) }))
  }
  return new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{ children }],
  })
}

/** Downloads Markdown content as a Word file. */
export async function downloadWord(markdown: string, filename: string) {
  const blob = await Packer.toBlob(markdownToDocx(markdown))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
