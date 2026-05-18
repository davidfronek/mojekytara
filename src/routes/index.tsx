import { createFileRoute, Link } from '@tanstack/react-router'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: seo({
      title: 'mojeKytara — Výuka hry na kytaru',
      description: 'Naučte se hrát na kytaru. Akordy, procvičování s metronomem a písně s akordy.',
    }),
  }),
  component: HomePage,
})

const features = [
  {
    to: '/akordy' as const,
    icon: '📖',
    color: 'bg-sky-50',
    title: 'Slovník akordů',
    description: 'Přehledné diagramy základních akordů — Dur, Mol, septimové. Ideální pro začátečníky.',
  },
  {
    to: '/procvicovani-akordu' as const,
    icon: '🎵',
    color: 'bg-amber-50',
    title: 'Procvičování akordů',
    description: 'Cvič přechody mezi akordy s metronomem, zvukem kytary a textem písně.',
  },
  {
    to: '/procvicovani-pisnicek' as const,
    icon: '🎶',
    color: 'bg-emerald-50',
    title: 'Procvičování písniček',
    description: 'Sbírka písní s akordy připravených k procvičování. Brzy k dispozici.',
  },
]

function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">
            Výuka kytary zdarma
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
            Nauč se hrát<br />
            <span className="text-amber-400">na kytaru</span>
          </h1>
          <p className="text-stone-400 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Procvičuj přechody mezi akordy s metronomem, zvukem kytary a textem písně.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/procvicovani-akordu"
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-base transition-all shadow-lg shadow-amber-900/30 hover:-translate-y-0.5"
            >
              ▶ Začít procvičovat
            </Link>
            <Link
              to="/akordy"
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-base transition-all"
            >
              📖 Slovník akordů
            </Link>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {features.map(({ to, icon, title, description, color }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col bg-white border border-stone-200 rounded-2xl p-6 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${color}`}>
                {icon}
              </div>
              <h2 className="text-base font-bold text-stone-900 mb-2">{title}</h2>
              <p className="text-sm text-stone-500 leading-relaxed flex-1">{description}</p>
              <div className="mt-5 text-sm font-semibold text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                Otevřít <span>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { value: '37+', label: 'Akordů' },
            { value: '100%', label: 'Zdarma' },
            { value: '✓', label: 'Bez registrace' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white border border-stone-200 rounded-2xl py-5 px-4 shadow-sm">
              <div className="text-2xl font-black text-amber-600">{value}</div>
              <div className="text-xs text-stone-500 mt-1 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
