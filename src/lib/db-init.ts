/**
 * Database Initialization & Sync Layer
 * 
 * Seeds the SQLite database with default users on first run.
 * Syncs AuthService mutations to the database as side-effects.
 * 
 * This approach avoids modifying the existing AuthService code —
 * it just observes changes and persists them.
 */

import { initializeDB, dbGet, dbAll, dbRun, saveDB } from './db';
import { AuthService, AuthUser, RoleLevel } from './auth';

let seeded = false;

/** Initialize DB and seed default users if empty */
export async function initDatabase(): Promise<void> {
  try {
    await initializeDB();
  } catch (e) {
    console.error('[DB] Init failed, running in-memory only:', e);
    seeded = true;
    return;
  }
  
  if (seeded) return;
  seeded = true;

  const userCount = dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count > 0) {
    // DB already has users — load them back into AuthService memory
    syncDBToAuth();
    return;
  }

  // First run — seed from AuthService defaults
  const users = AuthService.getAllUsers();
  for (const user of users) {
    dbRun(
      `INSERT OR IGNORE INTO users 
       (userId, username, displayName, email, role, roleLevel, portalUrl, permissions,
        publicKey, avatar, googleId, googleEmail, authProvider, password,
        createdAt, lastLogin, mfaEnabled, mfaEnrolled, totpSecret, recoveryCodes, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userId, user.username, user.displayName, user.email || null,
        user.role, user.roleLevel, user.portalUrl, JSON.stringify(user.permissions),
        user.publicKey, user.avatar || null, user.googleId || null, user.googleEmail || null,
        user.authProvider, 'ntro123',  // Default password
        user.createdAt, user.lastLogin || null,
        user.mfaEnabled ? 1 : 0, user.mfaEnrolled ? 1 : 0,
        user.totpSecret || null, user.recoveryCodes ? JSON.stringify(user.recoveryCodes) : null,
        user.active ? 1 : 0,
      ]
    );
  }
  saveDB();
  console.log(`[DB] Seeded ${users.length} users into SQLite`);
}

/** Load users from DB back into AuthService memory */
function syncDBToAuth(): void {
  const rows = dbAll('SELECT * FROM users');
  for (const row of rows) {
    // Create user in AuthService memory if not already there
    const existing = AuthService.getUser(row.userId);
    if (!existing) {
      AuthService.createUser(row.username, row.displayName, row.role as any, row.roleLevel as RoleLevel);
    }
  }
}

/** Persist an auth user change to DB */
export function persistAuthUser(user: AuthUser, password?: string): void {
  try {
    dbRun(
      `INSERT OR REPLACE INTO users 
       (userId, username, displayName, email, role, roleLevel, portalUrl, permissions,
        publicKey, avatar, googleId, googleEmail, authProvider, password,
        createdAt, lastLogin, mfaEnabled, mfaEnrolled, totpSecret, recoveryCodes, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userId, user.username, user.displayName, user.email || null,
        user.role, user.roleLevel, user.portalUrl, JSON.stringify(user.permissions),
        user.publicKey, user.avatar || null, user.googleId || null, user.googleEmail || null,
        user.authProvider, password || 'ntro123',
        user.createdAt, user.lastLogin || null,
        user.mfaEnabled ? 1 : 0, user.mfaEnrolled ? 1 : 0,
        user.totpSecret || null, user.recoveryCodes ? JSON.stringify(user.recoveryCodes) : null,
        user.active ? 1 : 0,
      ]
    );
    saveDB();
  } catch (e) {
    console.error('[DB] Failed to persist user:', e);
  }
}

/** Get user password from DB */
export function getStoredPassword(username: string): string | null {
  const row = dbGet('SELECT password FROM users WHERE username = ?', [username]);
  return row?.password || null;
}

/** Get all users from DB */
export function getAllDBUsers(): any[] {
  return dbAll('SELECT * FROM users ORDER BY createdAt DESC');
}

/** Get DB stats */
export function getDBStats(): Record<string, number> {
  const userCount = dbGet('SELECT COUNT(*) as count FROM users');
  const linkedCount = dbGet('SELECT COUNT(*) as count FROM linked_accounts');
  const approvalCount = dbGet('SELECT COUNT(*) as count FROM approval_chain_requests');
  return {
    users: userCount?.count || 0,
    linkedAccounts: linkedCount?.count || 0,
    approvalRequests: approvalCount?.count || 0,
  };
}
