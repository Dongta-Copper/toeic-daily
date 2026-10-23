import { NextResponse } from 'next/server'
import { generateJSON } from '@/lib/gemini'

export const maxDuration = 60

// British IPA for a short English chunk (cached by the caller on the card).
export async function POST(req: Request) {
  try {
    const { text }: { text: string } = await req.json()
    const t = (text ?? '').trim().slice(0, 120)
    if (!t) return NextResponse.json({ error: 'empty' }, { status: 400 })
    const out = await generateJSON<{ ipa: string }>(
      `Give the British English IPA transcription of this phrase as it is normally spoken in a sentence: "${t}". Return JSON {"ipa": "/.../"} with stress marks, one pair of slashes for the whole phrase.`,
      { timeoutMs: 20000 }
    )
    return NextResponse.json({ ipa: out.ipa })
  } catch (e) {
    const detail = e instanceof Error ? e.message.slice(0, 200) : String(e)
    return NextResponse.json({ error: detail }, { status: 500 })
  }
}
