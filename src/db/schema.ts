/**
 * Drizzle ORM schema – mojeKytara
 *
 * Databáze: PostgreSQL
 * Zatím NEAKTIVNÍ – neimportováno v aplikaci.
 *
 * Než zprovoznit:
 *   npm install drizzle-orm postgres
 *   npm install -D drizzle-kit
 *   Nastavit DB_URL v prostředí (viz src/db/client.ts)
 *   Spustit: npx drizzle-kit push  (nebo migrate)
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Uživatelé ────────────────────────────────────────────────
export const users = pgTable('users', {
  id:           serial('id').primaryKey(),
  email:        varchar('email',         { length: 255 }).notNull().unique(),
  username:     varchar('username',      { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt:    timestamp('created_at',  { withTimezone: true }).defaultNow().notNull(),
})

// ── Písničky ─────────────────────────────────────────────────
export const songs = pgTable('songs', {
  id:            serial('id').primaryKey(),
  userId:        integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:          varchar('name',           { length: 255 }).notNull(),
  textContent:   text('text_content').notNull(),
  strumPattern:  varchar('strum_pattern',  { length: 50 }),   // id z STRUM_PATTERNS
  customPattern: varchar('custom_pattern', { length: 100 }),  // vlastní beats, pokud strum='custom'
  secsPerChord:  integer('secs_per_chord').notNull().default(4),
  createdAt:     timestamp('created_at',   { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at',   { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_songs_user_id').on(table.userId),
])

// ── Relace (pro Drizzle query builder) ───────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  songs: many(songs),
}))

export const songsRelations = relations(songs, ({ one }) => ({
  user: one(users, { fields: [songs.userId], references: [users.id] }),
}))

// ── Typy ─────────────────────────────────────────────────────
export type User     = typeof users.$inferSelect
export type NewUser  = typeof users.$inferInsert
export type Song     = typeof songs.$inferSelect
export type NewSong  = typeof songs.$inferInsert
