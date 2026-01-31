import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { InternalMap } from '@/components/InternalMap'


export const Route = createFileRoute('/map/')({
  component: MapPage,
  ssr: false,
})

function MapPage() {
  return (
      <ClientOnly>
        <InternalMap />
      </ClientOnly>
  )
}
