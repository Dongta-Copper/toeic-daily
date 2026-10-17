import SituationDrill from '@/components/SituationDrill'

export default async function SituationDrillPage({ searchParams }: PageProps<'/situation/drill'>) {
  const { focus, report } = await searchParams
  return (
    <SituationDrill
      initialFocus={typeof focus === 'string' ? focus : undefined}
      reportId={typeof report === 'string' ? report : undefined}
    />
  )
}
