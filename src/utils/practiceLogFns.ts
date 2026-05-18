import { createServerFn } from '@tanstack/react-start'
import fs from 'node:fs'
import path from 'node:path'
import type { PracticeSession } from './practiceLog'

function getDataPath() {
  const dataDir = process.env.KYTARA_DATA_DIR ?? path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  return path.join(dataDir, 'practice-log.json')
}

function readSessions(): PracticeSession[] {
  const filePath = getDataPath()
  if (!fs.existsSync(filePath)) return []
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as PracticeSession[]
  } catch {
    return []
  }
}

function writeSessions(sessions: PracticeSession[]): void {
  fs.writeFileSync(getDataPath(), JSON.stringify(sessions, null, 2), 'utf8')
}

// ── Server functions ───────────────────────────────────────────────────────

export const loadSessionsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PracticeSession[]> => readSessions(),
)

export const saveSessionFn = createServerFn({ method: 'POST' })
  .inputValidator((data: Omit<PracticeSession, 'id'>) => data)
  .handler(async ({ data }): Promise<PracticeSession> => {
    const sessions = readSessions()
    const session: PracticeSession = { id: Date.now().toString(), ...data }
    sessions.push(session)
    if (sessions.length > 500) sessions.splice(0, sessions.length - 500)
    writeSessions(sessions)
    return session
  })

export const clearSessionsFn = createServerFn({ method: 'POST' }).handler(async (): Promise<void> => {
  writeSessions([])
})