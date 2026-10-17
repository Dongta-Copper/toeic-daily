import IeltsRunner from '@/components/IeltsRunner'

export default async function IeltsPracticePage({ searchParams }: PageProps<'/ielts/practice'>) {
  const { test, section, type } = await searchParams
  const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)
  return <IeltsRunner test={one(test)} section={one(section)} type={one(type)} />
}
