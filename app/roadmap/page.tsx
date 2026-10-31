import Roadmap from '@/components/Roadmap'
import { getSituationDays } from '@/lib/situationData'

export default async function RoadmapPage() {
  const days = (await getSituationDays()).map((d) => ({ day: d.day, date: d.date, total: d.sentences.length }))
  return <Roadmap days={days} />
}
