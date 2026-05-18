import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect, useCallback } from 'react'
import { CHORDS, EXTRA_CHORDS, drawChord } from '~/utils/chords'
import { parseChordText, renderChordChart, convertTabFormat, ParsedSong } from '~/utils/song'
import { playTick, playChordSound } from '~/utils/audio'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/procvicovani-pisnicek')({
  head: () => ({
    meta: seo({
      title: 'Procvičování písniček | mojeKytara',
      description: 'Sbírka písní s akordy připravených k procvičování.',
    }),
  }),
  component: PisnePage,
})

const ALL_CHORDS = { ...CHORDS, ...EXTRA_CHORDS }

// ===== Saved songs (localStorage) =====
type SavedSong = { id: string; name: string; text: string; savedAt: number }
const STORAGE_KEY = 'kytara-songs'

function loadSavedSongs(): SavedSong[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function persistSongs(songs: SavedSong[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
}
const STRUM_PATTERNS = [
  { id: 'D',      label: 'D',           beats: ['D'] as string[] },
  { id: 'DU',     label: 'D·U',         beats: ['D', 'U'] as string[] },
  { id: 'DDU',    label: 'D·D·U',       beats: ['D', 'D', 'U'] as string[] },
  { id: 'DDUDU',  label: 'D·D·U·D·U',   beats: ['D', 'D', 'U', 'D', 'U'] as string[] },
  { id: 'DUDU',   label: 'D·U·D·U',     beats: ['D', 'U', 'D', 'U'] as string[] },
  { id: 'DUDUD',  label: 'D·U·D·U·D',   beats: ['D', 'U', 'D', 'U', 'D'] as string[] },
  { id: 'custom', label: 'Vlastní…',    beats: [] as string[] },
  { id: 'manual', label: 'Ručně ↵',     beats: [] as string[] },
]

function parseCustomBeats(input: string): string[] {
  return input.toUpperCase().split('').filter(c => c === 'D' || c === 'U' || c === '-')
}

type SongChord = { chord: string; ci: number }

function getSongChords(parsed: ParsedSong): SongChord[] {
  const chords: SongChord[] = []
  parsed.forEach(line => line.forEach(seg => {
    if (seg.chord !== null && seg.ci !== null) chords.push({ chord: seg.chord, ci: seg.ci })
  }))
  return chords
}

type PracticeRef = {
  chords: SongChord[]
  idx: number
  beat: number
  elapsed: number
  secs: number
  beatInterval: number
  strumBeats: string[]
  metro: boolean
  paused: boolean
}

function PisnePage() {
  const [songText, setSongText] = useState('')
  const [songParsed, setSongParsed] = useState<ParsedSong | null>(null)
  const songTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Saved songs
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>([])
  const [saveName, setSaveName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)

  useEffect(() => { setSavedSongs(loadSavedSongs()) }, [])

  // Practice settings
  const [strumId, setStrumId] = useState('DDUDU')
  const [customPatternInput, setCustomPatternInput] = useState('DDUDU')
  const [secs, setSecs] = useState(4)
  const [metro, setMetro] = useState(true)

  // Practice UI state
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [activeBeat, setActiveBeat] = useState(-1)
  const [flashKey, setFlashKey] = useState(0)

  const psRef = useRef<PracticeRef | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const songChartRef = useRef<HTMLDivElement>(null)

  // Scroll active chord into view
  useEffect(() => {
    if (!isActive) return
    const act = songChartRef.current?.querySelector('.seg.active')
    if (act) act.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentIdx, isActive])

  const handleSongTextChange = (text: string) => {
    setSongText(text)
    if (!text.trim()) { setSongParsed(null); return }
    setSongParsed(parseChordText(text))
  }

  const insertChordIntoText = (key: string) => {
    const ta = songTextareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const marker = `[${key}]`
    const newText = ta.value.slice(0, pos) + marker + ta.value.slice(pos)
    handleSongTextChange(newText)
    setTimeout(() => { ta.setSelectionRange(pos + marker.length, pos + marker.length); ta.focus() }, 0)
  }

  const handleSaveSong = () => {
    if (!songText.trim()) return
    const name = saveName.trim() || 'Bez názvu'
    const song: SavedSong = { id: Date.now().toString(), name, text: songText, savedAt: Date.now() }
    const updated = [song, ...savedSongs]
    setSavedSongs(updated)
    persistSongs(updated)
    setSaveName('')
    setShowSaveForm(false)
  }

  const handleLoadSong = (song: SavedSong) => {
    handleSongTextChange(song.text)
    setSaveName(song.name)
  }

  const handleDeleteSong = (id: string) => {
    const updated = savedSongs.filter(s => s.id !== id)
    setSavedSongs(updated)
    persistSongs(updated)
  }

  const stopPractice = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    psRef.current = null
    setIsActive(false)
    setIsPaused(false)
    setActiveBeat(-1)
  }, [])

  const startPractice = useCallback(() => {
    if (!songParsed) return
    const chords = getSongChords(songParsed)
    if (!chords.length) return
    const strumBeats = strumId === 'custom' ? parseCustomBeats(customPatternInput)
      : (STRUM_PATTERNS.find(p => p.id === strumId)?.beats ?? [])
    const beatInterval = strumBeats.length > 0 ? secs / strumBeats.length : secs
    const ps: PracticeRef = { chords, idx: 0, beat: -1, elapsed: 0, secs, beatInterval, strumBeats, metro, paused: false }
    psRef.current = ps
    setCurrentIdx(0)
    setActiveBeat(-1)
    setFlashKey(k => k + 1)
    setIsActive(true)
    setIsPaused(false)
    playChordSound(chords[0].chord)

    if (strumId === 'manual') return

    const TICK = 80
    timerRef.current = setInterval(() => {
      const ps = psRef.current
      if (!ps || ps.paused) return
      ps.elapsed += TICK / 1000
      if (ps.strumBeats.length > 0) {
        const beat = Math.floor(ps.elapsed / ps.beatInterval) % ps.strumBeats.length
        if (beat !== ps.beat) {
          ps.beat = beat
          if (ps.metro) playTick(beat === 0)
          const b = ps.strumBeats[beat]
          if (b !== '-') playChordSound(ps.chords[ps.idx].chord, false, undefined, b === 'U' ? 0.45 : 1.0)
          setActiveBeat(beat)
        }
      }
      if (ps.elapsed >= ps.secs) {
        ps.elapsed = 0
        ps.beat = -1
        const newIdx = (ps.idx + 1) % ps.chords.length
        ps.idx = newIdx
        setCurrentIdx(newIdx)
        setFlashKey(k => k + 1)
        playChordSound(ps.chords[newIdx].chord)
      }
    }, TICK)
  }, [songParsed, strumId, customPatternInput, secs, metro])

  const togglePause = useCallback(() => {
    const ps = psRef.current
    if (!ps) return
    ps.paused = !ps.paused
    setIsPaused(ps.paused)
  }, [])

  const advanceChord = useCallback((dir: 1 | -1) => {
    const ps = psRef.current
    if (!ps) return
    ps.elapsed = 0
    ps.beat = -1
    const newIdx = (ps.idx + dir + ps.chords.length) % ps.chords.length
    ps.idx = newIdx
    setCurrentIdx(newIdx)
    setFlashKey(k => k + 1)
    playChordSound(ps.chords[newIdx].chord)
  }, [])

  // Keyboard in practice mode
  useEffect(() => {
    if (!isActive) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopPractice()
      else if (e.key === ' ') { e.preventDefault(); togglePause() }
      else if (e.key === 'ArrowRight') advanceChord(1)
      else if (e.key === 'ArrowLeft') advanceChord(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, stopPractice, togglePause, advanceChord])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // ===== Derived =====
  const songChords = songParsed ? getSongChords(songParsed) : []
  const curChordKey = songChords[currentIdx]?.chord ?? ''
  const nxtChordKey = songChords[(currentIdx + 1) % Math.max(songChords.length, 1)]?.chord ?? ''
  const curCi = songChords[currentIdx]?.ci ?? -1
  const nxtCi = songChords[(currentIdx + 1) % Math.max(songChords.length, 1)]?.ci ?? -1
  const activeBeats = strumId === 'custom' ? parseCustomBeats(customPatternInput)
    : (STRUM_PATTERNS.find(p => p.id === strumId)?.beats ?? [])
  const strum = STRUM_PATTERNS.find(p => p.id === strumId) ?? STRUM_PATTERNS[0]
  const secsLabel = secs < 60 ? `${secs} s` : secs === 60 ? '1 min' : `1 min ${secs - 60} s`

  // ===== PRACTICE PANEL =====
  if (isActive && songParsed) {
    const curChord = ALL_CHORDS[curChordKey]
    const nxtChord = ALL_CHORDS[nxtChordKey]
    const chartHtml = renderChordChart(songParsed, curCi, nxtCi)

    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-stone-400">
            Akord {currentIdx + 1} / {songChords.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-lg text-sm transition-colors"
            >
              {isPaused ? '▶ Pokračovat' : '⏸ Pauza'}
            </button>
            <button
              onClick={stopPractice}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-lg text-sm transition-colors"
            >
              ✕ Konec
            </button>
          </div>
        </div>

        {/* Song chart */}
        <div
          ref={songChartRef}
          className="bg-white border border-stone-200 rounded-xl p-4 max-h-52 overflow-y-auto chord-chart shadow-sm mb-5"
          dangerouslySetInnerHTML={{ __html: chartHtml }}
        />

        {/* Current + Next chord */}
        <div className="grid grid-cols-[1fr_40px_200px] gap-4 items-center mb-5">
          <div key={flashKey} className="text-center flash cursor-pointer" onClick={() => playChordSound(curChordKey, true)}>
            <div className="text-2xl font-bold text-stone-900 mb-0.5">{curChord?.name ?? curChordKey}</div>
            <div className="text-sm text-stone-500 mb-2">{curChord?.notes ?? ''}</div>
            <div dangerouslySetInnerHTML={{ __html: drawChord(curChordKey, true, ALL_CHORDS) }} className="flex justify-center" />
          </div>
          <div className="text-3xl text-stone-400 text-center">→</div>
          <div className="text-center opacity-55">
            <div className="text-xs text-stone-400 uppercase tracking-widest mb-1">Následující</div>
            <div className="text-lg font-bold text-stone-800 mb-0.5">{nxtChord?.name ?? nxtChordKey}</div>
            <div className="text-xs text-stone-400 mb-2">{nxtChord?.notes ?? ''}</div>
            <div dangerouslySetInnerHTML={{ __html: drawChord(nxtChordKey, false, ALL_CHORDS) }} className="flex justify-center" />
          </div>
        </div>

        {/* Strumming pattern */}
        {activeBeats.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {activeBeats.map((b, i) => (
              <div
                key={i}
                className={`w-12 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold transition-all ${
                  i === activeBeat
                    ? 'bg-amber-500 text-white shadow-md translate-y-2 scale-95'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                <span className={`leading-none ${b === 'D' ? 'text-3xl' : b === 'U' ? 'text-base opacity-50' : 'text-xl opacity-30'}`}>{b === 'D' ? '▼' : b === 'U' ? '↑' : '—'}</span>
                <span className="text-[10px] font-semibold opacity-70">{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => advanceChord(-1)}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-colors text-sm"
          >
            ← Předchozí
          </button>
          <button
            onClick={() => advanceChord(1)}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition-colors text-sm"
          >
            Další →
          </button>
        </div>

        <p className="text-center text-xs text-stone-400 mt-4">
          Mezerník = pauza · ← → = přechod · Esc = konec
        </p>
      </div>
    )
  }

  // ===== SETUP PANEL =====
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-stone-900 mb-1 tracking-tight">Procvičování písniček</h1>
      <p className="text-stone-500 text-sm mb-8">
        Vlož text písně s akordy, vyber styl hraní a začni procvičovat.
      </p>

      {/* Saved songs */}
      {savedSongs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 pb-2 border-b border-stone-200">
            Uložené písničky
          </h2>
          <div className="space-y-2">
            {savedSongs.map(song => (
              <div key={song.id} className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 shadow-sm">
                <button
                  onClick={() => handleLoadSong(song)}
                  className="flex-1 text-left text-sm font-semibold text-stone-800 hover:text-amber-700 transition-colors truncate"
                >
                  {song.name}
                </button>
                <span className="text-xs text-stone-400 shrink-0">
                  {new Date(song.savedAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                </span>
                <button
                  onClick={() => handleDeleteSong(song.id)}
                  title="Smazat"
                  className="text-stone-300 hover:text-red-500 transition-colors text-base leading-none px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Text písně */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1 pb-2 border-b border-stone-200">
          1. Text písně
        </h2>
        <p className="text-xs text-stone-400 mb-3 mt-3 leading-relaxed">
          Vlož text s akordy ve formátu <code className="bg-stone-100 px-1 rounded">[G]slovo [D]jiné</code>.
        </p>

        {/* Tab format hint */}
        <details className="mb-3 group">
          <summary className="text-xs text-amber-600 font-semibold cursor-pointer select-none list-none flex items-center gap-1 w-fit hover:text-amber-500 transition-colors">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Jak funguje „Převést z tabulatury"?
          </summary>
          <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-500 leading-relaxed space-y-2">
            <p>
              Tabulatura zapisuje akordy <strong>nad řádky textu</strong> — každý akord je na samostatném řádku těsně nad slovem, ke kterému patří:
            </p>
            <pre className="bg-white border border-stone-200 rounded-lg p-2.5 font-mono text-stone-600 overflow-x-auto leading-5">{`G           D
Byl jsem malý kluk
      Em          C
Když jsem poznal první`}</pre>
            <p>
              Po kliknutí na tlačítko se text automaticky převede do inline formátu <code className="bg-stone-100 px-1 rounded">[G]Byl jsem [D]malý kluk</code>.
            </p>
          </div>
        </details>

        {/* Insert buttons */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => {
              const ta = songTextareaRef.current
              if (!ta) return
              const pos = ta.selectionStart
              const newText = ta.value.slice(0, pos) + '[]' + ta.value.slice(pos)
              handleSongTextChange(newText)
              setTimeout(() => { ta.setSelectionRange(pos + 1, pos + 1); ta.focus() }, 0)
            }}
            title="Prázdné závorky pro akord"
            className="px-2 py-0.5 text-xs font-mono border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded transition-colors font-semibold"
          >
            [ ]
          </button>
          {Object.keys(CHORDS).map((key) => (
            <button
              key={key}
              onClick={() => insertChordIntoText(key)}
              title={CHORDS[key].name}
              className="px-2 py-0.5 text-xs font-mono border border-stone-300 hover:bg-amber-100 hover:border-amber-500 hover:text-amber-700 rounded transition-colors text-stone-500"
            >
              [{key}]
            </button>
          ))}
        </div>

        <textarea
          ref={songTextareaRef}
          value={songText}
          onChange={(e) => handleSongTextChange(e.target.value)}
          placeholder={'[G]Byl jsem malý kluk\n[D]Když jsem poznal první lásku\n[A]Ona přišla ke mně [G]tenkrát\n[C]A já věděl [D]hned'}
          className="w-full bg-white border border-stone-300 focus:border-amber-500 rounded-lg p-3 text-sm font-mono text-stone-800 resize-y min-h-28 outline-none transition-colors leading-relaxed"
        />

        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => handleSongTextChange(convertTabFormat(songText))}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 hover:border-amber-400 rounded-xl transition-all shadow-sm"
          >
            ⇄ Převést z tabulatury
          </button>
          <button
            onClick={() => { setSongText(''); setSongParsed(null) }}
            className="px-4 py-2 text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
          >
            Vymazat text
          </button>
          {songText.trim() && (
            showSaveForm ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveSong(); if (e.key === 'Escape') setShowSaveForm(false) }}
                  placeholder="Název písničky…"
                  className="w-44 bg-white border border-stone-300 focus:border-amber-500 rounded-lg px-3 py-1.5 text-sm text-stone-800 outline-none transition-colors"
                />
                <button
                  onClick={handleSaveSong}
                  className="px-3 py-1.5 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
                >
                  Uložit
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="text-stone-400 hover:text-stone-600 text-sm px-1 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveForm(true)}
                className="px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 border border-amber-300 hover:border-amber-400 rounded-xl transition-all"
              >
                ☆ Uložit písničku
              </button>
            )
          )}
        </div>

        {/* Song preview */}
        {songParsed && songText.trim() && (
          <div className="mt-4">
            <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">Náhled:</div>
            <div
              className="bg-white border border-stone-200 rounded-lg p-4 chord-chart max-h-48 overflow-y-auto shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderChordChart(songParsed, -1, -1) }}
            />
          </div>
        )}
      </section>

      {/* Practice settings */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 pb-2 border-b border-stone-200">
          2. Nastavení procvičování
        </h2>

        {/* Strum pattern */}
        <div className="mb-5">
          <div className="text-sm text-stone-600 mb-3 font-medium">Styl úhozu:</div>
          <div className="flex flex-wrap gap-2">
            {STRUM_PATTERNS.map(p => (
              <button
                key={p.id}
                onClick={() => setStrumId(p.id)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  strumId === p.id
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700'
                }`}
              >
                {p.beats.length > 0 ? (
                  <span className="flex items-center gap-0.5">
                    {p.beats.map((b, i) => (
                      <span key={i} className={b === 'D' ? 'text-base' : 'text-xs opacity-70'}>
                        {b === 'D' ? '▼' : b === 'U' ? '↑' : '—'}
                      </span>
                    ))}
                    <span className="ml-1.5 text-xs opacity-60 font-normal">
                      {p.beats.length} {p.beats.length === 1 ? 'doba' : p.beats.length < 5 ? 'doby' : 'dob'}
                    </span>
                  </span>
                ) : p.label}
              </button>
            ))}
          </div>

          {/* Custom pattern input */}
          {strumId === 'custom' && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPatternInput}
                  onChange={e => setCustomPatternInput(e.target.value)}
                  placeholder="např. DDU-DU"
                  className="w-40 bg-white border border-stone-300 focus:border-amber-500 rounded-lg px-3 py-1.5 text-sm font-mono text-stone-800 outline-none transition-colors uppercase"
                />
                <span className="text-xs text-stone-400">D = dolů, U = nahoru, - = pauza</span>
              </div>
            </div>
          )}

          {/* Pattern preview */}
          {activeBeats.length > 0 && (
            <div className="flex gap-1.5 mt-3">
              {activeBeats.map((b, i) => (
                <div key={i} className="w-9 h-12 rounded-lg bg-stone-100 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-lg leading-none text-stone-500">{b === 'D' ? '⬇' : '⬆'}</span>
                  <span className="text-[9px] font-bold text-stone-400">{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seconds per chord + metro */}
        {strumId !== 'manual' && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm text-stone-600 min-w-44">Sekund na akord:</label>
              <input
                type="range"
                min={1}
                max={60}
                value={secs}
                onChange={(e) => setSecs(Number(e.target.value))}
                className="w-44 accent-amber-500"
              />
              <span className="text-base font-bold text-stone-900 min-w-12">{secsLabel}</span>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={metro}
                onChange={e => setMetro(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">Zvukový metronom (klik na každý úhoz)</span>
            </label>
          </div>
        )}
      </section>

      {/* Nápověda */}
      <details className="group">
        <summary className="cursor-pointer select-none text-sm text-stone-400 hover:text-amber-600 transition-colors list-none flex items-center gap-1.5">
          <span className="group-open:rotate-90 inline-block transition-transform text-xs">▶</span>
          Nápověda
        </summary>
        <div className="mt-3 rounded-2xl bg-stone-100 p-4 text-sm text-stone-700 space-y-4">

          <div>
            <div className="font-semibold text-stone-800 mb-1.5">Formát textu písně</div>
            <p className="text-stone-600 mb-2">Akordy se píší do hranatých závorek přímo v textu:</p>
            <pre className="bg-white rounded-xl px-3 py-2 text-xs font-mono text-stone-700 leading-relaxed border border-stone-200">{`[G]Byl jsem malý kluk\n[D]Když jsem poznal [A]první lásku\n[C]A já věděl [D]hned`}</pre>
          </div>

          <div>
            <div className="font-semibold text-stone-800 mb-1.5">Vlastní pattern úhozu</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-white rounded-xl px-3 py-2 border border-stone-200 text-center">
                <div className="text-lg font-bold text-stone-800">▼</div>
                <div className="text-xs text-stone-500 font-mono">D</div>
                <div className="text-xs text-stone-400">dolů</div>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 border border-stone-200 text-center">
                <div className="text-base font-bold text-stone-500 opacity-70">↑</div>
                <div className="text-xs text-stone-500 font-mono">U</div>
                <div className="text-xs text-stone-400">nahoru</div>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 border border-stone-200 text-center">
                <div className="text-base text-stone-400 opacity-50">—</div>
                <div className="text-xs text-stone-500 font-mono">-</div>
                <div className="text-xs text-stone-400">pauza</div>
              </div>
            </div>
            <p className="text-stone-600 text-xs">Příklady: <span className="font-mono bg-white border border-stone-200 rounded px-1">DDUDU</span> · <span className="font-mono bg-white border border-stone-200 rounded px-1">DD-U</span> · <span className="font-mono bg-white border border-stone-200 rounded px-1">D-DU-DU</span></p>
          </div>

          <div>
            <div className="font-semibold text-stone-800 mb-1.5">Klávesové zkratky při procvičování</div>
            <div className="space-y-1">
              {[
                ['Mezerník', 'Pauza / Pokračování'],
                ['← →', 'Předchozí / Další akord'],
                ['Esc', 'Zastavit'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="bg-white border border-stone-300 rounded-lg px-2 py-0.5 text-xs font-mono text-stone-700 shadow-sm min-w-16 text-center">{key}</kbd>
                  <span className="text-stone-500 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </details>

      {/* Start button */}
      <div>
        <button
          onClick={startPractice}
          disabled={songChords.length === 0}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-extrabold text-lg rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
        >
          {songChords.length === 0 ? 'Nejprve vlož text písně s akordy' : `▶ Začít procvičovat (${songChords.length} akordů)`}
        </button>
      </div>
    </div>
  )
}
