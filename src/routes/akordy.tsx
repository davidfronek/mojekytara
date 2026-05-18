import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { CHORDS, EXTRA_CHORDS, drawChord } from '~/utils/chords'
import { playChordSound } from '~/utils/audio'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/akordy')({
  head: () => ({
    meta: seo({
      title: 'Slovník akordů | mojeKytara',
      description: 'Přehledné diagramy kytarových akordů — Dur, Mol, septimové a další.',
    }),
  }),
  component: AkordyPage,
})

const ALL_CHORDS = { ...CHORDS, ...EXTRA_CHORDS }

const groups = [
  { label: 'Dur', keys: ['G', 'A', 'C', 'D', 'E', 'F', 'Bb', 'B', 'F#', 'Ab'] },
  { label: 'Mol', keys: ['Em', 'Am', 'Dm', 'Fm', 'Gm', 'Bm', 'Cm', 'F#m', 'Abm', 'Bbm', 'C#m'] },
  { label: 'Dominantní septimové', keys: ['G7', 'A7', 'C7', 'D7', 'E7', 'F7', 'F#7', 'B7'] },
  { label: 'Molové septimové', keys: ['Am7', 'Em7', 'Dm7'] },
  { label: 'Major 7', keys: ['Fmaj7'] },
  { label: 'Sus & add', keys: ['Dsus4', 'Asus4', 'Gsus4', 'Cadd9', 'Gadd9'] },
]

function ChordCard({
  chordKey,
  onPrint,
  dimmed,
  selected,
  selectionMode,
  onToggleSelect,
  inBasket,
  onTogglePractice,
}: {
  chordKey: string
  onPrint: (key: string) => void
  dimmed: boolean
  selected: boolean
  selectionMode: boolean
  onToggleSelect: (key: string) => void
  inBasket: boolean
  onTogglePractice: (key: string) => void
}) {
  const ch = ALL_CHORDS[chordKey]
  if (!ch) return null
  return (
    <div
      onClick={selectionMode ? () => onToggleSelect(chordKey) : undefined}
      className={`group relative bg-white rounded-2xl p-5 text-center w-full shadow-sm transition-all duration-200 print:break-inside-avoid ${
        selectionMode
          ? `cursor-pointer border-2 ${selected ? 'border-amber-400 ring-2 ring-amber-200' : 'border-stone-200 hover:border-amber-300'}`
          : 'border border-stone-200 hover:border-amber-400 group-hover/cards:opacity-50 group-hover/cards:blur-[1px] group-hover/cards:scale-95 hover:!opacity-100 hover:!blur-none hover:scale-[1.22] hover:shadow-2xl hover:z-10'
      } print:!opacity-100 print:!blur-none print:!scale-100 print:shadow-none print:border-stone-300 ${dimmed ? 'print:hidden' : ''}`}
    >
      {selectionMode && (
        <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs transition-all ${selected ? 'bg-amber-500 border-amber-500 text-white' : 'border-stone-300 bg-white'}`}>
          {selected ? '✓' : ''}
        </div>
      )}
      <div
        dangerouslySetInnerHTML={{ __html: drawChord(chordKey, false, ALL_CHORDS) }}
        className="mb-3 flex justify-center"
      />
      <div className="font-bold text-stone-900 text-sm">{ch.name}</div>
      <div className="text-stone-400 text-xs mt-0.5">{ch.notes}</div>
      {!selectionMode && (
        <div className="flex gap-2 mt-3 print:hidden">
          <button
            onClick={() => playChordSound(chordKey, true, ch)}
            className="flex-1 px-3 py-1.5 text-xs bg-stone-50 group-hover:bg-amber-50 border border-stone-200 group-hover:border-amber-300 group-hover:text-amber-700 rounded-lg transition-all text-stone-500"
          >
            ▶ Přehrát
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePractice(chordKey) }}
            title={inBasket ? 'Odebrat z procvičování' : 'Přidat k procvičování'}
            className={`px-2.5 py-1.5 text-xs border rounded-lg transition-all ${
              inBasket
                ? 'bg-amber-100 border-amber-400 text-amber-700 font-bold'
                : 'bg-stone-50 group-hover:bg-stone-100 border-stone-200 text-stone-400 hover:text-amber-700 hover:border-amber-400'
            }`}
          >
            {inBasket ? '✓' : '+'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPrint(chordKey) }}
            title="Tisknout tento akord"
            className="px-2.5 py-1.5 text-xs bg-stone-50 group-hover:bg-stone-100 border border-stone-200 rounded-lg transition-all text-stone-400 hover:text-stone-700"
          >
            🖸
          </button>
        </div>
      )}
    </div>
  )
}

function AkordyPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [printKey, setPrintKey] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [practiceBasket, setPracticeBasket] = useState<Set<string>>(new Set())

  const handleTogglePractice = useCallback((key: string) => {
    setPracticeBasket(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleGoToPractice = useCallback(() => {
    localStorage.setItem('kytara-practice-add', JSON.stringify([...practiceBasket]))
    setPracticeBasket(new Set())
    navigate({ to: '/procvicovani-akordu' })
  }, [practiceBasket, navigate])

  useEffect(() => {
    if (printKey !== null) {
      const t = setTimeout(() => {
        window.print()
        setPrintKey(null)
      }, 60)
      return () => clearTimeout(t)
    }
  }, [printKey])

  const handlePrint = useCallback((key: string) => setPrintKey(key), [])

  const handleToggleSelect = useCallback((key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handlePrintSelected = useCallback(() => { window.print() }, [])

  const q = query.trim().toLowerCase()
  const filteredKeys = q
    ? Object.entries(ALL_CHORDS)
        .filter(([key, ch]) =>
          key.toLowerCase().includes(q) ||
          ch.name.toLowerCase().includes(q)
        )
        .map(([key]) => key)
    : null

  const isDimmed = (key: string) =>
    selectionMode && selectedKeys.size > 0 && !selectedKeys.has(key)

  return (
    <>
      {/* Single-chord print overlay — hidden on screen, shown in print when printKey is set */}
      {printKey && (() => {
        const ch = ALL_CHORDS[printKey]
        return (
          <div className="hidden print:flex print:items-center print:justify-center print:min-h-screen print:bg-white">
            <div className="text-center">
              <div
                dangerouslySetInnerHTML={{ __html: drawChord(printKey, true, ALL_CHORDS) }}
                className="flex justify-center mb-6"
              />
              <div className="font-black text-3xl text-stone-900 mt-2">{ch?.name}</div>
              <div className="text-stone-400 text-base mt-1">{ch?.notes}</div>
            </div>
          </div>
        )
      })()}

      <div className={`max-w-5xl mx-auto px-6 py-12 ${printKey ? 'print:hidden' : ''} ${practiceBasket.size > 0 ? 'pb-32' : ''}`}>
        <div className="mb-8 print:hidden">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-black text-stone-900 mb-2 tracking-tight">Slovník akordů</h1>
              <p className="text-stone-500">
                Klikni na ▶ pro přehrání akordu. Každý diagram ukazuje polohu prstů na krku kytary.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden shrink-0">
              {selectionMode ? (
                <>
                  <span className="text-sm text-stone-500 whitespace-nowrap">{selectedKeys.size} vybráno</span>
                  <button
                    onClick={handlePrintSelected}
                    disabled={selectedKeys.size === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🖸 Tisk vybraných
                  </button>
                  <button
                    onClick={() => { setSelectionMode(false); setSelectedKeys(new Set()) }}
                    className="px-4 py-2 text-sm font-medium text-stone-500 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-all"
                  >
                    Zrušit
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 text-sm font-medium text-stone-500 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all"
                  >
                    🖸 Tisk vše
                  </button>
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="px-4 py-2 text-sm font-medium text-stone-500 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all"
                  >
                    ☑ Výběr pro tisk
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="relative max-w-sm print:hidden">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat akord… (G, Dur, Am, F#…)"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {filteredKeys ? (
          filteredKeys.length > 0 ? (
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-3 print:grid-cols-4 print:gap-3 ${selectionMode ? '' : 'group/cards'}`}>
              {filteredKeys.map((key) => (
                <ChordCard
                  key={key}
                  chordKey={key}
                  onPrint={handlePrint}
                  dimmed={isDimmed(key)}
                  selected={selectedKeys.has(key)}
                  selectionMode={selectionMode}
                  onToggleSelect={handleToggleSelect}
                  inBasket={practiceBasket.has(key)}
                  onTogglePractice={handleTogglePractice}
                />
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-sm py-10 text-center">Žádný akord nenalezen pro „{query}"</p>
          )
        ) : (
          groups.map(({ label, keys }) => {
            const groupHidden = selectionMode && selectedKeys.size > 0 && !keys.some(k => selectedKeys.has(k))
            return (
            <section key={label} className={`mb-12 ${groupHidden ? 'print:hidden' : ''}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-stone-200" />
                <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest px-2">
                  {label}
                </h2>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-3 print:grid-cols-4 print:gap-3 ${selectionMode ? '' : 'group/cards'}`}>
                {keys.map((key) => (
                  <ChordCard
                    key={key}
                    chordKey={key}
                    onPrint={handlePrint}
                    dimmed={isDimmed(key)}
                    selected={selectedKeys.has(key)}
                    selectionMode={selectionMode}
                    onToggleSelect={handleToggleSelect}
                    inBasket={practiceBasket.has(key)}
                    onTogglePractice={handleTogglePractice}
                  />
                ))}
              </div>
            </section>
            )
          })
        )}
      </div>

      {/* Practice basket sticky bar */}
      {practiceBasket.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-xl print:hidden">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3">
            <div className="flex-1 flex flex-wrap gap-1.5">
              {[...practiceBasket].map(key => (
                <span key={key} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 text-sm font-semibold">
                  {key}
                  <button
                    onClick={() => handleTogglePractice(key)}
                    className="text-amber-500 hover:text-amber-800 leading-none ml-0.5"
                  >×</button>
                </span>
              ))}
            </div>
            <button
              onClick={handleGoToPractice}
              className="shrink-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all shadow-md text-sm"
            >
              Procvičovat {practiceBasket.size} {practiceBasket.size === 1 ? 'akord' : practiceBasket.size < 5 ? 'akordy' : 'akordů'} →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
