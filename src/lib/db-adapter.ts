/**
 * Database Adapter
 * 
 * Bridges existing in-memory services with SQLite persistence.
 * On startup: loads users from DB into AuthService memory.
 * On writes: syncs to both memory and DB.
 * 
 * This is a migration layer — once fully migrated, the in-memory
 * stores can be removed and services can query DB directly.
 */

import { dbRun, dbGet, dbAll, saveDB } from './db';
import { AuthService, AuthUser, PortalRole, RoleLevel, PORTAL_CONFIG } from './auth';

// ==================== USER PERSISTENCE ====================

export class UserDB {
  /** Save a user to the database */
  static save(user: AuthUser, password: string): void {
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
        user.authProvider, password,
        user.createdAt, user.lastLogin || null,
        user.mfaEnabled ? 1 : 0, user.mfaEnrolled ? 1 : 0,
        user.totpSecret || null, user.recoveryCodes ? JSON.stringify(user.recoveryCodes) : null,
        user.active ? 1 : 0,
      ]
    );
    saveDB();
  }

  /** Load all users from the database into AuthService memory */
  static loadAll(): AuthUser[] {
    const rows = dbAll('SELECT * FROM users WHERE active = 1');
    return rows.map(row => ({
      userId: row.userId,
      username: row.username,
      displayName: row.displayName,
      email: row.email || undefined,
      role: row.role as PortalRole,
      roleLevel: row.roleLevel as RoleLevel,
      portalUrl: row.portalUrl,
      permissions: JSON.parse(row.permissions || '[]'),
      publicKey: row.publicKey,
      avatar: row.avatar || undefined,
      googleId: row.googleId || undefined,
      googleEmail: row.googleEmail || undefined,
      authProvider: row.authProvider as 'google' | 'local' | 'both',
      createdAt: row.createdAt,
      lastLogin: row.lastLogin || 0,
      mfaEnabled: !!row.mfaEnabled,
      mfaEnrolled: !!row.mfaEnrolled,
      totpSecret: row.totpSecret || undefined,
      recoveryCodes: row.recoveryCodes ? JSON.parse(row.recoveryCodes) : undefined,
      active: !!row.active,
    }));
  }

  /** Get a user by ID */
  static getById(userId: string): any | null {
    return dbGet('SELECT * FROM users WHERE userId = ?', [userId]);
  }

  /** Get a user by username */
  static getByUsername(username: string): any | null {
    return dbGet('SELECT * FROM users WHERE username = ?', [username]);
  }

  /** Update last login timestamp */
  static updateLastLogin(userId: string): void {
    dbRun('UPDATE users SET lastLogin = ? WHERE userId = ?', [Date.now(), userId]);
    saveDB();
  }

  /** Update MFA settings */
  static updateMFA(userId: string, enabled: boolean, enrolled: boolean, totpSecret?: string, recoveryCodes?: string[]): void {
    dbRun(
      'UPDATE users SET mfaEnabled = ?, mfaEnrolled = ?, totpSecret = ?, recoveryCodes = ? WHERE userId = ?',
      [enabled ? 1 : 0, enrolled ? 1 : 0, totpSecret || null, recoveryCodes ? JSON.stringify(recoveryCodes) : null, userId]
    );
    saveDB();
  }

  /** Update user role */
  static updateRole(userId: string, role: PortalRole, roleLevel: RoleLevel): void {
    const perms = PORTAL_CONFIG[role]?.permissions || [];
    dbRun(
      'UPDATE users SET role = ?, roleLevel = ?, permissions = ? WHERE userId = ?',
      [role, roleLevel, JSON.stringify(perms), userId]
    );
    saveDB();
  }

  /** Deactivate a user */
  static deactivate(userId: string): void {
    dbRun('UPDATE users SET active = 0 WHERE userId = ?', [userId]);
    saveDB();
  }

  /** Get all users (admin) */
  static getAll(): any[] {
    return dbAll('SELECT * FROM users ORDER BY createdAt DESC');
  }

  /** Count users */
  static count(): number {
    const result = dbGet('SELECT COUNT(*) as count FROM users');
    return result?.count || 0;
  }
}

// ==================== LINKED ACCOUNT PERSISTENCE ====================

export class LinkedAccountDB {
  /** Save a linked account */
  static save(account: {
    id: string; userId: string; platform: string; accountId: string;
    accountName: string; accountEmail?: string; avatarUrl?: string;
    accessToken?: string; refreshToken?: string; tokenExpiresAt?: number;
    scope?: string[]; status: string; linkedAt: number;
    lastUsedAt?: number; lastError?: string; metadata?: Record<string, any>;
  }): void {
    dbRun(
      `INSERT OR REPLACE INTO linked_accounts 
       (id, userId, platform, accountId, accountName, accountEmail, avatarUrl,
        accessToken, refreshToken, tokenExpiresAt, scope, status, linkedAt,
        lastUsedAt, lastError, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id, account.userId, account.platform, account.accountId,
        account.accountName, account.accountEmail || null, account.avatarUrl || null,
        account.accessToken || null, account.refreshToken || null,
        account.tokenExpiresAt || null, account.scope ? JSON.stringify(account.scope) : null,
        account.status, account.linkedAt,
        account.lastUsedAt || null, account.lastError || null,
        JSON.stringify(account.metadata || {}),
      ]
    );
    saveDB();
  }

  /** Get all linked accounts for a user */
  static getByUser(userId: string): any[] {
    return dbAll('SELECT * FROM linked_accounts WHERE userId = ? ORDER BY linkedAt DESC', [userId]);
  }

  /** Get linked account by platform for a user */
  static getByPlatform(userId: string, platform: string): any | null {
    return dbGet(
      'SELECT * FROM linked_accounts WHERE userId = ? AND platform = ? AND status = ?',
      [userId, platform, 'LINKED']
    );
  }

  /** Get account by ID */
  static getById(id: string): any | null {
    return dbGet('SELECT * FROM linked_accounts WHERE id = ?', [id]);
  }

  /** Update account status */
  static updateStatus(id: string, status: string, lastError?: string): void {
    dbRun(
      'UPDATE linked_accounts SET status = ?, lastError = ?, lastUsedAt = ? WHERE id = ?',
      [status, lastError || null, Date.now(), id]
    );
    saveDB();
  }

  /** Unlink an account */
  static unlink(id: string): void {
    dbRun('UPDATE linked_accounts SET status = ? WHERE id = ?', ['EXPIRED', id]);
    saveDB();
  }
}

// ==================== APPROVAL CHAIN PERSISTENCE ====================

export class ApprovalChainDB {
  /** Save an approval chain request with its steps */
  static save(request: {
    id: string; transformationId: string; title: string; contentPreview: string;
    outputTypes: string[]; riskLevel: string; submittedBy: string;
    submittedByName: string; submittedByLevel: string; submittedAt: number;
    status: string; currentStep: number; deadline: number;
    publishedAt?: number; publishResults?: any[]; metadata?: Record<string, any>;
    chain: Array<{
      stepNumber: number; requiredLevel: string; requiredRoleName: string;
      approverId?: string; approverName?: string; decision?: string;
      decisionAt?: number; comments?: string; signatureHash?: string; status: string;
    }>;
  }): void {
    dbRun(
      `INSERT OR REPLACE INTO approval_chain_requests 
       (id, transformationId, title, contentPreview, outputTypes, riskLevel,
        submittedBy, submittedByName, submittedByLevel, submittedAt,
        status, currentStep, deadline, publishedAt, publishResults, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.id, request.transformationId, request.title, request.contentPreview,
        JSON.stringify(request.outputTypes), request.riskLevel,
        request.submittedBy, request.submittedByName, request.submittedByLevel,
        request.submittedAt, request.status, request.currentStep, request.deadline,
        request.publishedAt || null,
        request.publishResults ? JSON.stringify(request.publishResults) : null,
        JSON.stringify(request.metadata || {}),
      ]
    );

    // Save chain steps
    for (const step of request.chain) {
      dbRun(
        `INSERT OR REPLACE INTO approval_steps 
         (id, requestId, stepNumber, requiredLevel, requiredRoleName,
          approverId, approverName, decision, decisionAt, comments, signatureHash, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `${request.id}-step-${step.stepNumber}`, request.id,
          step.stepNumber, step.requiredLevel, step.requiredRoleName,
          step.approverId || null, step.approverName || null,
          step.decision || null, step.decisionAt || null,
          step.comments || null, step.signatureHash || null, step.status,
        ]
      );
    }
    saveDB();
  }

  /** Get a request with its steps */
  static getById(requestId: string): any | null {
    const request = dbGet('SELECT * FROM approval_chain_requests WHERE id = ?', [requestId]);
    if (!request) return null;

    const steps = dbAll(
      'SELECT * FROM approval_steps WHERE requestId = ? ORDER BY stepNumber',
      [requestId]
    );

    return {
      ...request,
      outputTypes: JSON.parse(request.outputTypes || '[]'),
      publishResults: request.publishResults ? JSON.parse(request.publishResults) : null,
      metadata: JSON.parse(request.metadata || '{}'),
      chain: steps.map(s => ({
        ...s,
        approverId: s.approverId || undefined,
        approverName: s.approverName || undefined,
        decision: s.decision || undefined,
        decisionAt: s.decisionAt || undefined,
        comments: s.comments || undefined,
        signatureHash: s.signatureHash || undefined,
      })),
    };
  }

  /** Get pending requests for a user based on role level */
  static getPendingForUser(userId: string, userLevel: string): any[] {
    const { ROLE_LEVEL_HIERARCHY } = require('./auth');
    const userNum = ROLE_LEVEL_HIERARCHY[userLevel] || 0;

    const requests = dbAll(
      `SELECT * FROM approval_chain_requests 
       WHERE status IN ('FINALISED', 'IN_REVIEW') 
       ORDER BY submittedAt DESC`
    );

    return requests
      .map(r => {
        const steps = dbAll(
          'SELECT * FROM approval_steps WHERE requestId = ? AND status = ?',
          [r.id, 'ACTIVE']
        );
        if (steps.length === 0) return null;
        const activeStep = steps[0];
        const requiredNum = ROLE_LEVEL_HIERARCHY[activeStep.requiredLevel] || 0;
        if (userNum < requiredNum) return null;
        if (r.submittedBy === userId) return null; // Separation of duties
        return ApprovalChainDB.getById(r.id);
      })
      .filter(Boolean);
  }

  /** Get all requests */
  static getAll(): any[] {
    const requests = dbAll('SELECT * FROM approval_chain_requests ORDER BY submittedAt DESC');
    return requests.map(r => ApprovalChainDB.getById(r.id)).filter(Boolean);
  }

  /** Get requests by status */
  static getByStatus(status: string): any[] {
    const requests = dbAll(
      'SELECT * FROM approval_chain_requests WHERE status = ? ORDER BY submittedAt DESC',
      [status]
    );
    return requests.map(r => ApprovalChainDB.getById(r.id)).filter(Boolean);
  }

  /** Update request status */
  static updateStatus(requestId: string, status: string, currentStep?: number): void {
    if (currentStep !== undefined) {
      dbRun(
        'UPDATE approval_chain_requests SET status = ?, currentStep = ? WHERE id = ?',
        [status, currentStep, requestId]
      );
    } else {
      dbRun('UPDATE approval_chain_requests SET status = ? WHERE id = ?', [status, requestId]);
    }
    saveDB();
  }

  /** Update a step's decision */
  static updateStep(requestId: string, stepNumber: number, updates: {
    approverId?: string; approverName?: string; decision?: string;
    decisionAt?: number; comments?: string; signatureHash?: string; status: string;
  }): void {
    dbRun(
      `UPDATE approval_steps SET 
       approverId = COALESCE(?, approverId),
       approverName = COALESCE(?, approverName),
       decision = COALESCE(?, decision),
       decisionAt = COALESCE(?, decisionAt),
       comments = COALESCE(?, comments),
       signatureHash = COALESCE(?, signatureHash),
       status = ?
       WHERE requestId = ? AND stepNumber = ?`,
      [
        updates.approverId || null, updates.approverName || null,
        updates.decision || null, updates.decisionAt || null,
        updates.comments || null, updates.signatureHash || null,
        updates.status, requestId, stepNumber,
      ]
    );
    saveDB();
  }

  /** Mark as published */
  static markPublished(requestId: string, results: any[]): void {
    dbRun(
      'UPDATE approval_chain_requests SET status = ?, publishedAt = ?, publishResults = ? WHERE id = ?',
      ['PUBLISHED', Date.now(), JSON.stringify(results), requestId]
    );
    saveDB();
  }

  /** Get stats */
  static getStats(): Record<string, number> {
    const rows = dbAll(
      'SELECT status, COUNT(*) as count FROM approval_chain_requests GROUP BY status'
    );
    const stats: Record<string, number> = { total: 0 };
    for (const row of rows) {
      stats[row.status] = row.count;
      stats.total += row.count;
    }
    return stats;
  }
}
