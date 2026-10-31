import { PhraseGroupView } from '@/components/Phrases'

export default async function PhraseGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PhraseGroupView key={id} id={id} />
}
