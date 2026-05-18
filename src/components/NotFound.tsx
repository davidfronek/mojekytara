import { Link } from '@tanstack/react-router'

export function NotFound({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <div className="text-6xl">🎸</div>
      <h1 className="text-2xl font-bold text-stone-800">Stránka nenalezena</h1>
      <div className="text-stone-500">
        {children || <p>Tato stránka neexistuje.</p>}
      </div>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded font-bold text-sm text-white transition-colors"
        >
          Zpět
        </button>
        <Link
          to="/"
          className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded font-bold text-sm text-stone-700 transition-colors"
        >
          Na úvod
        </Link>
      </div>
    </div>
  )
}
