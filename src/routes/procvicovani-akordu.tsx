import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { CHORDS, EXTRA_CHORDS, ChordData, StringPosition, drawChord, CHORD_FREQS } from '~/utils/chords'
import { playTick, playChordSound, playReadyChime } from '~/utils/audio'
import { startMic, stopMic, cleanupMic, getChordScores, playWithMicGap } from '~/utils/chordDetector'
import { seo } from '~/utils/seo'

export const Route = createFileRoute('/procvicovani-akordu')({
  head: () => ({
    meta: seo({
      title: 'Procvičování akordů | mojeKytara',
      description: 'Procvičuj přechody mezi akordy s metronomem a zvukem kytary.',
    }),
  }),
  component: ProcvicovaniPage,
})

// ===== Types =====
type PracticeRef = {
  seq: string[]
  idx: number
  loopN: number
  secs: number
  beats: number
  elapsed: number
  beatInterval: number
  lastBeat: number
  paused: boolean
  loop: boolean
  manual: boolean
  metro: boolean
  chordSound: boolean
  micCheck: boolean
  startedAt: number
}

// ===== Helpers =====
function parseCustomStrings(vals: string[]): StringPosition[] {
  return vals.map((v) => {
    const norm = v.trim().toLowerCase()
    if (norm === 'x' || norm === '') return { muted: true, open: false, fret: 0, finger: 0 }
    const f = parseInt(norm)
    if (isNaN(f) || f < 0) return { muted: true, open: false, fret: 0, finger: 0 }
    if (f === 0) return { muted: false, open: true, fret: 0, finger: 0 }
    return { muted: false, open: false, fret: f, finger: f }
  })
}

const STR_LABELS = ['E', 'A', 'D', 'G', 'B', 'e']

// ===== Main component =====
function ProcvicovaniPage() {
  const [allChords, setAllChords] = useState<Record<string, ChordData>>({ ...CHORDS })
  const [seq, setSeq] = useState<string[]>([])
  const [secs, setSecs] = useState(4)
  const [beats, setBeats] = useState(4)
  const [metro, setMetro] = useState(true)
  const [chordSoundOn, setChordSoundOn] = useState(true)
  const [loop, setLoop] = useState(true)
  const [manual, setManual] = useState(false)

  // Practice UI
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [currentLoopN, setCurrentLoopN] = useState(1)
  const [activeBeat, setActiveBeat] = useState(0)
  const [progress, setProgress] = useState(0)
  const [practiceSeq, setPracticeSeq] = useState<string[]>([])
  const [flashKey, setFlashKey] = useState(0)

  // Custom chord modal
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customStrings, setCustomStrings] = useState<string[]>(['x', 'x', '0', '0', '0', '0'])

  const psRef = useRef<PracticeRef | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mic / acoustic check
  const [micCheck, setMicCheck] = useState(false)
  const [micError, setMicError] = useState(false)
  const [liveChord, setLiveChord] = useState<string | null>(null)
  const [micListening, setMicListening] = useState(true) // false = gap: chord playing, mic off
  const [correctCount, setCorrectCount] = useState(0)    // how many consecutive correct frames

  // Load basket from /akordy page
  useEffect(() => {
    const stored = localStorage.getItem('kytara-practice-add')
    if (!stored) return
    try {
      const keys: string[] = JSON.parse(stored)
      localStorage.removeItem('kytara-practice-add')
      const ALL = { ...CHORDS, ...EXTRA_CHORDS }
      const valid = keys.filter(k => ALL[k])
      if (valid.length > 0)
        setSeq(prev => {
          const result = [...prev]
          for (const k of valid) if (!result.includes(k)) result.push(k)
          return result
        })
    } catch {}
  }, [])

  // ===== Stop practice =====
  const stopPractice = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (detectIntervalRef.current) { clearInterval(detectIntervalRef.current); detectIntervalRef.current = null }
    psRef.current = null
    setIsActive(false)
    setIsPaused(false)
    setProgress(0)
    setActiveBeat(0)
    setCurrentIdx(0)
    setCurrentLoopN(1)
    setLiveChord(null)
    setMicListening(true)
    setCorrectCount(0)
    cleanupMic()
    setMicCheck(false)
  }, [])

  // ===== Advance chord (used by timer and manual mode) =====
  const doAdvanceChord = useCallback((ps: PracticeRef) => {
    ps.idx++
    ps.elapsed = 0
    ps.lastBeat = -1
    if (ps.idx >= ps.seq.length) {
      if (ps.loop) {
        ps.idx = 0
        ps.loopN++
        setCurrentLoopN(ps.loopN)
      } else {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        psRef.current = null
        setIsActive(false)
        return
      }
    }
    setCurrentIdx(ps.idx)
    setFlashKey((k) => k + 1)
    if (ps.chordSound) {
      if (ps.micCheck) {
        setMicListening(false)
        playWithMicGap(() => playChordSound(ps.seq[ps.idx]), 5000, () => { setMicListening(true); playReadyChime() })
      } else {
        playChordSound(ps.seq[ps.idx])
      }
    } else if (ps.micCheck) {
      // No chord sound — use mic gap just to restart mic cleanly
      playWithMicGap(() => {}, 3000, () => { setMicListening(true); playReadyChime() })
    }
  }, [])

  // ===== Start practice =====
  const startPractice = useCallback(() => {
    const ps: PracticeRef = {
      seq: [...seq],
      idx: 0, loopN: 1,
      secs, beats,
      elapsed: 0,
      beatInterval: secs / beats,
      lastBeat: -1,
      paused: false, loop, manual,
      metro, chordSound: chordSoundOn,
      micCheck,
      startedAt: Date.now(),
    }
    psRef.current = ps
    setPracticeSeq([...seq])
    setCurrentIdx(0)
    setCurrentLoopN(1)
    setActiveBeat(0)
    setProgress(0)
    setIsActive(true)
    setIsPaused(false)
    setFlashKey((k) => k + 1)
    if (chordSoundOn) {
      if (micCheck) {
        setMicListening(false)
        playWithMicGap(() => playChordSound(seq[0]), 5000, () => { setMicListening(true); playReadyChime() })
      } else {
        playChordSound(seq[0])
      }
    }

    if (micCheck) {
      let correctFrames = 0
      const NEEDED = 3
      // If sound is off, playWithMicGap won't run — start mic directly (we're in a click handler)
      if (!chordSoundOn) startMic().then(() => playReadyChime()).catch(() => setMicError(true))
      detectIntervalRef.current = setInterval(() => {
        const scores = getChordScores()
        if (!scores) { correctFrames = 0; setCorrectCount(0); setLiveChord(null); return }
        const [bestKey] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
        setLiveChord(bestKey)
        const cur = psRef.current
        if (!cur) return
        if (bestKey === cur.seq[cur.idx]) {
          correctFrames++
          setCorrectCount(correctFrames)
          if (correctFrames >= NEEDED) { correctFrames = 0; setCorrectCount(0); doAdvanceChord(cur) }
        } else {
          correctFrames = 0
          setCorrectCount(0)
        }
      }, 250)
    }

    const TICK = 80
    timerRef.current = setInterval(() => {
      const ps = psRef.current
      if (!ps || ps.paused) return
      ps.elapsed += TICK / 1000

      // Advance first — prevents double accent tick at chord boundary
      if (ps.elapsed >= ps.secs && !ps.manual && !ps.micCheck) {
        doAdvanceChord(ps)
        setProgress(0)
        return  // beat 0 accent fires on next tick (80 ms later, imperceptible)
      }

      const beat = Math.floor(ps.elapsed / ps.beatInterval)
      if (beat !== ps.lastBeat) {
        ps.lastBeat = beat
        const inBar = beat % ps.beats
        if (ps.metro && !ps.micCheck) playTick(inBar === 0)
        setActiveBeat(inBar)
      }
      setProgress(Math.min((ps.elapsed / ps.secs) * 100, 100))
    }, TICK)
  }, [seq, secs, beats, loop, manual, metro, chordSoundOn, micCheck, doAdvanceChord])

  // ===== Toggle pause =====
  const togglePause = useCallback(() => {
    const ps = psRef.current
    if (!ps) return
    ps.paused = !ps.paused
    setIsPaused(ps.paused)
  }, [])

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ps = psRef.current
      if (!ps) return
      if (e.key === ' ') {
        e.preventDefault()
        if (ps.manual) doAdvanceChord(ps)
        else togglePause()
      }
      if ((e.key === 'ArrowRight' || e.key === 'Enter') && ps.manual) {
        e.preventDefault()
        doAdvanceChord(ps)
      }
      if (e.key === 'Escape') stopPractice()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [doAdvanceChord, togglePause, stopPractice])

  // ===== Mic lifecycle — cleanup only; mic starts during practice via playWithMicGap =====
  useEffect(() => {
    if (!micCheck) {
      cleanupMic()
      setLiveChord(null)
    }
  }, [micCheck])

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current)
    cleanupMic()
  }, [])

  // ===== Derived values =====
  const curKey = practiceSeq[currentIdx] ?? ''
  const nxtKey = practiceSeq[(currentIdx + 1) % Math.max(practiceSeq.length, 1)] ?? ''

  const secsLabel = secs < 60 ? `${secs} s` : secs === 60 ? '1 min' : `1 min ${secs - 60} s`

  const customPreviewSvg = (() => {
    const key = customName.trim() || '?'
    const strings = parseCustomStrings(customStrings)
    const tempMap = { ...allChords, [key]: { name: key, notes: '', strings } }
    return drawChord(key, false, tempMap)
  })()

  const saveCustomChord = () => {
    const key = customName.trim()
    if (!key) return
    const strings = parseCustomStrings(customStrings)
    const toFinger = strings
      .map((s, i) => ({ ...s, i }))
      .filter((s) => !s.muted && !s.open)
      .sort((a, b) => a.fret - b.fret)
    let nextFinger = 1
    const fingers: Record<number, number> = {}
    toFinger.forEach((s) => { fingers[s.i] = nextFinger <= 4 ? nextFinger++ : 4 })
    const finalStrings: StringPosition[] = strings.map((s, i) =>
      s.muted || s.open ? s : { ...s, finger: fingers[i] ?? 1 },
    )
    setAllChords((prev) => ({ ...prev, [key]: { name: key, notes: '', strings: finalStrings } }))
    setShowCustomModal(false)
    setCustomName('')
    setCustomStrings(['x', 'x', '0', '0', '0', '0'])
  }

  const deleteChord = (key: string) => {
    setAllChords((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setSeq((prev) => prev.filter((k) => k !== key))
  }

  // ===== PRACTICE PANEL =====
  if (isActive) {
    const curChord = allChords[curKey]
    const nxtChord = allChords[nxtKey]

    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-stone-400">
            {loop && `Smyčka ${currentLoopN} · `}Akord {currentIdx + 1} / {practiceSeq.length}
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
              ⏹ Zastavit
            </button>
          </div>
        </div>

        {/* Sequence dots */}
        <div className="flex gap-1.5 justify-center flex-wrap mb-3">
          {practiceSeq.map((k, i) => (
            <div
              key={i}
              title={allChords[k]?.name ?? k}
              className={`w-3 h-3 rounded-full border transition-all ${
                i < currentIdx
                  ? 'bg-stone-400 border-stone-400'
                  : i === currentIdx
                    ? 'bg-amber-500 border-amber-500 scale-125'
                    : 'bg-stone-200 border-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Progress bar */}
        {!micCheck && (
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-amber-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        )}

        {/* Beat dots */}
        {!micCheck && (
        <div className="flex gap-2.5 justify-center mb-4">
          {Array.from({ length: beats }, (_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i === activeBeat
                  ? 'bg-amber-500 border-amber-500 scale-125'
                  : 'bg-stone-200 border-stone-300'
              }`}
            />
          ))}
        </div>
        )}

        {/* Acoustic check — live display */}
        {micCheck && (
          <div className="flex justify-center mb-5">
            {micError ? (
              <div className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm">
                Mikrofon není dostupný
              </div>
            ) : !micListening ? (
              <div className="px-4 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-500 text-sm flex items-center gap-2">
                <span>♪</span>
                <span>Poslechni si akord…</span>
              </div>
            ) : liveChord ? (
              liveChord === curKey ? (
                <div className="px-5 py-2.5 rounded-xl bg-green-50 border-2 border-green-400 flex items-center gap-3 shadow-sm">
                  <span className="text-green-600 font-bold text-base">✓ {allChords[liveChord]?.name ?? liveChord}</span>
                  <span className="flex gap-1.5">
                    {Array.from({ length: 3 }, (_, i) => (
                      <span
                        key={i}
                        className={`inline-block w-3 h-3 rounded-full transition-all duration-150 ${
                          i < correctCount
                            ? 'bg-green-500 scale-110'
                            : 'bg-stone-200'
                        }`}
                      />
                    ))}
                  </span>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold flex items-center gap-2">
                  <span>🎙</span>
                  <span>{allChords[liveChord]?.name ?? liveChord}</span>
                </div>
              )
            ) : (
              <div className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-400 text-sm flex items-center gap-2">
                <span className="animate-pulse">🎙</span>
                <span>Poslouchám…</span>
              </div>
            )}
          </div>
        )}

        {/* Current + Next chord */}
        <div className="grid grid-cols-[1fr_40px_220px] gap-4 items-center mb-6">
          {/* Current */}
          <div
            key={flashKey}
            className="text-center cursor-pointer flash"
            onClick={() => playChordSound(curKey, true)}
          >
            <div className="text-2xl font-bold text-stone-900 mb-0.5">
              {curChord?.name ?? curKey}
            </div>
            <div className="text-sm text-stone-500 mb-2">{curChord?.notes ?? ''}</div>
            <div
              dangerouslySetInnerHTML={{ __html: drawChord(curKey, true, allChords) }}
              className="flex justify-center"
            />
          </div>

          {/* Arrow */}
          <div className="text-3xl text-stone-400 text-center">→</div>

          {/* Next */}
          <div className="text-center opacity-55">
            <div className="text-xs text-stone-400 uppercase tracking-widest mb-1">Následující</div>
            <div className="text-lg font-bold text-stone-800 mb-0.5">{nxtChord?.name ?? nxtKey}</div>
            <div className="text-xs text-stone-400 mb-2">{nxtChord?.notes ?? ''}</div>
            <div
              dangerouslySetInnerHTML={{ __html: drawChord(nxtKey, false, allChords) }}
              className="flex justify-center"
            />
          </div>
        </div>

        {/* KB hint */}
        <div className="text-center text-xs text-stone-400 mt-4">
          {manual
            ? 'Mezerník / → = další akord | Esc = zastavit'
            : 'Mezerník = pauza | Esc = zastavit'}
        </div>
      </div>
    )
  }

  // ===== SETUP PANEL =====
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-stone-900 mb-1 tracking-tight">Procvičování akordů</h1>
      <p className="text-stone-500 text-sm mb-8">Vyber akordy, nastav tempo a spusť procvičování.</p>

      {/* 1. Chord cards */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 pb-2 border-b border-stone-200">
          1. Přidej akordy do sekvence
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-3 group/cards">
          {Object.keys(allChords).map((key) => {
            const ch = allChords[key]
            return (
              <div
                key={key}
                onClick={() => setSeq((prev) => [...prev, key])}
                className="group relative bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-400 rounded-2xl p-5 text-center w-full cursor-pointer transition-all duration-200 hover:scale-[1.22] hover:shadow-2xl hover:z-10 group-hover/cards:opacity-50 group-hover/cards:blur-[1px] group-hover/cards:scale-95 hover:!opacity-100 hover:!blur-none"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); deleteChord(key) }}
                  className="absolute top-2 right-2 hidden group-hover:block text-stone-400 hover:text-red-400 text-xs leading-none px-1"
                  title="Odebrat akord"
                >
                  ✕
                </button>
                <div
                  dangerouslySetInnerHTML={{ __html: drawChord(key, false, allChords) }}
                  className="mb-3 flex justify-center"
                />
                <div className="font-bold text-stone-900 text-sm">{ch.name}</div>
                <div className="text-stone-400 text-xs mt-0.5">{ch.notes}</div>
                <div className="text-stone-400 text-xs mt-2.5 flex items-center justify-center gap-1.5">
                  <span>+ přidat</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); playChordSound(key, true) }}
                    className="px-1.5 py-0.5 border border-stone-300 hover:border-amber-500 hover:text-amber-600 rounded text-xs transition-colors"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )
          })}
          {/* Add custom chord */}
          <div
            onClick={() => setShowCustomModal(true)}
            className="bg-white hover:bg-stone-50 border-2 border-dashed border-stone-300 hover:border-amber-400 rounded-2xl p-5 text-center w-full cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px] text-stone-400 hover:text-stone-600"
          >
            <div className="text-4xl mb-2">＋</div>
            <div className="text-sm font-medium">Vlastní akord</div>
          </div>
        </div>
      </section>

      {/* 2. Sequence */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 pb-2 border-b border-stone-200">
          2. Sekvence
        </h2>
        <div className="flex flex-wrap gap-2 min-h-12 p-3 border border-dashed border-stone-300 rounded-lg bg-stone-100/50 items-center">
          {seq.length === 0 ? (
            <span className="text-stone-400 text-sm italic">Klikni na akord výše pro přidání...</span>
          ) : (
            seq.map((k, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-stone-200 rounded-lg px-3 py-1.5">
                <span className="font-bold text-stone-800 text-sm">{allChords[k]?.name ?? k}</span>
                <button
                  onClick={() => setSeq((prev) => prev.filter((_, j) => j !== i))}
                  className="text-stone-500 hover:text-red-400 text-base leading-none ml-1"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        {seq.length > 0 && (
          <button
            onClick={() => setSeq([])}
            className="mt-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Vymazat vše
          </button>
        )}
      </section>

      {/* 3. Timing */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 pb-2 border-b border-stone-200">
          3. Časování a nastavení
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm text-stone-600 min-w-44">Sekund na akord:</label>
            <input
              type="range"
              min={1}
              max={120}
              value={secs}
              onChange={(e) => setSecs(Number(e.target.value))}
              className="w-44 accent-amber-500"
            />
            <span className="text-base font-bold text-stone-900 min-w-14">{secsLabel}</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm text-stone-600 min-w-44">Doby na akord (beats):</label>
            <select
              value={beats}
              onChange={(e) => setBeats(Number(e.target.value))}
              className="bg-white border border-stone-300 text-stone-800 rounded px-2 py-1 text-sm"
            >
              <option value={1}>1 doba</option>
              <option value={2}>2 doby</option>
              <option value={4}>4 doby</option>
              <option value={8}>8 dob</option>
            </select>
          </div>

          {[
            { val: metro, set: setMetro, label: 'Metronom – zvukový klik na každou dobu' },
            { val: chordSoundOn, set: setChordSoundOn, label: 'Přehrát akord při každé změně (kytara)' },
            { val: loop, set: setLoop, label: 'Opakovat sekvenci ve smyčce' },
            { val: manual, set: setManual, label: 'Ruční přechod — Mezerník / → = další akord (bez časovače)' },
          ].map(({ val, set, label }) => (
            <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => set(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 4. Acoustic check */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-4 pb-2 border-b border-stone-200">
          4. Akustická kontrola
        </h2>
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={micCheck}
              onChange={(e) => setMicCheck(e.target.checked)}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
            <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
              Detekovat zahraný akord mikrofonem 🎙
            </span>
          </label>
          {micCheck && (
            <p className="text-xs text-stone-400 ml-6.5">
              Mikrofon se spustí při zahájení cvičení. Akord postupuje automaticky po správném zahraní (3× detekce).
            </p>
          )}
        </div>
      </section>

      {/* Start button */}
      <button
        onClick={startPractice}
        disabled={seq.length === 0}
        className="w-full max-w-sm block mx-auto py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:cursor-not-allowed text-white disabled:text-stone-400 font-bold text-lg rounded-xl transition-colors"
      >
        ▶ Spustit procvičování
      </button>

      {/* Custom chord modal */}
      {showCustomModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCustomModal(false) }}
        >
          <div className="bg-white border border-stone-200 rounded-2xl p-6 w-80 max-w-full shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900 mb-4">Přidat vlastní akord</h3>

            <label className="text-xs text-stone-500 block mb-1">Název (např. F, Bm, G7)</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="F"
              maxLength={8}
              className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-stone-900 outline-none mb-3"
            />

            <label className="text-xs text-stone-500 block mb-1">Polohy prstů (E A D G B e)</label>
            <p className="text-xs text-stone-400 mb-2">Císlo pražce (0 = prázdná, x = utlumená)</p>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {STR_LABELS.map((strLabel, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-stone-500 mb-1">{strLabel}</div>
                  <input
                    type="text"
                    value={customStrings[i]}
                    maxLength={2}
                    onChange={(e) => setCustomStrings((prev) => {
                      const next = [...prev]
                      next[i] = e.target.value
                      return next
                    })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded px-1 py-1 text-xs text-center text-stone-900 outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Preview */}
            <div
              className="flex justify-center my-3"
              dangerouslySetInnerHTML={{ __html: customPreviewSvg }}
            />

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-sm border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={saveCustomChord}
                disabled={!customName.trim()}
                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
              >
                Přidat akord
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
