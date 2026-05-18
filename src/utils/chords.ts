export type StringPosition = {
  muted: boolean
  open: boolean
  fret: number
  finger: number
}

export type ChordData = {
  name: string
  notes: string
  strings: StringPosition[]
  startFret?: number
}

export const CHORDS: Record<string, ChordData> = {
  G: {
    name: 'G Dur', notes: 'G · B · D',
    strings: [
      { muted: false, open: false, fret: 3, finger: 2 },
      { muted: false, open: false, fret: 2, finger: 1 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 3, finger: 3 },
      { muted: false, open: false, fret: 3, finger: 4 },
    ],
  },
  A: {
    name: 'A Dur', notes: 'A · C# · E',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 1 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 2, finger: 3 },
      { muted: false, open: true,  fret: 0, finger: 0 },
    ],
  },
  C: {
    name: 'C Dur', notes: 'C · E · G',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: false, fret: 3, finger: 3 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 1, finger: 1 },
      { muted: false, open: true,  fret: 0, finger: 0 },
    ],
  },
  D: {
    name: 'D Dur', notes: 'D · F# · A',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 1 },
      { muted: false, open: false, fret: 3, finger: 3 },
      { muted: false, open: false, fret: 2, finger: 2 },
    ],
  },
  E: {
    name: 'E Dur', notes: 'E · G# · B',
    strings: [
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 2, finger: 3 },
      { muted: false, open: false, fret: 1, finger: 1 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
    ],
  },
  Em: {
    name: 'E mol', notes: 'E · G · B',
    strings: [
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 2, finger: 3 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
    ],
  },
  Am: {
    name: 'A mol', notes: 'A · C · E',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 2, finger: 3 },
      { muted: false, open: false, fret: 1, finger: 1 },
      { muted: false, open: true,  fret: 0, finger: 0 },
    ],
  },
  Dm: {
    name: 'D mol', notes: 'D · F · A',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 3, finger: 3 },
      { muted: false, open: false, fret: 1, finger: 1 },
    ],
  },
  A7: {
    name: 'A7', notes: 'A · C# · E · G',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 3 },
      { muted: false, open: true,  fret: 0, finger: 0 },
    ],
  },
  D7: {
    name: 'D7', notes: 'D · F# · A · C',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 1, finger: 1 },
      { muted: false, open: false, fret: 2, finger: 3 },
    ],
  },
  E7: {
    name: 'E7', notes: 'E · G# · B · D',
    strings: [
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 2, finger: 3 },
      { muted: false, open: false, fret: 1, finger: 1 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 4 },
    ],
  },
  B7: {
    name: 'B7', notes: 'B · D# · F# · A',
    strings: [
      { muted: true,  open: false, fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 2 },
      { muted: false, open: false, fret: 1, finger: 1 },
      { muted: false, open: false, fret: 2, finger: 3 },
      { muted: false, open: true,  fret: 0, finger: 0 },
      { muted: false, open: false, fret: 2, finger: 4 },
    ],
  },
}

export const CHORD_FREQS: Record<string, number[]> = {
  G:  [98.00, 123.47, 146.83, 196.00, 293.66, 392.00],
  A:  [110.00, 164.81, 220.00, 277.18, 329.63],
  C:  [130.81, 164.81, 196.00, 261.63, 329.63],
  D:  [146.83, 220.00, 293.66, 369.99],
  E:  [82.41, 123.47, 164.81, 207.65, 246.94, 329.63],
  Em: [82.41, 123.47, 164.81, 196.00, 246.94, 329.63],
  Am: [110.00, 164.81, 220.00, 261.63, 329.63],
  Dm: [146.83, 220.00, 293.66, 349.23],
  A7: [110.00, 164.81, 196.00, 277.18, 329.63],
  D7: [146.83, 220.00, 246.94, 329.63],
  E7: [82.41, 123.47, 164.81, 207.65, 246.94, 369.99],
  B7: [123.47, 155.56, 220.00, 246.94, 369.99],
}

export const CHORD_ALIASES: Record<string, string> = {
  Emi: 'Em', Emin: 'Em', Emolle: 'Em',
  Ami: 'Am', Amin: 'Am', Amolle: 'Am',
  Dmi: 'Dm', Dmin: 'Dm', Dmolle: 'Dm',
  Hmi: 'Bm', Hmin: 'Bm', Hm: 'Bm',
  H: 'B', H7: 'B7',
  'A#': 'Bb', 'A#m': 'Bbm',
  Gb: 'F#', Gbm: 'F#m', Gbmin: 'F#m',
  'G#': 'Ab', 'G#m': 'Abm',
  Cis: 'C#', Cismi: 'C#m', Cismin: 'C#m',
  Dis: 'D#', Dismi: 'D#m',
  Fis: 'F#', Fismi: 'F#m', Fismin: 'F#m',
  Gis: 'Ab', Gismi: 'Abm',
}

export function normalizeChord(name: string): string {
  return CHORD_ALIASES[name] ?? name
}

// Helpers for compact chord position notation
const _x: StringPosition = { muted: true,  open: false, fret: 0, finger: 0 }
const _o: StringPosition = { muted: false, open: true,  fret: 0, finger: 0 }
const _f = (fret: number, finger: number): StringPosition => ({ muted: false, open: false, fret, finger })

/**
 * Extended chord dictionary — used to auto-fill unknown chords detected in song text.
 * Fret numbers are absolute. startFret shifts the diagram window for higher-position chords.
 * String order: E(0) A(1) D(2) G(3) B(4) e(5)
 */
export const EXTRA_CHORDS: Record<string, ChordData> = {
  // ─── F shape (1st position) ───────────────────────────────────────────────
  F: {
    name: 'F Dur', notes: 'F · A · C', startFret: 1,
    strings: [_f(1,1), _f(3,3), _f(3,4), _f(2,2), _f(1,1), _f(1,1)],
  },
  Fm: {
    name: 'F mol', notes: 'F · Ab · C', startFret: 1,
    strings: [_f(1,1), _f(3,3), _f(3,4), _f(1,1), _f(1,1), _f(1,1)],
  },
  F7: {
    name: 'F7', notes: 'F · A · C · Eb', startFret: 1,
    strings: [_f(1,1), _f(3,3), _f(1,1), _f(2,2), _f(1,1), _f(1,1)],
  },
  Fmaj7: {
    name: 'Fmaj7', notes: 'F · A · C · E', startFret: 1,
    strings: [_x, _x, _f(3,3), _f(2,2), _f(1,1), _o],
  },
  // ─── Bb shape ─────────────────────────────────────────────────────────────
  Bb: {
    name: 'Bb Dur', notes: 'Bb · D · F', startFret: 1,
    strings: [_x, _f(1,1), _f(3,3), _f(3,3), _f(3,3), _f(1,1)],
  },
  Bbm: {
    name: 'Bb mol', notes: 'Bb · Db · F', startFret: 1,
    strings: [_x, _f(1,1), _f(3,3), _f(3,3), _f(2,2), _f(1,1)],
  },
  // ─── B shape (2nd position) ───────────────────────────────────────────────
  B: {
    name: 'H Dur', notes: 'B · D# · F#', startFret: 2,
    strings: [_x, _f(2,1), _f(4,2), _f(4,3), _f(4,4), _f(2,1)],
  },
  Bm: {
    name: 'H mol', notes: 'B · D · F#', startFret: 2,
    strings: [_x, _f(2,1), _f(4,3), _f(4,4), _f(3,2), _f(2,1)],
  },
  B7: {
    // B7 already in CHORDS — this is a duplicate guard omitted intentionally
    name: 'H7', notes: 'B · D# · F# · A', startFret: 1,
    strings: [_x, _f(2,1), _f(1,1), _f(2,2), _f(2,3), _x],
  },
  // ─── F#/Gb shape (2nd position) ───────────────────────────────────────────
  'F#': {
    name: 'F# Dur', notes: 'F# · A# · C#', startFret: 2,
    strings: [_f(2,1), _f(4,3), _f(4,4), _f(3,2), _f(2,1), _f(2,1)],
  },
  'F#m': {
    name: 'F# mol', notes: 'F# · A · C#', startFret: 2,
    strings: [_f(2,1), _f(4,3), _f(4,4), _f(2,1), _f(2,1), _f(2,1)],
  },
  'F#7': {
    name: 'F#7', notes: 'F# · A# · C# · E', startFret: 2,
    strings: [_f(2,1), _f(4,3), _f(2,1), _f(3,2), _f(2,1), _f(2,1)],
  },
  // ─── G minor shape (3rd position) ─────────────────────────────────────────
  Gm: {
    name: 'G mol', notes: 'G · Bb · D', startFret: 3,
    strings: [_f(3,1), _f(5,3), _f(5,4), _f(3,1), _f(3,1), _f(3,1)],
  },
  // ─── Ab/G# shape (4th position) ───────────────────────────────────────────
  Ab: {
    name: 'Ab Dur', notes: 'Ab · C · Eb', startFret: 4,
    strings: [_f(4,1), _f(6,3), _f(6,4), _f(5,2), _f(4,1), _f(4,1)],
  },
  Abm: {
    name: 'Ab mol', notes: 'Ab · Cb · Eb', startFret: 4,
    strings: [_f(4,1), _f(6,3), _f(6,4), _f(4,1), _f(4,1), _f(4,1)],
  },
  // ─── C minor shape (3rd position) ─────────────────────────────────────────
  Cm: {
    name: 'C mol', notes: 'C · Eb · G', startFret: 3,
    strings: [_x, _f(3,1), _f(5,3), _f(5,4), _f(4,2), _f(3,1)],
  },
  // ─── C#/Db minor shape (4th position) ─────────────────────────────────────
  'C#m': {
    name: 'C# mol', notes: 'C# · E · G#', startFret: 4,
    strings: [_x, _f(4,1), _f(6,3), _f(6,4), _f(5,2), _f(4,1)],
  },
  // ─── Dominant 7ths ────────────────────────────────────────────────────────
  G7: {
    name: 'G7', notes: 'G · B · D · F', startFret: 1,
    strings: [_f(3,3), _f(2,2), _o, _o, _o, _f(1,1)],
  },
  C7: {
    name: 'C7', notes: 'C · E · G · Bb', startFret: 1,
    strings: [_x, _f(3,3), _f(2,2), _f(3,4), _f(1,1), _o],
  },
  // ─── Minor 7ths ───────────────────────────────────────────────────────────
  Am7: {
    name: 'Am7', notes: 'A · C · E · G', startFret: 1,
    strings: [_x, _o, _f(2,2), _o, _f(1,1), _o],
  },
  Em7: {
    name: 'Em7', notes: 'E · G · B · D', startFret: 1,
    strings: [_o, _f(2,2), _o, _o, _o, _o],
  },
  Dm7: {
    name: 'Dm7', notes: 'D · F · A · C', startFret: 1,
    strings: [_x, _o, _o, _f(2,2), _f(1,1), _f(1,1)],
  },
  // ─── Suspended / added ────────────────────────────────────────────────────
  Dsus4: {
    name: 'Dsus4', notes: 'D · G · A', startFret: 1,
    strings: [_x, _x, _o, _f(2,1), _f(3,3), _f(3,4)],
  },
  Asus4: {
    name: 'Asus4', notes: 'A · D · E', startFret: 1,
    strings: [_x, _o, _f(2,2), _f(2,3), _f(3,4), _o],
  },
  Gsus4: {
    name: 'Gsus4', notes: 'G · C · D', startFret: 1,
    strings: [_f(3,2), _f(3,3), _o, _o, _f(1,1), _f(3,4)],
  },
  Cadd9: {
    name: 'Cadd9', notes: 'C · E · G · D', startFret: 1,
    strings: [_x, _f(3,3), _f(2,2), _o, _f(3,4), _o],
  },
  Gadd9: {
    name: 'Gadd9', notes: 'G · B · D · A', startFret: 1,
    strings: [_f(3,2), _f(2,1), _o, _o, _f(3,3), _o],
  },
}

export function drawChord(
  key: string,
  large: boolean,
  chordsMap: Record<string, ChordData> = CHORDS,
): string {
  if (!chordsMap[key]) {
    const W = large ? 280 : 148, H = large ? 250 : 134
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#f5f5f5" rx="8" stroke="#ddd" stroke-width="1"/><text x="${W / 2}" y="${H / 2 + 14}" text-anchor="middle" font-size="${large ? 52 : 26}" font-family="Arial" font-weight="bold" fill="#ccc">${key}</text></svg>`
  }
  const STR_NAMES = ['E', 'A', 'D', 'G', 'B', 'e']
  const ch = chordsMap[key]
  const startFret = ch.startFret ?? 1
  const W  = large ? 280 : 148
  const H  = large ? 262 : 144
  const pL = large ? 36  : 22
  const pR = large ? 28  : 18
  const pT = large ? 58  : 38
  const pB = large ? 24  : 16
  const bW = W - pL - pR
  const bH = H - pT - pB
  const ss = bW / 5
  const fs = bH / 4
  const dr = large ? 15 : 8
  const tf = large ? 13 : 8
  const sn = large ? 12 : 7
  const mr = large ? 7  : 4
  const nh = large ? 7  : 4

  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif">`
  s += `<rect x="${pL}" y="${pT}" width="${bW}" height="${bH}" fill="#fff" stroke="#000" stroke-width="1.5" rx="2"/>`
  if (startFret === 1) {
    // thick nut at the top
    s += `<rect x="${pL}" y="${pT}" width="${bW}" height="${nh}" fill="#333" rx="1"/>`
  } else {
    // fret position label (e.g. "3fr")
    s += `<text x="${pL - (large ? 6 : 4)}" y="${pT + fs * 0.55}" text-anchor="end" font-size="${sn + (large ? 2 : 1)}" font-weight="bold" fill="#444">${startFret}fr</text>`
  }
  for (let i = 1; i <= 4; i++) {
    const y = pT + i * fs
    s += `<line x1="${pL}" y1="${y}" x2="${pL + bW}" y2="${y}" stroke="#bbb" stroke-width="1"/>`
  }
  for (let i = 0; i < 6; i++) {
    const x = pL + i * ss
    const sw = Math.max(1, 2.5 - i * 0.25)
    s += `<line x1="${x}" y1="${pT}" x2="${x}" y2="${pT + bH}" stroke="#555" stroke-width="${sw}"/>`
  }
  for (let i = 1; i <= 4; i++) {
    const y = pT + (i - 0.5) * fs + 4
    s += `<text x="${pL + bW + 6}" y="${y}" font-size="${sn}" fill="#aaa">${i + startFret - 1}</text>`
  }
  for (let i = 0; i < 6; i++) {
    const str = ch.strings[i]
    const x = pL + i * ss
    s += `<text x="${x}" y="${pT - 24}" text-anchor="middle" font-size="${sn}" font-weight="bold" fill="#333">${STR_NAMES[i]}</text>`
    if (str.muted) {
      s += `<line x1="${x - mr}" y1="${pT - 15}" x2="${x + mr}" y2="${pT - 15 + mr * 2}" stroke="#111" stroke-width="2"/>`
      s += `<line x1="${x + mr}" y1="${pT - 15}" x2="${x - mr}" y2="${pT - 15 + mr * 2}" stroke="#111" stroke-width="2"/>`
    } else if (str.open) {
      s += `<circle cx="${x}" cy="${pT - 11}" r="${mr}" fill="none" stroke="#333" stroke-width="1.8"/>`
    }
    if (!str.muted && !str.open && str.fret > 0) {
      const visualRow = str.fret - startFret + 1
      const fy = pT + (visualRow - 0.5) * fs
      s += `<circle cx="${x}" cy="${fy}" r="${dr}" fill="#111"/>`
      s += `<text x="${x}" y="${fy + tf * 0.38}" text-anchor="middle" font-size="${tf}" font-weight="bold" fill="#fff">${str.finger}</text>`
    }
  }
  s += '</svg>'
  return s
}
