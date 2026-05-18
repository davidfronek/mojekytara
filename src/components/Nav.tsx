import { Link } from '@tanstack/react-router'

const links = [
  { to: '/' as const, label: 'Úvod' },
  { to: '/akordy' as const, label: 'Akordy' },
  { to: '/procvicovani-akordu' as const, label: 'Procvičování akordů' },
  { to: '/procvicovani-pisnicek' as const, label: 'Procvičování písniček' },
]

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200/80 print:hidden">
      <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center overflow-x-auto">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-3 group">
          <span className="w-8 h-8 bg-amber-500 group-hover:bg-amber-400 rounded-lg flex items-center justify-center text-base shadow-sm transition-colors">🎸</span>
          <span className="font-extrabold text-stone-900 tracking-tight text-lg">mojeKytara</span>
        </Link>
        <div className="flex-1 flex justify-center gap-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all whitespace-nowrap"
              activeProps={{ className: 'px-3.5 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white whitespace-nowrap shadow-sm' }}
            >
              {label}
            </Link>
          ))}
        </div>
        <Link
          to="/login"
          className="shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-400 hover:text-stone-600 hover:bg-stone-100 border border-stone-200 transition-all whitespace-nowrap"
          activeProps={{ className: 'shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 bg-amber-50 text-amber-700 whitespace-nowrap' }}
        >
          <span>👤</span>
          <span>Přihlásit se</span>
          <span className="bg-stone-200 text-stone-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">brzy</span>
        </Link>
      </nav>
    </header>
  )
}
