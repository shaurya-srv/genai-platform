/**
 * Multi-Signature Approval Workflow
 * Implements multi-party sign-off for content transformation
 * Supports role-based approvals with configurable thresholds
 */

export interface ApprovalRequest {
  id: string;
  transformationId: string;
  requestedBy: string;
  requestedAt: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  requiredApprovals: number;
  currentApprovals: number;
  approvals: Approval[];
  deadline: number;
  metadata: {
    outputType: string;
    threatLevel: string;
    complianceScore: number;
    dlpSafe: boolean;
  };
}

export interface Approval {
  id: string;
  approverId: string;
  approverName: string;
  role: ApprovalRole;
  decision: 'APPROVE' | 'REJECT' | 'ABSTAIN';
  timestamp: number;
  comments: string;
  signatureHash: string;
}

export type ApprovalRole =
  | 'CONTENT_CREATOR'
  | 'SECURITY_OFFICER'
  | 'COMPLIANCE_OFFICER'
  | 'CONTENT_MANAGER'
  | 'EXECUTIVE'
  | 'LEGAL_COUNSEL'
  | 'DPO' // Data Protection Officer
  | 'SYSTEM_ADMIN';

// Required approvals per output type
const APPROVAL_CONFIG: Record<string, {
  requiredRoles: ApprovalRole[];
  minApprovals: number;
  deadlineHours: number;
}> = {
  video: {
    requiredRoles: ['SECURITY_OFFICER', 'CONTENT_MANAGER'],
    minApprovals: 2,
    deadlineHours: 48,
  },
  linkedin: {
    requiredRoles: ['CONTENT_MANAGER'],
    minApprovals: 1,
    deadlineHours: 24,
  },
  twitter: {
    requiredRoles: ['CONTENT_MANAGER'],
    minApprovals: 1,
    deadlineHours: 24,
  },
  advisory: {
    requiredRoles: ['SECURITY_OFFICER', 'COMPLIANCE_OFFICER', 'EXECUTIVE'],
    minApprovals: 3,
    deadlineHours: 72,
  },
  infographic: {
    requiredRoles: ['CONTENT_MANAGER'],
    minApprovals: 1,
    deadlineHours: 24,
  },
  executive_summary: {
    requiredRoles: ['SECURITY_OFFICER', 'EXECUTIVE'],
    minApprovals: 2,
    deadlineHours: 48,
  },
  presentation: {
    requiredRoles: ['CONTENT_MANAGER', 'SECURITY_OFFICER'],
    minApprovals: 2,
    deadlineHours: 48,
  },
  crisis_response: {
    requiredRoles: ['SECURITY_OFFICER', 'COMPLIANCE_OFFICER', 'EXECUTIVE', 'LEGAL_COUNSEL'],
    minApprovals: 4,
    deadlineHours: 4,
  },
};

const ROLE_DESCRIPTIONS: Record<ApprovalRole, { title: string; description: string; icon: string }> = {
  CONTENT_CREATOR: { title: 'Content Creator', description: 'Creates and submits content for transformation', icon: '✍️' },
  SECURITY_OFFICER: { title: 'Security Officer', description: 'Reviews content for security risks and DLP compliance', icon: '🛡️' },
  COMPLIANCE_OFFICER: { title: 'Compliance Officer', description: 'Ensures regulatory compliance (DPDP, GDPR, IT Act)', icon: '📋' },
  CONTENT_MANAGER: { title: 'Content Manager', description: 'Reviews content quality and brand alignment', icon: '📝' },
  EXECUTIVE: { title: 'Executive Approver', description: 'Senior leadership sign-off for high-impact content', icon: '👔' },
  LEGAL_COUNSEL: { title: 'Legal Counsel', description: 'Reviews content for legal implications', icon: '⚖️' },
  DPO: { title: 'Data Protection Officer', description: 'Ensures data protection compliance', icon: '🔐' },
  SYSTEM_ADMIN: { title: 'System Admin', description: 'Technical review and system-level approval', icon: '🖥️' },
};

// In-memory store
const approvalRequests: Map<string, ApprovalRequest> = new Map();

// Approval History Log
export interface ApprovalHistoryEntry {
  id: string;
  timestamp: number;
  eventType: 'REQUEST_CREATED' | 'APPROVAL_GRANTED' | 'APPROVAL_REJECTED' | 'APPROVAL_ABSTAINED' | 'DEADLINE_WARNING' | 'DEADLINE_EXPIRED' | 'REQUEST_COMPLETED';
  requestId: string;
  transformationId: string;
  outputType: string;
  actor: string;
  actorRole: string;
  decision?: string;
  comments?: string;
  signatureHash?: string;
  metadata: Record<string, unknown>;
}

const approvalHistory: ApprovalHistoryEntry[] = [];

export class MultiSigApproval {
  /**
   * Create a new approval request
   */
  static createRequest(
    transformationId: string,
    requestedBy: string,
    outputType: string,
    threatLevel: string,
    complianceScore: number,
    dlpSafe: boolean
  ): ApprovalRequest {
    const config = APPROVAL_CONFIG[outputType] || APPROVAL_CONFIG.linkedin;

    const request: ApprovalRequest = {
      id: crypto.randomUUID(),
      transformationId,
      requestedBy,
      requestedAt: Date.now(),
      status: 'PENDING',
      requiredApprovals: config.minApprovals,
      currentApprovals: 0,
      approvals: [],
      deadline: Date.now() + config.deadlineHours * 60 * 60 * 1000,
      metadata: {
        outputType,
        threatLevel,
        complianceScore,
        dlpSafe,
      },
    };

    approvalRequests.set(request.id, request);

    // Record history entry
    approvalHistory.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      eventType: 'REQUEST_CREATED',
      requestId: request.id,
      transformationId,
      outputType,
      actor: requestedBy,
      actorRole: 'CONTENT_CREATOR',
      metadata: {
        threatLevel,
        complianceScore,
        dlpSafe,
        requiredApprovals: config.minApprovals,
        deadlineHours: config.deadlineHours,
        deadline: request.deadline,
      },
    });

    return request;
  }

  /**
   * Submit an approval vote
   */
  static submitApproval(
    requestId: string,
    approverId: string,
    approverName: string,
    role: ApprovalRole,
    decision: 'APPROVE' | 'REJECT' | 'ABSTAIN',
    comments: string = ''
  ): Approval {
    const request = approvalRequests.get(requestId);
    if (!request) throw new Error('Approval request not found');
    if (request.status !== 'PENDING') throw new Error('Request is no longer pending');

    // Check deadline
    if (Date.now() > request.deadline) {
      request.status = 'EXPIRED';
      throw new Error('Approval request has expired');
    }

    // Check if already approved by this role
    const existingApproval = request.approvals.find(
      a => a.approverId === approverId && a.role === role
    );
    if (existingApproval) throw new Error('Already approved/rejected by this role');

    const signatureHash = createSignatureHash(approverId, requestId, decision);

    const approval: Approval = {
      id: crypto.randomUUID(),
      approverId,
      approverName,
      role,
      decision,
      timestamp: Date.now(),
      comments,
      signatureHash,
    };

    request.approvals.push(approval);

    if (decision === 'APPROVE') {
      request.currentApprovals++;
    }

    // Check if we have enough approvals
    if (request.currentApprovals >= request.requiredApprovals) {
      request.status = 'APPROVED';
    } else if (decision === 'REJECT') {
      request.status = 'REJECTED';
    }

    // Record history entry
    approvalHistory.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      eventType: decision === 'APPROVE' ? 'APPROVAL_GRANTED' : decision === 'REJECT' ? 'APPROVAL_REJECTED' : 'APPROVAL_ABSTAINED',
      requestId,
      transformationId: request.transformationId,
      outputType: request.metadata.outputType,
      actor: approverName,
      actorRole: role,
      decision,
      comments,
      signatureHash,
      metadata: {
        currentApprovals: request.currentApprovals,
        requiredApprovals: request.requiredApprovals,
        requestStatus: request.status,
      },
    });

    // Record completion if just approved
    if (request.status === 'APPROVED') {
      approvalHistory.push({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        eventType: 'REQUEST_COMPLETED',
        requestId,
        transformationId: request.transformationId,
        outputType: request.metadata.outputType,
        actor: 'SYSTEM',
        actorRole: 'SYSTEM',
        metadata: {
          totalApprovals: request.currentApprovals,
          requiredApprovals: request.requiredApprovals,
        },
      });
    }

    return approval;
  }

  /**
   * Get approval request
   */
  static getRequest(requestId: string): ApprovalRequest | undefined {
    return approvalRequests.get(requestId);
  }

  /**
   * Get all pending requests
   */
  static getPendingRequests(): ApprovalRequest[] {
    return Array.from(approvalRequests.values()).filter(r => r.status === 'PENDING');
  }

  /**
   * Get all requests for a transformation
   */
  static getRequestsForTransformation(transformationId: string): ApprovalRequest[] {
    return Array.from(approvalRequests.values()).filter(
      r => r.transformationId === transformationId
    );
  }

  /**
   * Get approval requirements for an output type
   */
  static getRequirements(outputType: string) {
    const config = APPROVAL_CONFIG[outputType] || APPROVAL_CONFIG.linkedin;
    return {
      ...config,
      roleDescriptions: config.requiredRoles.map(r => ({
        role: r,
        ...ROLE_DESCRIPTIONS[r],
      })),
    };
  }

  /**
   * Get all available roles
   */
  static getRoles() {
    return ROLE_DESCRIPTIONS;
  }

  /**
   * Get approval history for a transformation
   */
  static getHistory(transformationId: string): ApprovalHistoryEntry[] {
    return approvalHistory
      .filter(h => h.transformationId === transformationId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all approval history
   */
  static getAllHistory(): ApprovalHistoryEntry[] {
    return [...approvalHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get recent notifications (last N minutes)
   */
  static getRecentNotifications(minutes: number = 30): ApprovalHistoryEntry[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return approvalHistory
      .filter(h => h.timestamp >= cutoff && h.eventType !== 'REQUEST_CREATED')
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get deadline status for all pending requests
   */
  static getDeadlineStatuses(): Array<{
    requestId: string;
    outputType: string;
    transformationId: string;
    deadline: number;
    timeRemaining: number;
    isUrgent: boolean;
    isExpired: boolean;
    urgencyLevel: 'normal' | 'warning' | 'urgent' | 'critical' | 'expired';
  }> {
    const now = Date.now();
    return Array.from(approvalRequests.values())
      .filter(r => r.status === 'PENDING')
      .map(r => {
        const timeRemaining = r.deadline - now;
        const totalDuration = r.deadline - r.requestedAt;
        const fractionRemaining = timeRemaining / totalDuration;
        let urgencyLevel: 'normal' | 'warning' | 'urgent' | 'critical' | 'expired' = 'normal';
        if (timeRemaining <= 0) urgencyLevel = 'expired';
        else if (fractionRemaining <= 0.1) urgencyLevel = 'critical';
        else if (fractionRemaining <= 0.25) urgencyLevel = 'urgent';
        else if (fractionRemaining <= 0.5) urgencyLevel = 'warning';

        return {
          requestId: r.id,
          outputType: r.metadata.outputType,
          transformationId: r.transformationId,
          deadline: r.deadline,
          timeRemaining: Math.max(0, timeRemaining),
          isUrgent: timeRemaining > 0 && fractionRemaining <= 0.25,
          isExpired: timeRemaining <= 0,
          urgencyLevel,
        };
      })
      .sort((a, b) => a.timeRemaining - b.timeRemaining);
  }

  /**
   * Get approval statistics
   */
  static getStats() {
    const all = Array.from(approvalRequests.values());
    return {
      total: all.length,
      pending: all.filter(r => r.status === 'PENDING').length,
      approved: all.filter(r => r.status === 'APPROVED').length,
      rejected: all.filter(r => r.status === 'REJECTED').length,
      expired: all.filter(r => r.status === 'EXPIRED').length,
    };
  }
}

/**
 * Create a signature hash for approval
 */
function createSignatureHash(approverId: string, requestId: string, decision: string): string {
  const data = `${approverId}:${requestId}:${decision}:${Date.now()}`;
  // In production, use proper cryptographic signing
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}
