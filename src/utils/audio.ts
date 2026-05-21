import { CHORD_FREQS, ChordData } from './chords'

let actx: AudioContext | null = null
let roomIR: AudioBuffer | null = null

export function getAudioContext(): AudioContext {
  if (!actx) {
    actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return actx
}

const OPEN_FREQS = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]

function deriveFreqs(ch: ChordData): number[] {
  return ch.strings
    .map((s, i) => {
      if (s.muted) return null
      if (s.open) return OPEN_FREQS[i]
      return OPEN_FREQS[i] * Math.pow(2, s.fret / 12)
    })
    .filter((f): f is number => f !== null)
}

/** Synthesize a short room impulse response (early reflections + diffuse tail). */
function buildRoomIR(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const duration = 0.7
  const len = Math.floor(sr * duration)
  const buf = ctx.createBuffer(2, len, sr)
  const decayRate = 6.0
  const reflTimes = [0.008, 0.013, 0.019, 0.027, 0.038, 0.052, 0.071]
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    // Early reflections with slight stereo offset
    for (let r = 0; r < reflTimes.length; r++) {
      const t = reflTimes[r] + (ch === 1 ? 0.001 : 0)
      const idx = Math.floor(t * sr)
      if (idx < len) data[idx] += 0.55 * Math.exp(-decayRate * t)
    }
    // Diffuse reverb tail
    for (let i = 0; i < len; i++) {
      data[i] += (Math.random() * 2 - 1) * 0.09 * Math.exp(-decayRate * (i / sr))
    }
  }
  return buf
}

function getRoomIR(ctx: AudioContext): AudioBuffer {
  if (!roomIR) roomIR = buildRoomIR(ctx)
  return roomIR
}

/**
 * Karplus-Strong string synthesis.
 * blend is frequency-dependent: bass strings sustain longer than treble.
 */
function generatePluck(sampleRate: number, freq: number, duration: number): Float32Array {
  const N = Math.max(2, Math.round(sampleRate / freq))
  const numSamples = Math.floor(sampleRate * duration)
  const out = new Float32Array(numSamples)
  const delay = new Float32Array(N)

  // Bass strings (low freq) → blend closer to 0.5 → longer sustain
  const blend = 0.4995 - Math.min(0.003, (freq / 400) * 0.003)

  // Pre-filtered excitation: one-pole LP on noise → darker, warmer pluck
  let prev = 0
  for (let i = 0; i < N; i++) {
    const t = i / N
    prev = 0.55 * prev + 0.45 * (Math.random() * 2 - 1)
    const shape = Math.sin(Math.PI * t)
    delay[i] = prev * 0.45 + shape * 0.55
  }

  for (let i = 0; i < numSamples; i++) {
    const idx = i % N
    out[i] = delay[idx]
    delay[idx] = blend * (delay[idx] + delay[(idx + 1) % N])
  }
  return out
}

export function playTick(accent: boolean): void {
  try {
    const ctx = getAudioContext()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    o.frequency.value = accent ? 1050 : 700
    g.gain.setValueAtTime(accent ? 0.45 : 0.25, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
    o.start(ctx.currentTime)
    o.stop(ctx.currentTime + 0.07)
  } catch (_) {}
}

export function playChordSound(key: string, force = false, chordData?: ChordData, gainMult = 1.0): void {
  const freqs = CHORD_FREQS[key] ?? (chordData ? deriveFreqs(chordData) : null)
  if (!freqs) return
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const duration = 5.0
    const strumDelay = 0.022  // ~22 ms between strings

    // HPF — cut sub-bass rumble
    const hpf = ctx.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.value = 75
    hpf.Q.value = 0.7

    // Body resonance — acoustic guitar body thump
    const body = ctx.createBiquadFilter()
    body.type = 'peaking'
    body.frequency.value = 180
    body.gain.value = 5
    body.Q.value = 1.4

    // Mid scoop — remove boxiness
    const midCut = ctx.createBiquadFilter()
    midCut.type = 'peaking'
    midCut.frequency.value = 650
    midCut.gain.value = -3
    midCut.Q.value = 1.0

    // Low-shelf warmth — acoustic body fullness
    const warmth = ctx.createBiquadFilter()
    warmth.type = 'lowshelf'
    warmth.frequency.value = 300
    warmth.gain.value = 4

    // LPF — tame harshness, acoustic softness
    const lpf = ctx.createBiquadFilter()
    lpf.type = 'lowpass'
    lpf.frequency.value = 3200
    lpf.Q.value = 0.6

    // Compressor — glue the chord together
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.knee.value = 10
    comp.ratio.value = 3
    comp.attack.value = 0.005
    comp.release.value = 0.35

    // Room reverb (dry/wet split)
    const convolver = ctx.createConvolver()
    convolver.buffer = getRoomIR(ctx)
    const wetGain = ctx.createGain()
    wetGain.gain.value = 0.20
    const dryGain = ctx.createGain()
    dryGain.gain.value = 0.80
    const masterGain = ctx.createGain()
    masterGain.gain.value = 2.5

    // Signal chain: hpf → body → midCut → warmth → lpf → comp → dry + wet reverb → master
    hpf.connect(body)
    body.connect(midCut)
    midCut.connect(warmth)
    warmth.connect(lpf)
    lpf.connect(comp)
    comp.connect(dryGain)
    comp.connect(convolver)
    convolver.connect(wetGain)
    dryGain.connect(masterGain)
    wetGain.connect(masterGain)
    masterGain.connect(ctx.destination)

    freqs.forEach((freq, i) => {
      const samples = generatePluck(ctx.sampleRate, freq, duration)
      const ab = ctx.createBuffer(1, samples.length, ctx.sampleRate)
      ab.getChannelData(0).set(samples)
      const src = ctx.createBufferSource()
      src.buffer = ab
      const g = ctx.createGain()
      const t0 = ctx.currentTime + i * strumDelay
      // Bass strings slightly louder for natural acoustic balance
      const stringGain = 0.28 * gainMult * (1 - i * 0.018)
      g.gain.setValueAtTime(stringGain, t0)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
      src.connect(g)
      g.connect(hpf)
      src.start(t0)
    })
  } catch (_) {}
}
