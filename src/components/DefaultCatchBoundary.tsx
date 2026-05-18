import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => router.invalidate()}
          className="px-3 py-1.5 bg-amber-600 rounded text-white font-bold text-sm"
        >
          Zkusit znovu
        </button>
        {isRoot ? (
          <Link to="/" className="px-3 py-1.5 bg-stone-200 rounded text-stone-700 font-bold text-sm">
            Domů
          </Link>
        ) : (
          <Link
            to="/"
            onClick={() => router.invalidate()}
            className="px-3 py-1.5 bg-stone-200 rounded text-stone-700 font-bold text-sm"
          >
            Domů
          </Link>
        )}
      </div>
    </div>
  )
}
