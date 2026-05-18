/**
 * /login – Přihlášení / Registrace
 *
 * ZATÍM NEAKTIVNÍ:
 *   - Stránka existuje na adrese /login, ale není v navigaci
 *   - Formulář je nefunkční (onSubmit nic nedělá)
 *   - Před aktivací: zprovoznit DB, API routy /api/auth/register + /api/auth/login,
 *     session cookies a middleware
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: seo({
      title: 'Přihlášení | mojeKytara',
      description: 'Přihlaste se nebo zaregistrujte a získejte přístup k synchronizaci písniček.',
    }),
  }),
  component: LoginPage,
})

const BENEFITS = [
  {
    icon: '☁️',
    title: 'Písničky v cloudu',
    desc: 'Uložené písničky dostupné na jakémkoliv zařízení – telefon, tablet, počítač.',
  },
  {
    icon: '🔄',
    title: 'Synchronizace',
    desc: 'Automaticky synchronizuj písničky uložené lokálně s účtem v databázi.',
  },
  {
    icon: '📂',
    title: 'Neomezené ukládání',
    desc: 'Žádný limit na počet uložených písniček (lokální localStorage má ~5 MB).',
  },
  {
    icon: '🔒',
    title: 'Soukromé sbírky',
    desc: 'Tvé písničky jsou jen tvoje – přístupné pouze po přihlášení.',
  },
]

function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: volat /api/auth/login nebo /api/auth/register
    alert('Přihlašování zatím není aktivní.')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Hlavička */}
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">🎸</div>
        <h1 className="text-2xl font-black text-stone-900 mb-3">Účet mojeKytara</h1>
        <p className="text-stone-600 text-sm max-w-lg mx-auto leading-relaxed mb-2">
          <strong>Procvičování funguje i bez registrace</strong> — písničky se ukládají přímo v tvém prohlížeči.
          Pokud si ale vytvoříš účet, získáš přístup k písničkám z jakéhokoliv zařízení a spoustu dalších výhod.
        </p>
        <div className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
          🚧 Registrace zatím není aktivní – připravujeme
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">

        {/* Výhody */}
        <div>
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-4">
            Co získáš s účtem
          </h2>
          <div className="space-y-3">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-3 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <span className="text-2xl shrink-0">{b.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-stone-800">{b.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulář */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden mt-9">

          {/* Tabs */}
          <div className="flex border-b border-stone-200">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-amber-700 border-b-2 border-amber-500 bg-amber-50'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {t === 'login' ? 'Přihlásit se' : 'Zaregistrovat se'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Uživatelské jméno</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled
                  placeholder="moje_jmeno"
                  className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-stone-800 outline-none disabled:opacity-50 disabled:bg-stone-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled
                placeholder="muj@email.cz"
                className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-stone-800 outline-none disabled:opacity-50 disabled:bg-stone-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled
                placeholder="••••••••"
                className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm text-stone-800 outline-none disabled:opacity-50 disabled:bg-stone-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled
              className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {tab === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}
            </button>

            <p className="text-center text-xs text-stone-400 leading-relaxed">
              Mezitím můžeš písničky ukládat lokálně v prohlížeči –{' '}
              <Link to="/procvicovani-pisnicek" className="text-amber-600 hover:underline">
                přejít na procvičování
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
