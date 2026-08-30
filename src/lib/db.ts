/**
 * SQLite Database Layer using sql.js (pure-JS, no native compilation)
 * 
 * Provides persistent storage for users, approval chains, and linked accounts.
 * Uses sql.js which compiles SQLite to WebAssembly — works everywhere.
 * 
 * On Vercel: Data persists within a single function instance. For true persistence
 * across serverless invocations, swap to Turso, Neon, or PlanetScale.
 */

import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'genai.db');

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

// ==================== INITIALIZATION ====================

async function getDB(): Promise<Database> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs();

    // Try to load existing database file
    let data: Buffer | undefined;
    if (existsSync(DB_PATH)) {
      try {
        data = readFileSync(DB_PATH) as Buffer;
      } catch {
        // Fresh database
      }
    }

    const database = data ? new SQL.Database(data) : new SQL.Database();

    // Create tables
    database.run(`
      CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        displayName TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL,
        roleLevel TEXT NOT NULL,
        portalUrl TEXT NOT NULL,
        permissions TEXT NOT NULL DEFAULT '[]',
        publicKey TEXT NOT NULL,
        avatar TEXT,
        googleId TEXT,
        googleEmail TEXT,
        authProvider TEXT NOT NULL DEFAULT 'local',
        password TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        lastLogin INTEGER,
        mfaEnabled INTEGER NOT NULL DEFAULT 0,
        mfaEnrolled INTEGER NOT NULL DEFAULT 0,
        totpSecret TEXT,
        recoveryCodes TEXT,
        active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS linked_accounts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        platform TEXT NOT NULL,
        accountId TEXT NOT NULL,
        accountName TEXT NOT NULL,
        accountEmail TEXT,
        avatarUrl TEXT,
        accessToken TEXT,
        refreshToken TEXT,
        tokenExpiresAt INTEGER,
        scope TEXT,
        status TEXT NOT NULL DEFAULT 'LINKED',
        linkedAt INTEGER NOT NULL,
        lastUsedAt INTEGER,
        lastError TEXT,
        metadata TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (userId) REFERENCES users(userId)
      );

      CREATE TABLE IF NOT EXISTS approval_chain_requests (
        id TEXT PRIMARY KEY,
        transformationId TEXT NOT NULL,
        title TEXT NOT NULL,
        contentPreview TEXT NOT NULL DEFAULT '',
        outputTypes TEXT NOT NULL DEFAULT '[]',
        riskLevel TEXT NOT NULL DEFAULT 'LOW',
        submittedBy TEXT NOT NULL,
        submittedByName TEXT NOT NULL,
        submittedByLevel TEXT NOT NULL,
        submittedAt INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'FINALISED',
        currentStep INTEGER NOT NULL DEFAULT 0,
        deadline INTEGER NOT NULL,
        publishedAt INTEGER,
        publishResults TEXT,
        metadata TEXT NOT NULL DEFAULT '{}',
        FOREIGN KEY (submittedBy) REFERENCES users(userId)
      );

      CREATE TABLE IF NOT EXISTS approval_steps (
        id TEXT PRIMARY KEY,
        requestId TEXT NOT NULL,
        stepNumber INTEGER NOT NULL,
        requiredLevel TEXT NOT NULL,
        requiredRoleName TEXT NOT NULL,
        approverId TEXT,
        approverName TEXT,
        decision TEXT,
        decisionAt INTEGER,
        comments TEXT,
        signatureHash TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        FOREIGN KEY (requestId) REFERENCES approval_chain_requests(id),
        FOREIGN KEY (approverId) REFERENCES users(userId)
      );

      CREATE TABLE IF NOT EXISTS hash_blocks (
        id TEXT PRIMARY KEY,
        blockId TEXT UNIQUE NOT NULL,
        blockNumber INTEGER NOT NULL,
        eventType TEXT NOT NULL,
        actorId TEXT NOT NULL,
        actorName TEXT NOT NULL DEFAULT '',
        actorRole TEXT NOT NULL DEFAULT '',
        contentHash TEXT NOT NULL,
        prevHash TEXT NOT NULL,
        merkleRoot TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        signature TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}'
      );
    `);

    db = database;
    return database;
  })();

  return initPromise;
}

// ==================== HELPERS ====================

export function dbRun(sql: string, params: any[] = []): void {
  const d = db;
  if (!d) throw new Error('Database not initialized');
  d.run(sql, params);
}

export function dbGet(sql: string, params: any[] = []): any | null {
  const d = db;
  if (!d) throw new Error('Database not initialized');
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}

export function dbAll(sql: string, params: any[] = []): any[] {
  const d = db;
  if (!d) throw new Error('Database not initialized');
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/** Save database to disk (call after writes in non-serverless environments) */
export function saveDB(): void {
  if (!db) return;
  try {
    const { mkdirSync } = require('fs');
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const data = db.export();
    writeFileSync(DB_PATH, Buffer.from(data));
  } catch {
    // Silently fail on serverless (no filesystem access)
  }
}

// ==================== INIT ON IMPORT ====================

export async function initializeDB(): Promise<void> {
  await getDB();
}

// Auto-initialize
initializeDB().catch(() => {});
