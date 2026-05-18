/**
 * Databázové připojení – mojeKytara
 *
 * Zatím NEAKTIVNÍ – neimportováno v aplikaci.
 *
 * Před aktivací:
 *   1. npm install drizzle-orm postgres
 *   2. Nastavit proměnnou prostředí DB_URL:
 *        postgresql://user:password@localhost:5432/kytara
 *      Na VPS: přidat do /etc/environment nebo do PM2 ecosystem.config.js
 *   3. Spustit migraci:
 *        psql -d kytara -f src/db/migrations/001_initial.sql
 *      nebo: npx drizzle-kit push
 *   4. Odkomentovat export db níže a začít importovat v API routách
 */

// import postgres from 'postgres'
// import { drizzle } from 'drizzle-orm/postgres-js'
// import * as schema from './schema'

// const connectionString = process.env['DB_URL']
// if (!connectionString) throw new Error('DB_URL není nastavena')

// const client = postgres(connectionString, { max: 10 })
// export const db = drizzle(client, { schema })

// ── Placeholder – smaž až bude DB aktivní ──
export const db = null as never
