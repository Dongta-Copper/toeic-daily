import { FidicTopicView } from '@/components/Fidic'

export default async function FidicTopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FidicTopicView key={id} id={id} />
}
