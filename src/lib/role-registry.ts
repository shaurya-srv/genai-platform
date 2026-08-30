/**
 * Role Registry
 * 
 * Maps Google emails to NTRO org levels.
 * When a user signs up via Google, their role is auto-assigned
 * based on this registry.
 * 
 * Level 1-2: Executive/Senior → can post directly
 * Level 3-4: Middle/General → need Level 2 approval
 * 
 * Edit this file to add your team's Google emails and roles.
 */

import { RoleLevel, PortalRole } from './auth';

export interface RegisteredUser {
  email: string;
  displayName: string;
  roleLevel: RoleLevel;
  portalRole: PortalRole;  // OPERATOR, APPROVER, ADMIN, AUDITOR
}

/**
 * ADD YOUR TEAM'S EMAILS HERE
 * 
 * Format: email → role assignment
 * 
 * Level hierarchy:
 *   chairman              (Level 1 - Executive, direct publish)
 *   distinguished_scientist (Level 1 - Executive, direct publish)
 *   outstanding_scientist  (Level 1 - Executive, direct publish)
 *   scientist_g           (Level 2 - Senior Management, direct publish)
 *   scientist_f           (Level 2 - Senior Management, direct publish)
 *   scientist_e           (Level 2 - Senior Management, direct publish)
 *   scientist_d           (Level 3 - Middle Management, needs approval)
 *   scientist_c           (Level 3 - Middle Management, needs approval)
 *   general_scientist     (Level 4 - General Staff, needs approval)
 */
const REGISTRY: RegisteredUser[] = [
  // ===== LEVEL 1 — Executive (direct publish, can do everything) =====
  { email: "level1_executive@gmail.com", displayName: "Level 1 Executive", roleLevel: "chairman", portalRole: "ADMIN" },

  // ===== LEVEL 2 — Senior Management (can approve Level 3/4, direct publish) =====
  { email: "level2_senior@gmail.com", displayName: "Level 2 Senior", roleLevel: "scientist_g", portalRole: "APPROVER" },

  // ===== LEVEL 3 — Middle Management (needs Level 2 approval to publish) =====
  { email: "level3_middle@gmail.com", displayName: "Level 3 Middle", roleLevel: "scientist_d", portalRole: "OPERATOR" },

  // ===== LEVEL 4 — General Staff (needs Level 2 approval to publish) =====
  { email: "level4_general@gmail.com", displayName: "Level 4 General", roleLevel: "general_scientist", portalRole: "OPERATOR" },

  // ===== ADD YOUR TEAM'S EMAILS BELOW =====
  // Replace the placeholder emails above with real Google emails
  // Example:
  // { email: "yourname@gmail.com", displayName: "Your Name", roleLevel: "scientist_g", portalRole: "APPROVER" },
];

// Default role for unregistered emails (Level 4 — needs approval)
const DEFAULT_ROLE: RoleLevel = 'general_scientist';
const DEFAULT_PORTAL: PortalRole = 'OPERATOR';

// ==================== LOOKUP ====================

/**
 * Look up a user's role by their Google email
 */
export function lookupRole(email: string): { roleLevel: RoleLevel; portalRole: PortalRole; displayName: string; registered: boolean } {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = REGISTRY.find(r => r.email.toLowerCase() === normalizedEmail);

  if (entry) {
    return {
      roleLevel: entry.roleLevel,
      portalRole: entry.portalRole,
      displayName: entry.displayName,
      registered: true,
    };
  }

  // Unregistered email — default to Level 4
  return {
    roleLevel: DEFAULT_ROLE,
    portalRole: DEFAULT_PORTAL,
    displayName: email.split('@')[0],
    registered: false,
  };
}

/**
 * Get all registered users (admin view)
 */
export function getRegisteredUsers(): RegisteredUser[] {
  return [...REGISTRY];
}

/**
 * Check if an email is registered
 */
export function isRegistered(email: string): boolean {
  return REGISTRY.some(r => r.email.toLowerCase() === email.toLowerCase());
}

/**
 * Add or update a user in the registry
 * (For admin use — in production, store in database)
 */
export function registerUser(user: RegisteredUser): void {
  const existing = REGISTRY.findIndex(r => r.email.toLowerCase() === user.email.toLowerCase());
  if (existing >= 0) {
    REGISTRY[existing] = user;
  } else {
    REGISTRY.push(user);
  }
}
