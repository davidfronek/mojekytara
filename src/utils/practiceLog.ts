export type PracticeSession = {
  id: string
  date: string      // ISO string
  duration: number  // seconds
  chords: string[]  // unique chords in that session
  loops: number     // loops completed
  song?: string     // piece / song name
  note?: string     // free-text note
  student?: string  // who practiced
  partner?: string  // teacher / practice partner
  rating?: number   // 1–5
}

const LS_KEY = 'kytara_practice_log'

export function savePracticeSession(session: Omit<PracticeSession, 'id'>): void {
  const sessions = loadPracticeSessions()
  sessions.push({ id: Date.now().toString(), ...session })
  // Keep at most 500 sessions
  if (sessions.length > 500) sessions.splice(0, sessions.length - 500)
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(sessions))
  } catch {
    // localStorage full — silently ignore
  }
}

export function loadPracticeSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PracticeSession[]
  } catch {
    return []
  }
}

export function clearPracticeSessions(): void {
  localStorage.removeItem(LS_KEY)
}

export function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`
  return `${s}s`
}

export function totalPracticeTime(sessions: PracticeSession[]): number {
  return sessions.reduce((acc, s) => acc + s.duration, 0)
}

/** Returns number of consecutive days (ending today or yesterday) with at least one session. */
export function practiceStreak(sessions: PracticeSession[]): number {
  if (!sessions.length) return 0
  const days = [...new Set(sessions.filter((s) => s.date).map((s) => s.date.slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = isoOffset(today, -1)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  let prev = days[0]
  for (let i = 1; i < days.length; i++) {
    if (days[i] === isoOffset(prev, -1)) {
      streak++
      prev = days[i]
    } else {
      break
    }
  }
  return streak
}

function isoOffset(dateStr: string, delta: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}

/** Formats an ISO date string to a human-readable Czech date. */
export function formatDate(isoStr: string): string {
  const d = new Date(isoStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isToday =
    d.toDateString() === today.toDateString()
  const isYesterday =
    d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Dnes, ${time}`
  if (isYesterday) return `Včera, ${time}`
  return d.toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  }) + `, ${time}`
}
