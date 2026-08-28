/**
 * Role-Based Access Control (RBAC) System
 *
 * Enforces fine-grained permissions for who can submit, approve, and publish content.
 * Every API action is gated by permission checks — enforced at the service layer,
 * not just in app logic.
 */

// ==================== TYPES ====================

export type Permission =
  // Content operations
  | 'content:submit'
  | 'content:edit'
  | 'content:read'
  | 'content:delete'
  // Approval operations
  | 'approval:approve'
  | 'approval:reject'
  | 'approval:view'
  // Publication
  | 'publish:create'
  | 'publish:view'
  // Security
  | 'security:scan'
  | 'security:view'
  | 'security:override'
  // Admin
  | 'admin:roles'
  | 'admin:users'
  | 'admin:audit'
  | 'admin:config'
  // Blockchain
  | 'blockchain:view'
  | 'blockchain:verify'
  // Plugins
  | 'plugins:manage'
  // NTRO Section access
  | 'section:transform'
  | 'section:approval'
  | 'section:analysis'
  | 'section:threat'
  | 'section:compliance'
  | 'section:dlp'
  | 'section:incident'
  | 'section:linkage'
  ;

export interface RoleDefinition {
  id: RBACRole;
  name: string;
  description: string;
  icon: string;
  permissions: Permission[];
  isSystem: boolean;  // System roles cannot be deleted
  color: string;
}

export interface UserAssignment {
  userId: string;
  userName: string;
  role: RBACRole;
  assignedAt: number;
  assignedBy: string;
  active: boolean;
}

export interface AccessCheckResult {
  allowed: boolean;
  role: RBACRole;
  permission: Permission;
  reason: string;
}

// ==================== ROLE DEFINITIONS ====================

const DEFAULT_ROLES: Record<RBACRole, RoleDefinition> = {
  VIEWER: {
    id: 'VIEWER',
    name: 'Viewer',
    description: 'Read-only access to view content and results',
    icon: '👁️',
    color: '#6b7280',
    isSystem: true,
    permissions: [
      'content:read',
      'approval:view',
      'publish:view',
      'security:view',
      'blockchain:view',
    ],
  },
  CONTENT_CREATOR: {
    id: 'CONTENT_CREATOR',
    name: 'Content Creator',
    description: 'Creates and submits content for transformation',
    icon: '✍️',
    color: '#3b82f6',
    isSystem: false,
    permissions: [
      'content:submit',
      'content:edit',
      'content:read',
      'approval:view',
      'publish:view',
      'security:scan',
      'security:view',
      'blockchain:view',
      'blockchain:verify',
    ],
  },
  CONTENT_EDITOR: {
    id: 'CONTENT_EDITOR',
    name: 'Content Editor',
    description: 'Edits and refines content drafts before approval',
    icon: '✏️',
    color: '#8b5cf6',
    isSystem: false,
    permissions: [
      'content:submit',
      'content:edit',
      'content:read',
      'content:delete',
      'approval:view',
      'publish:view',
      'security:scan',
      'security:view',
      'blockchain:view',
    ],
  },
  ANALYST: {
    id: 'ANALYST',
    name: 'Analyst',
    description: 'Reviews content for analytical quality and accuracy',
    icon: '📊',
    color: '#06b6d4',
    isSystem: false,
    permissions: [
      'content:submit',
      'content:edit',
      'content:read',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:view',
      'security:scan',
      'security:view',
      'blockchain:view',
    ],
  },
  SECURITY_OFFICER: {
    id: 'SECURITY_OFFICER',
    name: 'Security Officer',
    description: 'Reviews content for security risks and DLP compliance',
    icon: '🛡️',
    color: '#ef4444',
    isSystem: true,
    permissions: [
      'content:read',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:view',
      'security:scan',
      'security:view',
      'security:override',
      'blockchain:view',
      'blockchain:verify',
      'admin:audit',
    ],
  },
  COMPLIANCE_OFFICER: {
    id: 'COMPLIANCE_OFFICER',
    name: 'Compliance Officer',
    description: 'Ensures regulatory compliance (DPDP, GDPR, IT Act)',
    icon: '📋',
    color: '#f59e0b',
    isSystem: true,
    permissions: [
      'content:read',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:view',
      'security:scan',
      'security:view',
      'blockchain:view',
      'blockchain:verify',
      'admin:audit',
    ],
  },
  CONTENT_MANAGER: {
    id: 'CONTENT_MANAGER',
    name: 'Content Manager',
    description: 'Reviews content quality and brand alignment, manages publication',
    icon: '📝',
    color: '#10b981',
    isSystem: true,
    permissions: [
      'content:submit',
      'content:edit',
      'content:read',
      'content:delete',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:create',
      'publish:view',
      'security:scan',
      'security:view',
      'blockchain:view',
      'blockchain:verify',
    ],
  },
  EXECUTIVE: {
    id: 'EXECUTIVE',
    name: 'Executive Approver',
    description: 'Senior leadership sign-off for high-impact content',
    icon: '👔',
    color: '#ec4899',
    isSystem: true,
    permissions: [
      'content:read',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:create',
      'publish:view',
      'security:view',
      'blockchain:view',
    ],
  },
  LEGAL_COUNSEL: {
    id: 'LEGAL_COUNSEL',
    name: 'Legal Counsel',
    description: 'Reviews content for legal implications',
    icon: '⚖️',
    color: '#a855f7',
    isSystem: true,
    permissions: [
      'content:read',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:view',
      'security:view',
      'blockchain:view',
    ],
  },
  DPO: {
    id: 'DPO',
    name: 'Data Protection Officer',
    description: 'Ensures data protection compliance',
    icon: '🔐',
    color: '#14b8a6',
    isSystem: true,
    permissions: [
      'content:read',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:view',
      'security:scan',
      'security:view',
      'blockchain:view',
      'admin:audit',
    ],
  },
  SYSTEM_ADMIN: {
    id: 'SYSTEM_ADMIN',
    name: 'System Admin',
    description: 'Full system access including user and role management',
    icon: '🖥️',
    color: '#f97316',
    isSystem: true,
    permissions: [
      'content:submit',
      'content:edit',
      'content:read',
      'content:delete',
      'approval:approve',
      'approval:reject',
      'approval:view',
      'publish:create',
      'publish:view',
      'security:scan',
      'security:view',
      'security:override',
      'admin:roles',
      'admin:users',
      'admin:audit',
      'admin:config',
      'blockchain:view',
      'blockchain:verify',
      'plugins:manage',
    ],
  },
};

// ==================== IN-MEMORY STORE ====================

const userAssignments: Map<string, UserAssignment> = new Map();
let initialized = false;

// ==================== RBAC CLASS ====================

export class RBAC {
  /**
   * Initialize with a default SYSTEM_ADMIN assignment
   */
  static initialize(): void {
    if (initialized) return;
    initialized = true;

    // Assign default admin
    RBAC.assignUser('admin-001', 'System Admin', 'SYSTEM_ADMIN', 'SYSTEM');
  }

  /**
   * Get all role definitions
   */
  static getRoles(): RoleDefinition[] {
    return Object.values(DEFAULT_ROLES);
  }

  /**
   * Get a specific role definition
   */
  static getRole(roleId: RBACRole): RoleDefinition | undefined {
    return DEFAULT_ROLES[roleId];
  }

  /**
   * Get permissions for a role
   */
  static getPermissions(roleId: RBACRole): Permission[] {
    return DEFAULT_ROLES[roleId]?.permissions || [];
  }

  /**
   * Check if a role has a specific permission
   */
  static hasPermission(roleId: RBACRole, permission: Permission): boolean {
    const role = DEFAULT_ROLES[roleId];
    if (!role) return false;
    return role.permissions.includes(permission);
  }

  /**
   * Assign a role to a user
   */
  static assignUser(
    userId: string,
    userName: string,
    role: RBACRole,
    assignedBy: string
  ): UserAssignment {
    const assignment: UserAssignment = {
      userId,
      userName,
      role,
      assignedAt: Date.now(),
      assignedBy,
      active: true,
    };
    userAssignments.set(userId, assignment);
    return assignment;
  }

  /**
   * Deactivate a user assignment
   */
  static deactivateUser(userId: string): boolean {
    const assignment = userAssignments.get(userId);
    if (!assignment) return false;
    assignment.active = false;
    return true;
  }

  /**
   * Get user assignment
   */
  static getUserAssignment(userId: string): UserAssignment | undefined {
    return userAssignments.get(userId);
  }

  /**
   * Get all user assignments
   */
  static getAllAssignments(): UserAssignment[] {
    return Array.from(userAssignments.values());
  }

  /**
   * Get active user assignments
   */
  static getActiveAssignments(): UserAssignment[] {
    return Array.from(userAssignments.values()).filter(a => a.active);
  }

  /**
   * Enforce a permission check — returns result with reason
   */
  static checkAccess(userId: string, permission: Permission): AccessCheckResult {
    const assignment = userAssignments.get(userId);

    if (!assignment) {
      return {
        allowed: false,
        role: 'VIEWER',
        permission,
        reason: 'User has no role assignment',
      };
    }

    if (!assignment.active) {
      return {
        allowed: false,
        role: assignment.role,
        permission,
        reason: 'User account is deactivated',
      };
    }

    const role = DEFAULT_ROLES[assignment.role];
    if (!role) {
      return {
        allowed: false,
        role: assignment.role,
        permission,
        reason: 'Role definition not found',
      };
    }

    const hasPermission = role.permissions.includes(permission);

    return {
      allowed: hasPermission,
      role: assignment.role,
      permission,
      reason: hasPermission
        ? `Role "${role.name}" has permission "${permission}"`
        : `Role "${role.name}" does not have permission "${permission}"`,
    };
  }

  /**
   * Require a permission — throws if not authorized
   */
  static requirePermission(userId: string, permission: Permission): void {
    const result = RBAC.checkAccess(userId, permission);
    if (!result.allowed) {
      throw new Error(`Access denied: ${result.reason}`);
    }
  }

  /**
   * Get users by role
   */
  static getUsersByRole(role: RBACRole): UserAssignment[] {
    return Array.from(userAssignments.values()).filter(
      a => a.role === role && a.active
    );
  }

  /**
   * Check if any user has a specific permission
   */
  static anyUserHasPermission(permission: Permission): boolean {
    return Array.from(userAssignments.values()).some(a => {
      if (!a.active) return false;
      const role = DEFAULT_ROLES[a.role];
      return role?.permissions.includes(permission) || false;
    });
  }

  /**
   * Get RBAC statistics
   */
  static getStats() {
    const assignments = Array.from(userAssignments.values());
    return {
      totalUsers: assignments.length,
      activeUsers: assignments.filter(a => a.active).length,
      usersByRole: Object.keys(DEFAULT_ROLES).reduce((acc, role) => {
        acc[role] = assignments.filter(a => a.role === role && a.active).length;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Auto-initialize on import
RBAC.initialize();
