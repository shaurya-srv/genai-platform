/**
 * Authentication System
 * 
 * Four distinct login portals with JWT scope encoding:
 * - Operator: Submit content, select outputs, trigger generation, edit drafts
 * - Approver/Reviewer: View pending, edit, digitally sign/approve or reject
 * - Admin: Manage users, roles, audit trail, configure templates
 * - Auditor: Read-only access to hash-chain ledger and logs
 * 
 * Key: Operator's own submission CANNOT be self-approved.
 */

import { createHash, createHmac, randomBytes } from 'crypto';
import { generateTOTPSecret, verifyTOTP, generateRecoveryCodes } from './totp';

// ==================== TYPES ====================

export type PortalRole = 'OPERATOR' | 'APPROVER' | 'ADMIN' | 'AUDITOR';

/** Role levels — determines access hierarchy */
export type RoleLevel = 'chairman' | 'distinguished_scientist' | 'outstanding_scientist' | 'scientist_g' | 'scientist_f' | 'scientist_e' | 'scientist_d' | 'scientist_c' | 'general_scientist';

export const ROLE_LEVEL_HIERARCHY: Record<RoleLevel, number> = {
  chairman: 9, distinguished_scientist: 8, outstanding_scientist: 7,
  scientist_g: 6, scientist_f: 5, scientist_e: 4,
  scientist_d: 3, scientist_c: 2, general_scientist: 1,
};

export const ROLE_LEVEL_LABELS: Record<RoleLevel, { label: string; icon: string; color: string; tier: string }> = {
  chairman: { label: 'Chairman', icon: '🏛️', color: '#dc2626', tier: 'Level 1 - Executive' },
  distinguished_scientist: { label: 'Distinguished Scientist', icon: '🏆', color: '#ec4899', tier: 'Level 1 - Executive' },
  outstanding_scientist: { label: 'Outstanding Scientist', icon: '⭐', color: '#f43f5e', tier: 'Level 1 - Executive' },
  scientist_g: { label: 'Scientist G', icon: '👔', color: '#f59e0b', tier: 'Level 2 - Senior Management' },
  scientist_f: { label: 'Scientist F', icon: '📋', color: '#d97706', tier: 'Level 2 - Senior Management' },
  scientist_e: { label: 'Scientist E', icon: '📊', color: '#b45309', tier: 'Level 2 - Senior Management' },
  scientist_d: { label: 'Scientist D', icon: '📑', color: '#3b82f6', tier: 'Level 3 - Middle Management' },
  scientist_c: { label: 'Scientist C', icon: '📁', color: '#2563eb', tier: 'Level 3 - Middle Management' },
  general_scientist: { label: 'General Scientist', icon: '🔬', color: '#10b981', tier: 'Level 4 - General Staff' },
};

export interface AuthUser {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
  role: PortalRole;
  roleLevel: RoleLevel;
  portalUrl: string;
  permissions: AuthPermission[];
  publicKey: string;
  avatar?: string;
  googleId?: string;       // Google OAuth subject ID
  googleEmail?: string;    // Google account email
  authProvider: 'google' | 'local' | 'both';
  createdAt: number;
  lastLogin: number;
  mfaEnabled: boolean;
  mfaEnrolled: boolean;
  totpSecret?: string;
  recoveryCodes?: string[];
  active: boolean;
}

export interface AuthSession {
  token: string;
  userId: string;
  role: PortalRole;
  issuedAt: number;
  expiresAt: number;
}

export type AuthPermission =
  | 'content:submit'
  | 'content:edit'
  | 'content:read'
  | 'content:delete'
  | 'approval:sign'
  | 'approval:reject'
  | 'approval:view'
  | 'publish:create'
  | 'publish:view'
  | 'admin:users'
  | 'admin:roles'
  | 'admin:audit'
  | 'admin:config'
  | 'blockchain:view'
  | 'blockchain:verify'
  | 'audit:read'
  | 'audit:export'
  | 'security:scan'
  | 'security:view'
  | 'security:override'
  | 'plugins:manage';

export interface LoginAttempt {
  userId: string;
  timestamp: number;
  success: boolean;
  portal: PortalRole;
  ip: string;
}

export interface MFAChallenge {
  challengeId: string;
  userId: string;
  code: string;
  expiresAt: number;
  verified: boolean;
}

export interface MFAEnrollment {
  enrollmentId: string;
  userId: string;
  secret: string;
  otpauthUri: string;
  recoveryCodes: string[];
  expiresAt: number;
  verified: boolean;
}

// ==================== PORTAL CONFIG ====================

export const PORTAL_CONFIG: Record<PortalRole, {
  name: string;
  description: string;
  icon: string;
  color: string;
  loginRoute: string;
  dashboardLabel: string;
  permissions: AuthPermission[];
}> = {
  OPERATOR: {
    name: 'Operator',
    description: 'Submit source content, select output types, trigger generation, edit drafts. CANNOT approve or publish.',
    icon: '📝',
    color: '#3b82f6',
    loginRoute: '/login/operator',
    dashboardLabel: 'Operator Dashboard',
    permissions: [
      'content:submit', 'content:edit', 'content:read',
      'approval:view', 'publish:view', 'security:scan', 'security:view',
      'blockchain:view',
    ],
  },
  APPROVER: {
    name: 'Reviewer / Approver',
    description: 'View pending generations, edit if needed, digitally sign/approve or reject with comments. CANNOT submit new content.',
    icon: '✍️',
    color: '#10b981',
    loginRoute: '/login/approver',
    dashboardLabel: 'Approver Dashboard',
    permissions: [
      'content:read', 'content:edit',
      'approval:sign', 'approval:reject', 'approval:view',
      'publish:create', 'publish:view',
      'security:view', 'blockchain:view',
    ],
  },
  ADMIN: {
    name: 'Administrator',
    description: 'Manage users, assign roles, view full audit trail/ledger, configure output-type templates, revoke access. CANNOT sign approvals.',
    icon: '🖥️',
    color: '#f97316',
    loginRoute: '/login/admin',
    dashboardLabel: 'Admin Dashboard',
    permissions: [
      'content:read',
      'approval:view', 'publish:view',
      'admin:users', 'admin:roles', 'admin:audit', 'admin:config',
      'security:scan', 'security:view', 'security:override',
      'blockchain:view', 'blockchain:verify',
      'audit:read', 'audit:export',
      'plugins:manage',
    ],
  },
  AUDITOR: {
    name: 'Auditor',
    description: 'Read-only access to the full hash-chain ledger and logs. Cannot submit, edit, approve, or modify anything.',
    icon: '🔍',
    color: '#8b5cf6',
    loginRoute: '/login/auditor',
    dashboardLabel: 'Auditor Dashboard',
    permissions: [
      'content:read', 'approval:view', 'publish:view',
      'blockchain:view', 'blockchain:verify',
      'audit:read', 'audit:export',
      'security:view',
    ],
  },
};

// ==================== IN-MEMORY STORE ====================

const users: Map<string, AuthUser> = new Map();
const sessions: Map<string, AuthSession> = new Map();
const loginHistory: LoginAttempt[] = [];
const mfaChallenges: Map<string, MFAChallenge> = new Map();
const mfaEnrollments: Map<string, MFAEnrollment> = new Map();
const userKeypairs: Map<string, { publicKey: string; privateKey: string }> = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'genai-platform-secret-key-' + randomBytes(32).toString('hex');

let initialized = false;

// ==================== SIMPLE JWT ====================

function base64url(data: Buffer | string): string {
  const str = typeof data === 'string' ? data : data.toString('base64');
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signJWT(payload: Record<string, unknown>, secret: string, expiresInMs: number): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Date.now();
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInMs }));
  const signature = base64url(
    createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = base64url(
      createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest()
    );
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ==================== RSA KEYPAIR GENERATION ====================

// Simple RSA-like keypair for signing (simulated for hackathon — production would use crypto.generateKeyPairSync)
function generateKeypair(): { publicKey: string; privateKey: string } {
  const seed = randomBytes(64).toString('hex');
  const publicKey = 'pk_' + createHash('sha256').update(seed).digest('hex').substring(0, 64);
  const privateKey = 'sk_' + createHash('sha512').update(seed).digest('hex').substring(0, 128);
  return { publicKey, privateKey };
}

export function signWithKey(userId: string, data: string): string | null {
  const keypair = userKeypairs.get(userId);
  if (!keypair) return null;
  return createHmac('sha256', keypair.privateKey).update(data).digest('hex');
}

export function verifySignature(userId: string, data: string, signature: string): boolean {
  const keypair = userKeypairs.get(userId);
  if (!keypair) return false;
  const expected = createHmac('sha256', keypair.privateKey).update(data).digest('hex');
  return expected === signature;
}

// ==================== AUTH SERVICE ====================



// ==================== SECTION VISIBILITY ====================

export type SectionId = 'transform' | 'approval' | 'analysis' | 'threat' | 'compliance' | 'dlp' | 'incident' | 'linkage';

export interface SectionConfig {
  id: SectionId;
  name: string;
  icon: string;
  color: string;
  minLevel: RoleLevel;
  description: string;
}

export const SECTIONS: SectionConfig[] = [
  { id: 'transform', name: 'Transformation AI', icon: '🤖', color: '#3b82f6', minLevel: 'general_scientist', description: 'Multi-source input to multi-format output' },
  { id: 'approval', name: 'Multi-Sign Approval', icon: '✍️', color: '#10b981', minLevel: 'general_scientist', description: 'Approval chain for content publication' },
  { id: 'analysis', name: 'Analysis & Review', icon: '📊', color: '#06b6d4', minLevel: 'scientist_d', description: 'Consistency scoring and quality metrics' },
  { id: 'threat', name: 'Threat Analysis', icon: '🔍', color: '#ef4444', minLevel: 'scientist_d', description: 'STIX/TAXII threat intelligence' },
  { id: 'compliance', name: 'Compliance Check', icon: '📋', color: '#f59e0b', minLevel: 'scientist_f', description: 'DPDP, GDPR, IT Act compliance' },
  { id: 'dlp', name: 'DLP Scanner', icon: '🛡️', color: '#8b5cf6', minLevel: 'scientist_d', description: 'Data Loss Prevention scanning' },
  { id: 'incident', name: 'Incident Response', icon: '🚨', color: '#ec4899', minLevel: 'scientist_f', description: 'Cascading incident response chain' },
  { id: 'linkage', name: 'External Linkage', icon: '🔗', color: '#0ea5e9', minLevel: 'general_scientist', description: 'Email, LinkedIn, X integration' },
];

export function getVisibleSections(level: RoleLevel): SectionConfig[] {
  const userLevel = ROLE_LEVEL_HIERARCHY[level];
  return SECTIONS.filter(s => ROLE_LEVEL_HIERARCHY[s.minLevel] <= userLevel);
}

export class AuthService {
  /**
   * Initialize with default users for each portal
   */
  static initialize(): void {
    if (initialized) return;
    initialized = true;

    const defaultUsers: Array<{ id: string; username: string; displayName: string; role: PortalRole; roleLevel: RoleLevel }> = [
      { id: 'ch-001', username: 'chairman', displayName: 'Chairman NTRO', role: 'ADMIN', roleLevel: 'chairman' },
      { id: 'ds-001', username: 'dscientist', displayName: 'Distinguished Scientist', role: 'ADMIN', roleLevel: 'distinguished_scientist' },
      { id: 'os-001', username: 'oscientist', displayName: 'Outstanding Scientist', role: 'APPROVER', roleLevel: 'outstanding_scientist' },
      { id: 'sg-001', username: 'scientist_g', displayName: 'Scientist G - Senior Director', role: 'APPROVER', roleLevel: 'scientist_g' },
      { id: 'sf-001', username: 'scientist_f', displayName: 'Scientist F - Joint Scientist', role: 'APPROVER', roleLevel: 'scientist_f' },
      { id: 'se-001', username: 'scientist_e', displayName: 'Scientist E - Deputy Scientist', role: 'APPROVER', roleLevel: 'scientist_e' },
      { id: 'sd-001', username: 'scientist_d', displayName: 'Scientist D - Technical Lead', role: 'OPERATOR', roleLevel: 'scientist_d' },
      { id: 'sc-001', username: 'scientist_c', displayName: 'Scientist C - Operations Manager', role: 'OPERATOR', roleLevel: 'scientist_c' },
      { id: 'gs-001', username: 'scientist', displayName: 'General Scientist', role: 'OPERATOR', roleLevel: 'general_scientist' },
      { id: 'gs-002', username: 'operator2', displayName: 'NTRO Operator 2', role: 'OPERATOR', roleLevel: 'general_scientist' },
      { id: 'au-001', username: 'auditor', displayName: 'Chief Auditor', role: 'AUDITOR', roleLevel: 'scientist_f' },
    ];

    for (const u of defaultUsers) {
      const keypair = generateKeypair();
      userKeypairs.set(u.id, keypair);
      users.set(u.id, {
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        roleLevel: u.roleLevel,
        portalUrl: PORTAL_CONFIG[u.role].loginRoute.replace('/login', ''),
        permissions: PORTAL_CONFIG[u.role].permissions,
        publicKey: keypair.publicKey,
        authProvider: 'local',
        createdAt: Date.now(),
        lastLogin: 0,
        mfaEnabled: false,
        mfaEnrolled: false,
        active: true,
      });
    }

    // Set default passwords (in production, these would be hashed and stored)
    userPasswords.set('chairman', 'ntro123');
    userPasswords.set('dscientist', 'ntro123');
    userPasswords.set('oscientist', 'ntro123');
    userPasswords.set('scientist_g', 'ntro123');
    userPasswords.set('scientist_f', 'ntro123');
    userPasswords.set('scientist_e', 'ntro123');
    userPasswords.set('scientist_d', 'ntro123');
    userPasswords.set('scientist_c', 'ntro123');
    userPasswords.set('scientist', 'ntro123');
    userPasswords.set('operator2', 'ntro123');
    userPasswords.set('auditor', 'ntro123');
  }

  /**
   * Authenticate user and create session
   */
  static login(username: string, password: string, portal: PortalRole, ip: string = '127.0.0.1'): {
    success: boolean;
    session?: AuthSession;
    user?: AuthUser;
    error?: string;
    mfaRequired?: boolean;
    challengeId?: string;
  } {
    AuthService.initialize();

    const user = Array.from(users.values()).find(u => u.username === username && u.active);
    if (!user) {
      loginHistory.push({ userId: username, timestamp: Date.now(), success: false, portal, ip });
      return { success: false, error: 'Invalid credentials' };
    }

    const storedPassword = userPasswords.get(username);
    if (storedPassword !== password) {
      loginHistory.push({ userId: user.userId, timestamp: Date.now(), success: false, portal, ip });
      return { success: false, error: 'Invalid credentials' };
    }

    // Check portal matches role — allow any portal for dual-auth flow
    if (user.role !== portal && portal !== 'OPERATOR') {
      loginHistory.push({ userId: user.userId, timestamp: Date.now(), success: false, portal, ip });
      return { success: false, error: 'Portal access denied for this role' };
    }

    // MFA check — if enrolled, require TOTP verification
    if (user.mfaEnabled && user.mfaEnrolled) {
      const challenge = AuthService.createMFAChallenge(user.userId);
      return { success: false, mfaRequired: true, challengeId: challenge.challengeId };
    }

    // Create session
    const session = AuthService.createSession(user);
    loginHistory.push({ userId: user.userId, timestamp: Date.now(), success: true, portal, ip });

    user.lastLogin = Date.now();
    users.set(user.userId, user);

    return { success: true, session, user };
  }

  /**
   * Verify MFA and complete login — uses real TOTP verification
   */
  static verifyMFA(challengeId: string, code: string): {
    success: boolean;
    session?: AuthSession;
    user?: AuthUser;
    error?: string;
  } {
    const result = AuthService.verifyMFAChallenge(challengeId, code);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const challenge = mfaChallenges.get(challengeId)!;
    const user = users.get(challenge.userId);
    if (!user) return { success: false, error: 'User not found' };

    const session = AuthService.createSession(user);
    return { success: true, session, user };
  }

  /**
   * Create a JWT session
   */
  static createSession(user: AuthUser): AuthSession {
    const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours
    const token = signJWT(
      {
        sub: user.userId,
        role: user.role,
        username: user.username,
        permissions: user.permissions,
      },
      JWT_SECRET,
      sessionDuration
    );

    const session: AuthSession = {
      token,
      userId: user.userId,
      role: user.role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + sessionDuration,
    };

    sessions.set(token, session);
    return session;
  }

  /**
   * Validate a session token
   */
  static validateSession(token: string): { valid: boolean; user?: AuthUser; error?: string } {
    const payload = verifyJWT(token);
    if (!payload) return { valid: false, error: 'Invalid or expired token' };

    const user = users.get(payload.sub as string);
    if (!user || !user.active) return { valid: false, error: 'User not found or inactive' };

    return { valid: true, user };
  }

  /**
   * Check if user has a specific permission
   */
  static hasPermission(userId: string, permission: AuthPermission): boolean {
    const user = users.get(userId);
    if (!user || !user.active) return false;
    return user.permissions.includes(permission);
  }

  /**
   * ENFORCE separation of duties: submitter CANNOT approve their own content
   */
  static canApprove(submitterId: string, approverId: string): { allowed: boolean; reason: string } {
    if (submitterId === approverId) {
      return {
        allowed: false,
        reason: 'SEPARATION_OF_DUTIES_VIOLATION: The submitter cannot approve their own content. A different approver identity is required.',
      };
    }
    return { allowed: true, reason: 'Separation of duties check passed' };
  }

  /**
   * Create MFA challenge for login — verifies against real TOTP
   */
  static createMFAChallenge(userId: string): MFAChallenge {
    const challenge: MFAChallenge = {
      challengeId: randomBytes(16).toString('hex'),
      userId,
      code: '', // Not used for TOTP — we verify against the stored secret
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      verified: false,
    };
    mfaChallenges.set(challenge.challengeId, challenge);
    return challenge;
  }

  /**
   * Start MFA enrollment — generates TOTP secret + recovery codes
   */
  static startMFAEnrollment(userId: string): MFAEnrollment | null {
    const user = users.get(userId);
    if (!user) return null;

    const totpSecret = generateTOTPSecret(user.role, user.username);
    const recoveryCodes = generateRecoveryCodes(8);

    const enrollment: MFAEnrollment = {
      enrollmentId: randomBytes(16).toString('hex'),
      userId,
      secret: totpSecret.secret,
      otpauthUri: totpSecret.otpauthUri,
      recoveryCodes,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes to complete
      verified: false,
    };

    mfaEnrollments.set(enrollment.enrollmentId, enrollment);
    return enrollment;
  }

  /**
   * Verify TOTP code during enrollment — activates MFA on success
   */
  static verifyMFAEnrollment(enrollmentId: string, code: string): { success: boolean; error?: string; recoveryCodes?: string[] } {
    const enrollment = mfaEnrollments.get(enrollmentId);
    if (!enrollment) return { success: false, error: 'Enrollment not found' };
    if (enrollment.verified) return { success: false, error: 'Enrollment already completed' };
    if (Date.now() > enrollment.expiresAt) return { success: false, error: 'Enrollment expired. Start a new one.' };

    const result = verifyTOTP(enrollment.secret, code);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    // Activate MFA on the user
    const user = users.get(enrollment.userId);
    if (!user) return { success: false, error: 'User not found' };

    user.mfaEnabled = true;
    user.mfaEnrolled = true;
    user.totpSecret = enrollment.secret;
    user.recoveryCodes = enrollment.recoveryCodes;
    users.set(user.userId, user);

    enrollment.verified = true;
    mfaEnrollments.set(enrollmentId, enrollment);

    return { success: true, recoveryCodes: enrollment.recoveryCodes };
  }

  /**
   * Verify TOTP code during login
   */
  static verifyMFAChallenge(challengeId: string, code: string): { success: boolean; error?: string } {
    const challenge = mfaChallenges.get(challengeId);
    if (!challenge) return { success: false, error: 'Challenge not found' };
    if (challenge.verified) return { success: false, error: 'Challenge already used' };
    if (Date.now() > challenge.expiresAt) return { success: false, error: 'Challenge expired' };

    const user = users.get(challenge.userId);
    if (!user) return { success: false, error: 'User not found' };
    if (!user.totpSecret) return { success: false, error: 'MFA not configured for this user' };

    const result = verifyTOTP(user.totpSecret, code);
    if (!result.valid) {
      return { success: false, error: result.error || 'Invalid code' };
    }

    challenge.verified = true;
    mfaChallenges.set(challengeId, challenge);
    return { success: true };
  }

  /**
   * Enable MFA for a user (legacy — sets the flag without enrollment)
   */
  static enableMFA(userId: string): boolean {
    const user = users.get(userId);
    if (!user) return false;
    user.mfaEnabled = true;
    users.set(userId, user);
    return true;
  }

  /**
   * Disable MFA for a user (admin action)
   */
  static disableMFA(userId: string): boolean {
    const user = users.get(userId);
    if (!user) return false;
    user.mfaEnabled = false;
    user.mfaEnrolled = false;
    user.totpSecret = undefined;
    user.recoveryCodes = undefined;
    users.set(userId, user);
    return true;
  }

  /**
   * Get all users (admin only)
   */
  static getAllUsers(): AuthUser[] {
    return Array.from(users.values());
  }

  /**
   * Get user by ID
   */
  static getUser(userId: string): AuthUser | undefined {
    return users.get(userId);
  }

  /**
   * Get user's public key (for signature verification)
   */
  static getPublicKey(userId: string): string | undefined {
    return userKeypairs.get(userId)?.publicKey;
  }

  /**
   * Get login history
   */
  static getLoginHistory(): LoginAttempt[] {
    return [...loginHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Create a new user
   */
  static createUser(username: string, displayName: string, role: PortalRole, roleLevel: RoleLevel = 'general_scientist'): AuthUser | null {
    if (Array.from(users.values()).find(u => u.username === username)) return null;
    
    const id = `${role.substring(0, 2).toLowerCase()}-${String(users.size + 1).padStart(3, '0')}`;
    const keypair = generateKeypair();
    userKeypairs.set(id, keypair);
    
    const user: AuthUser = {
      userId: id,
      username,
      displayName,
      role,
      roleLevel,
      portalUrl: PORTAL_CONFIG[role].loginRoute.replace('/login', ''),
      permissions: PORTAL_CONFIG[role].permissions,
      publicKey: keypair.publicKey,
      authProvider: 'local',
      createdAt: Date.now(),
      lastLogin: 0,
      mfaEnabled: false,
      mfaEnrolled: false,
      active: true,
    };
    
    users.set(id, user);
    userPasswords.set(username, 'changeme123');
    return user;
  }

  /**
   * Deactivate a user
   */
  static deactivateUser(userId: string): boolean {
    const user = users.get(userId);
    if (!user) return false;
    user.active = false;
    users.set(userId, user);
    return true;
  }

  /**
   * Promote a user to a new role level
   */
  static promoteUser(userId: string, newLevel: RoleLevel): boolean {
    const user = users.get(userId);
    if (!user) return false;
    
    // Update role based on level
    let newRole: PortalRole = 'OPERATOR';
    if (newLevel === 'chairman' || newLevel === 'distinguished_scientist') newRole = 'ADMIN';
    else if (newLevel === 'outstanding_scientist' || newLevel === 'scientist_g' || newLevel === 'scientist_f' || newLevel === 'scientist_e') newRole = 'APPROVER';
    
    user.roleLevel = newLevel;
    user.role = newRole;
    user.permissions = PORTAL_CONFIG[newRole].permissions;
    users.set(userId, user);
    return true;
  }

  /**
   * Activate a user
   */
  static activateUser(userId: string): boolean {
    const user = users.get(userId);
    if (!user) return false;
    user.active = true;
    users.set(userId, user);
    return true;
  }

  // ==================== GOOGLE OAUTH ====================

  private static googleClientId = '';
  private static googleClientSecret = '';
  private static googleRedirectUri = '';

  /**
   * Initialize Google OAuth config from environment variables
   */
  static initializeGoogleOAuth(): void {
    AuthService.googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    AuthService.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    AuthService.googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
  }

  /**
   * Get Google OAuth authorization URL for redirect
   */
  static getGoogleAuthURL(): string {
    if (!AuthService.googleClientId) {
      // Demo mode — return a mock URL that simulates Google Auth
      return '/api/auth?action=google_mock';
    }
    const params = new URLSearchParams({
      client_id: AuthService.googleClientId,
      redirect_uri: AuthService.googleRedirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handle Google OAuth callback — exchange code for tokens and get user info
   */
  static async handleGoogleCallback(code: string, redirectUri?: string): Promise<{
    success: boolean;
    user?: AuthUser;
    session?: AuthSession;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      // In production: exchange code for tokens, fetch Google user info
      // For demo: simulate Google auth response
      const googleUser = await AuthService.exchangeGoogleCode(code, redirectUri);
      if (!googleUser) {
        return { success: false, error: 'Failed to authenticate with Google' };
      }

      // Find or create user by googleId
      let user = Array.from(users.values()).find(u => u.googleId === googleUser.googleId);
      let isNewUser = false;

      if (!user) {
        // Create new user from Google profile — defaults to OPERATOR + employee level
        isNewUser = true;
        const id = `g-${randomBytes(8).toString('hex')}`;
        const keypair = generateKeypair();
        userKeypairs.set(id, keypair);

        user = {
          userId: id,
          username: googleUser.email.split('@')[0],
          displayName: googleUser.name,
          email: googleUser.email,
          role: 'OPERATOR',
          roleLevel: 'general_scientist',
          portalUrl: '/dashboard',
          permissions: PORTAL_CONFIG.OPERATOR.permissions,
          publicKey: keypair.publicKey,
          avatar: googleUser.picture,
          googleId: googleUser.googleId,
          googleEmail: googleUser.email,
          authProvider: 'google',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          mfaEnabled: false,
          mfaEnrolled: false,
          active: true,
        };
        users.set(id, user);
      } else {
        // Update existing user's Google info
        user.lastLogin = Date.now();
        user.googleEmail = googleUser.email;
        user.authProvider = 'both';
        users.set(user.userId, user);
      }

      const session = AuthService.createSession(user);
      return { success: true, user, session, isNewUser };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  /**
   * Mock Google auth for demo (simulates Google OAuth response)
   */
  static mockGoogleAuth(): {
    googleId: string;
    email: string;
    name: string;
    picture: string;
  } {
    return {
      googleId: 'google-' + randomBytes(8).toString('hex'),
      email: 'demo@ntro.gov.in',
      name: 'NTRO Demo User',
      picture: '',
    };
  }

  /**
   * Exchange Google authorization code for user info
   * In production, this calls Google's token endpoint
   */
  private static async exchangeGoogleCode(code: string, redirectUri?: string): Promise<{
    googleId: string;
    email: string;
    name: string;
    picture: string;
  } | null> {
    if (code === 'demo-code') {
      return AuthService.mockGoogleAuth();
    }

    if (!AuthService.googleClientId || !AuthService.googleClientSecret) {
      // No Google credentials configured — use mock
      return AuthService.mockGoogleAuth();
    }

    // Use provided redirect URI or fall back to configured one
    const effectiveRedirectUri = redirectUri || AuthService.googleRedirectUri;

    // Production flow: exchange code for tokens
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: AuthService.googleClientId,
          client_secret: AuthService.googleClientSecret,
          redirect_uri: effectiveRedirectUri,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.access_token) return null;

      // Fetch user info from Google
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      return {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture || '',
      };
    } catch {
      return null;
    }
  }

  /**
   * Update a user's role and role level (admin action)
   */
  static updateUserRole(userId: string, role: PortalRole, roleLevel: RoleLevel): boolean {
    const user = users.get(userId);
    if (!user) return false;
    user.role = role;
    user.roleLevel = roleLevel;
    user.permissions = PORTAL_CONFIG[role].permissions;
    users.set(userId, user);
    return true;
  }

  /**
   * Get role level info
   */
  static getRoleLevelInfo(level: RoleLevel) {
    return ROLE_LEVEL_LABELS[level];
  }

  /**
   * Check if user has minimum role level
   */
  static hasMinRoleLevel(userId: string, minLevel: RoleLevel): boolean {
    const user = users.get(userId);
    if (!user) return false;
    return ROLE_LEVEL_HIERARCHY[user.roleLevel] >= ROLE_LEVEL_HIERARCHY[minLevel];
  }

  /**
   * Logout (invalidate session)
   */
  static logout(token: string): boolean {
    return sessions.delete(token);
  }
}

// Default password store (simulated — production would use bcrypt)
const userPasswords: Map<string, string> = new Map();

// Auto-initialize
AuthService.initialize();
