import { normalizeChord } from '~/utils/chords'

// ===== Types =====
export type SongSegment = { chord: string | null; text: string; ci: number | null }
export type ParsedSong = SongSegment[][]

// ===== Helpers =====
export function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function parseChordText(text: string): ParsedSong {
  const lines = text.split('\n')
  let gci = 0
  return lines.map((line) => {
    const segs: SongSegment[] = []
    const re = /\[([A-Za-z#b0-9]+)\]/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(line)) !== null) {
      const before = line.slice(last, m.index)
      if (segs.length > 0 && segs[segs.length - 1].chord !== null) {
        segs[segs.length - 1].text += before
      } else if (before) {
        segs.push({ chord: null, text: before, ci: null })
      }
      segs.push({ chord: normalizeChord(m[1]), text: '', ci: gci++ })
      last = re.lastIndex
    }
    const rem = line.slice(last)
    if (rem) {
      if (segs.length > 0) segs[segs.length - 1].text += rem
      else segs.push({ chord: null, text: rem, ci: null })
    }
    return segs
  })
}

export function renderChordChart(parsed: ParsedSong, activeCi: number, nextCi: number): string {
  return parsed
    .map((line) => {
      if (!line.length || (line.length === 1 && !line[0].chord && !line[0].text.trim()))
        return '<div class="song-line empty-line"></div>'
      const segsHtml = line
        .map((seg) => {
          let cls = 'seg'
          if (seg.chord) {
            cls += ' has-chord'
            if (seg.ci === activeCi) cls += ' active'
            else if (seg.ci === nextCi) cls += ' nxt'
          }
          const cn = seg.chord
            ? `<span class="seg-cn">${escHtml(seg.chord)}</span>`
            : '<span class="seg-cn"></span>'
          const tx = seg.text ? `<span class="seg-tx">${escHtml(seg.text)}</span>` : ''
          return `<span class="${cls}">${cn}${tx}</span>`
        })
        .join('')
      return `<div class="song-line">${segsHtml}</div>`
    })
    .join('')
}

export function convertTabFormat(text: string): string {
  const chordToken =
    /^[A-G](#|b)?(m(aj|in|i)?|M(aj)?|dim|aug|sus[24]?|add[0-9]?|dom)?[2-9]?(\/[A-G](#|b)?)?$/
  const isChordLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return false
    return trimmed.split(/\s+/).every((t) => chordToken.test(t))
  }
  const mergeChordsIntoLyric = (chordLine: string, lyricLine: string) => {
    const re =
      /[A-G](#|b)?(m|M|maj|min|dim|aug|sus|sus2|sus4|add|dom)?[2-9]?(\/[A-G](#|b)?)?/g
    const chords: { pos: number; name: string }[] = []
    let m: RegExpExecArray | null
    while ((m = re.exec(chordLine)) !== null) chords.push({ pos: m.index, name: m[0] })
    if (!chords.length) return lyricLine
    let lyric = lyricLine
    while (lyric.length < chords[chords.length - 1].pos) lyric += ' '
    for (let k = chords.length - 1; k >= 0; k--) {
      const pos = Math.min(chords[k].pos, lyric.length)
      lyric =
        lyric.slice(0, pos) + '[' + normalizeChord(chords[k].name) + ']' + lyric.slice(pos)
    }
    return lyric.trimEnd()
  }
  const lines = text.split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    if (isChordLine(lines[i])) {
      const lyricLine = i + 1 < lines.length ? lines[i + 1] : ''
      out.push(mergeChordsIntoLyric(lines[i], lyricLine))
      i += 2
    } else {
      out.push(lines[i])
      i++
    }
  }
  return out.join('\n')
}
