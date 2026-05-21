import { CHORD_FREQS } from './chords'

// Dedicated AudioContext for mic — completely separate from the playback context
// so that adding mic input never disrupts ongoing synthesis.
// Never closed between uses; only cleaned up on component unmount.
let micCtx: AudioContext | null = null
let micStream: MediaStream | null = null
let micSrc: MediaStreamAudioSourceNode | null = null
let analyser: AnalyserNode | null = null

const FFT_SIZE = 8192

/**
 * Start the microphone.
 * AudioContext is created and resumed BEFORE the getUserMedia() await so that
 * the browser resume() call is still inside the user-gesture stack.
 */
export async function startMic(): Promise<void> {
  // Create the dedicated mic context once and keep it alive
  if (!micCtx) {
    micCtx = new AudioContext()
  }
  // Resume MUST happen before any await (still inside user-gesture stack)
  if (micCtx.state === 'suspended') {
    await micCtx.resume()
  }

  // Tear down any previous stream
  if (micSrc) { micSrc.disconnect(); micSrc = null }
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null }

  micStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    video: false,
  })

  // Create analyser once (reuse across start/stop cycles)
  if (!analyser) {
    analyser = micCtx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    analyser.smoothingTimeConstant = 0.2
  }

  micSrc = micCtx.createMediaStreamSource(micStream)
  micSrc.connect(analyser)
  // NOT connected to micCtx.destination — mic audio stays silent
}

/** Stop mic tracks. Keeps the AudioContext alive to avoid any reconfiguration cost. */
export function stopMic(): void {
  if (micSrc) { micSrc.disconnect(); micSrc = null }
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null }
}

/** Close the mic AudioContext. Call ONLY on component unmount. */
export function cleanupMic(): void {
  stopMic()
  analyser = null
  if (micCtx) { void micCtx.close(); micCtx = null }
}

/**
 * Stop mic tracks so Windows un-ducks playback, run playCallback, then restart mic.
 * This solves the Windows Communications Mode ducking problem: getUserMedia causes
 * the OS to reduce browser audio volume by ~80%. Stopping the mic track lets it recover.
 *
 * @param playCallback - called after a short un-duck delay (~120 ms)
 * @param restartMs   - how long after stopping mic to restart it (default 5000 ms)
 * @param onRestart   - called once mic is running again
 */
export function playWithMicGap(
  playCallback: () => void,
  restartMs = 5000,
  onRestart?: () => void,
): void {
  // Fully close mic AND its AudioContext so Chrome releases the OS capture device.
  // Just stopping tracks is sometimes not enough for Windows to un-duck.
  if (micSrc) { micSrc.disconnect(); micSrc = null }
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null }
  analyser = null
  const oldCtx = micCtx
  micCtx = null
  if (oldCtx) void oldCtx.close()

  // Edge needs more time to release Communications Mode than Chrome
  const isEdge = /Edg\//.test(navigator.userAgent)
  const UN_DUCK = isEdge ? 3500 : 1500
  // Ensure mic restarts well after the chord has been heard
  const effectiveRestart = Math.max(restartMs, UN_DUCK + 3500)
  setTimeout(() => playCallback(), UN_DUCK)

  // Rebuild mic context and restart detection after chord has been heard
  setTimeout(async () => {
    try {
      // AudioContext creation works after any prior user gesture on the page
      micCtx = new AudioContext()
      if (micCtx.state === 'suspended') await micCtx.resume()

      analyser = micCtx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = 0.2

      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      })
      micSrc = micCtx.createMediaStreamSource(micStream)
      micSrc.connect(analyser)
      onRestart?.()
    } catch { /* getUserMedia permission already granted — failure here is rare */ }
  }, effectiveRestart)
}

/** Returns the peak dB magnitude near a target frequency (±1.5% tuning tolerance). */
function peakMag(data: Float32Array, sr: number, freq: number): number {
  const binW = sr / FFT_SIZE
  const center = Math.round(freq / binW)
  const half = Math.max(2, Math.round((freq * 0.015) / binW))
  let best = -Infinity
  for (let i = Math.max(0, center - half); i <= Math.min(data.length - 1, center + half); i++) {
    if (data[i] > best) best = data[i]
  }
  return best
}

/**
 * Analyse the current microphone frame.
 * Returns null if no signal detected (silence), otherwise a map of chord key → match score.
 * Higher score = better match. Accumulate scores across multiple frames before deciding.
 */
export function getChordScores(): Record<string, number> | null {
  if (!analyser || !micCtx) return null

  const data = new Float32Array(analyser.frequencyBinCount)
  analyser.getFloatFrequencyData(data)

  const sr = micCtx.sampleRate  // use mic context's own sample rate
  const binW = sr / FFT_SIZE

  // Silence check — guitar range 80–1400 Hz, permissive threshold
  const lo = Math.max(0, Math.floor(80 / binW))
  const hi = Math.min(Math.ceil(1400 / binW), data.length - 1)
  let maxDb = -Infinity
  for (let i = lo; i <= hi; i++) if (data[i] > maxDb) maxDb = data[i]
  if (maxDb < -80) return null  // -80 dB — permissive, picks up quiet microphones

  const scores: Record<string, number> = {}
  for (const [key, freqs] of Object.entries(CHORD_FREQS)) {
    let total = 0
    for (const f of freqs) {
      // Check fundamental + 2nd harmonic (harmonics reinforce the fundamental presence)
      const m1 = peakMag(data, sr, f)
      const m2 = peakMag(data, sr, f * 2)
      // Convert dB to linear amplitude (floor at -100 dB to avoid -Infinity)
      const l1 = Math.pow(10, Math.max(-100, m1) / 20)
      const l2 = Math.pow(10, Math.max(-100, m2) / 20)
      total += l1 + 0.4 * l2
    }
    scores[key] = total / freqs.length
  }

  return scores
}
