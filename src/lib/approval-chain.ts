/**
 * Approval Command Chain
 * 
 * Flow: Operator transforms → clicks "Finalise" → approval request routes 
 * through command chain based on content type and operator's role level →
 * approvers at each level review → once all required approvals are in,
 * content auto-publishes to linked social platforms.
 * 
 * Command Chain Hierarchy:
 *   Level 4 (General Staff) → submits
 *   Level 3 (Middle Mgmt) → first review
 *   Level 2 (Senior Mgmt) → second review  
 *   Level 1 (Executive) → final sign-off (for high-risk content)
 */

import { RoleLevel, ROLE_LEVEL_HIERARCHY } from './auth';

// ==================== TYPES ====================

export type ContentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ChainStatus = 
  | 'DRAFT'           // Content created, not yet finalised
  | 'FINALISED'       // Operator clicked Finalise, awaiting first approver
  | 'IN_REVIEW'       // At least one approver has seen it
  | 'APPROVED'         // All required approvals received
  | 'REJECTED'         // Rejected by any approver
  | 'PUBLISHED'        // Auto-published to socials
  | 'PUBLISH_FAILED'   // Approved but publishing failed
  | 'EXPIRED';         // Deadline passed

export interface ApprovalChainRequest {
  id: string;
  transformationId: string;
  
  // Content info
  title: string;
  contentPreview: string;     // First 200 chars
  outputTypes: string[];      // Which platforms: linkedin, twitter, etc.
  riskLevel: ContentRiskLevel;
  
  // Submitter info
  submittedBy: string;        // userId
  submittedByName: string;
  submittedByLevel: RoleLevel;
  submittedAt: number;
  
  // Chain state
  status: ChainStatus;
  currentStep: number;        // Which step in the chain we're at
  chain: ApprovalStep[];
  
  // Publishing
  publishTargets: PublishTarget[];
  publishedAt?: number;
  publishResults?: PublishResult[];
  
  // Metadata
  deadline: number;
  metadata: Record<string, any>;
}

export interface ApprovalStep {
  stepNumber: number;
  requiredLevel: RoleLevel;      // Minimum role level needed
  requiredRoleName: string;      // Display name
  approverId?: string;           // Who actually approved
  approverName?: string;
  decision?: 'APPROVE' | 'REJECT' | 'ABSTAIN';
  decisionAt?: number;
  comments?: string;
  signatureHash?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED';
}

export interface PublishTarget {
  platform: 'linkedin' | 'twitter' | 'email';
  accountId: string;
  accountName: string;
  status: 'PENDING' | 'PUBLISHING' | 'SUCCESS' | 'FAILED';
  publishedAt?: number;
  postId?: string;
  error?: string;
}

export interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  timestamp: number;
}

// ==================== COMMAND CHAIN RULES ====================

/**
 * Determines the approval chain needed based on:
 * 1. Content risk level
 * 2. Output types (social platforms need more scrutiny)
 * 3. Submitter's role level
 */
function buildApprovalChain(
  submitterLevel: RoleLevel,
  riskLevel: ContentRiskLevel,
  outputTypes: string[]
): ApprovalStep[] {
  const submitterNum = ROLE_LEVEL_HIERARCHY[submitterLevel];
  const steps: ApprovalStep[] = [];

  const hasCrisisContent = outputTypes.includes('crisis_response');
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  // Level 1 & 2 (Executive / Senior Management) — can post directly, no approval needed
  // chairman (9), distinguished_scientist (8), outstanding_scientist (7),
  // scientist_g (6), scientist_f (5), scientist_e (4)
  if (submitterNum >= ROLE_LEVEL_HIERARCHY.scientist_e) {
    return steps; // Empty chain = auto-approve
  }

  // Level 3 & 4 (Middle Management / General Staff) — need Level 2 approval
  // scientist_d (3), scientist_c (2), general_scientist (1)

  // Step 1: Senior Management (Level 2) review — always required for Level 3/4
  steps.push({
    stepNumber: 1,
    requiredLevel: 'scientist_f',
    requiredRoleName: 'Scientist F (Senior Management)',
    status: 'PENDING',
  });

  // Step 2: Executive review (Level 1) — required for high-risk or crisis content
  if (isHighRisk || hasCrisisContent) {
    steps.push({
      stepNumber: 2,
      requiredLevel: 'outstanding_scientist',
      requiredRoleName: 'Outstanding Scientist (Executive)',
      status: 'PENDING',
    });
  }

  // Step 3: Chairman sign-off — only for CRITICAL risk
  if (riskLevel === 'CRITICAL') {
    steps.push({
      stepNumber: steps.length + 1,
      requiredLevel: 'chairman',
      requiredRoleName: 'Chairman',
      status: 'PENDING',
    });
  }

  return steps;
}

function getLevelForNumber(num: number): RoleLevel {
  const entries = Object.entries(ROLE_LEVEL_HIERARCHY) as [RoleLevel, number][];
  const match = entries.find(([, v]) => v === num);
  return match ? match[0] : 'scientist_d';
}

function getLevelLabel(level: RoleLevel): string {
  const labels: Record<RoleLevel, string> = {
    chairman: 'Chairman',
    distinguished_scientist: 'Distinguished Scientist',
    outstanding_scientist: 'Outstanding Scientist (Executive)',
    scientist_g: 'Scientist G (Senior Management)',
    scientist_f: 'Scientist F (Senior Management)',
    scientist_e: 'Scientist E (Senior Management)',
    scientist_d: 'Scientist D (Middle Management)',
    scientist_c: 'Scientist C (Middle Management)',
    general_scientist: 'General Scientist',
  };
  return labels[level] || level;
}

/**
 * Assess content risk level based on output types and content keywords
 */
export function assessRiskLevel(
  content: string,
  outputTypes: string[]
): ContentRiskLevel {
  const lower = content.toLowerCase();
  
  // Critical indicators
  if (/\b(critical|emergency|immediate|classified|top.secret)\b/i.test(lower) ||
      outputTypes.includes('crisis_response')) {
    return 'CRITICAL';
  }
  
  // High risk indicators
  if (/\b(security|breach|incident|vulnerability|attack|threat)\b/i.test(lower) ||
      outputTypes.includes('advisory') ||
      outputTypes.includes('executive_summary')) {
    return 'HIGH';
  }
  
  // Medium risk — social publishing
  if (outputTypes.includes('linkedin') || outputTypes.includes('twitter')) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

// ==================== IN-MEMORY STORE ====================

const chainRequests: Map<string, ApprovalChainRequest> = new Map();
const chainHistory: Array<{
  id: string;
  timestamp: number;
  eventType: string;
  requestId: string;
  actor: string;
  details: Record<string, any>;
}> = [];

// ==================== MAIN SERVICE ====================

export class ApprovalChainService {
  /**
   * Finalise content — operator clicks "Finalise" to submit for approval
   */
  static finalise(params: {
    transformationId: string;
    title: string;
    contentPreview: string;
    outputTypes: string[];
    submittedBy: string;
    submittedByName: string;
    submittedByLevel: RoleLevel;
    metadata?: Record<string, any>;
  }): ApprovalChainRequest {
    const riskLevel = assessRiskLevel(params.contentPreview, params.outputTypes);
    const chain = buildApprovalChain(params.submittedByLevel, riskLevel, params.outputTypes);
    
    // Build publish targets from output types
    const publishTargets: PublishTarget[] = params.outputTypes
      .filter(t => ['linkedin', 'twitter'].includes(t))
      .map(t => ({
        platform: t as 'linkedin' | 'twitter',
        accountId: '',  // Will be filled from linked accounts
        accountName: '',
        status: 'PENDING' as const,
      }));
    
    const request: ApprovalChainRequest = {
      id: `ac-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      transformationId: params.transformationId,
      title: params.title,
      contentPreview: params.contentPreview.substring(0, 200),
      outputTypes: params.outputTypes,
      riskLevel,
      submittedBy: params.submittedBy,
      submittedByName: params.submittedByName,
      submittedByLevel: params.submittedByLevel,
      submittedAt: Date.now(),
      status: 'FINALISED',
      currentStep: 0,
      chain,
      publishTargets,
      deadline: Date.now() + this.getDeadlineForRisk(riskLevel),
      metadata: params.metadata || {},
    };    // Level 1/2: empty chain = auto-approve and publish immediately
    if (chain.length === 0) {
      request.status = 'APPROVED';
      chainHistory.push({
        id: `ch-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'AUTO_APPROVED',
        requestId: request.id,
        actor: params.submittedByName,
        details: {
          reason: `Level 1/2 submitter (${params.submittedByLevel}) — direct publish authority`,
          outputTypes: params.outputTypes,
        },
      });
    } else {
      // Activate first step
      chain[0].status = 'ACTIVE';
    }

    chainRequests.set(request.id, request);

    chainHistory.push({
      id: `ch-${Date.now()}`,
      timestamp: Date.now(),
      eventType: 'CONTENT_FINALISED',
      requestId: request.id,
      actor: params.submittedByName,
      details: {
        riskLevel,
        chainLength: chain.length,
        outputTypes: params.outputTypes,
        publishTargets: publishTargets.length,
      },
    });
    
    return request;
  }
  
  /**
   * Process an approval decision at the current step
   */
  static processApproval(params: {
    requestId: string;
    approverId: string;
    approverName: string;
    approverLevel: RoleLevel;
    decision: 'APPROVE' | 'REJECT';
    comments?: string;
  }): { request: ApprovalChainRequest; shouldAdvance: boolean; fullyApproved: boolean } {
    const request = chainRequests.get(params.requestId);
    if (!request) throw new Error('Approval chain request not found');
    if (request.status === 'APPROVED' || request.status === 'REJECTED' || request.status === 'PUBLISHED') {
      throw new Error(`Request is already ${request.status}`);
    }
    
    // Check deadline
    if (Date.now() > request.deadline) {
      request.status = 'EXPIRED';
      throw new Error('Approval chain has expired');
    }
    
    // Find current active step
    const activeStep = request.chain.find(s => s.status === 'ACTIVE');
    if (!activeStep) throw new Error('No active approval step');
    
    // Verify approver has sufficient level
    const approverNum = ROLE_LEVEL_HIERARCHY[params.approverLevel];
    const requiredNum = ROLE_LEVEL_HIERARCHY[activeStep.requiredLevel];
    if (approverNum < requiredNum) {
      throw new Error(`Insufficient role level. Required: ${activeStep.requiredRoleName}, Your level: ${params.approverLevel}`);
    }
    
    // Separation of duties check
    if (params.approverId === request.submittedBy) {
      throw new Error('You cannot approve your own content');
    }
    
    // Record decision
    activeStep.approverId = params.approverId;
    activeStep.approverName = params.approverName;
    activeStep.decision = params.decision;
    activeStep.decisionAt = Date.now();
    activeStep.comments = params.comments;
    activeStep.signatureHash = createSignatureHash(params.approverId, params.requestId, params.decision);
    activeStep.status = 'COMPLETED';
    
    const shouldAdvance = params.decision === 'APPROVE';
    let fullyApproved = false;
    
    if (params.decision === 'REJECT') {
      request.status = 'REJECTED';
      chainHistory.push({
        id: `ch-${Date.now()}`,
        timestamp: Date.now(),
        eventType: 'CHAIN_REJECTED',
        requestId: request.id,
        actor: params.approverName,
        details: { step: activeStep.stepNumber, reason: params.comments },
      });
    } else {
      // Find next step
      const nextStep = request.chain.find(s => s.status === 'PENDING');
      if (nextStep) {
        // Advance to next step
        nextStep.status = 'ACTIVE';
        request.currentStep = nextStep.stepNumber;
        request.status = 'IN_REVIEW';
        
        chainHistory.push({
          id: `ch-${Date.now()}`,
          timestamp: Date.now(),
          eventType: 'CHAIN_ADVANCED',
          requestId: request.id,
          actor: params.approverName,
          details: { 
            fromStep: activeStep.stepNumber, 
            toStep: nextStep.stepNumber,
            nextApprover: nextStep.requiredRoleName,
          },
        });
      } else {
        // All steps completed — fully approved
        request.status = 'APPROVED';
        fullyApproved = true;
        
        chainHistory.push({
          id: `ch-${Date.now()}`,
          timestamp: Date.now(),
          eventType: 'CHAIN_FULLY_APPROVED',
          requestId: request.id,
          actor: params.approverName,
          details: { 
            totalSteps: request.chain.length,
            approvals: request.chain.filter(s => s.decision === 'APPROVE').length,
          },
        });
      }
    }
    
    return { request, shouldAdvance, fullyApproved };
  }
  
  /**
   * Get all requests pending for a specific user (based on their role level)
   */
  static getPendingForUser(userId: string, userLevel: RoleLevel): ApprovalChainRequest[] {
    const userNum = ROLE_LEVEL_HIERARCHY[userLevel];
    return Array.from(chainRequests.values())
      .filter(r => {
        if (r.status !== 'FINALISED' && r.status !== 'IN_REVIEW') return false;
        // Check if there's an active step this user can handle
        const activeStep = r.chain.find(s => s.status === 'ACTIVE');
        if (!activeStep) return false;
        const requiredNum = ROLE_LEVEL_HIERARCHY[activeStep.requiredLevel];
        return userNum >= requiredNum && r.submittedBy !== userId; // Separation of duties
      });
  }
  
  /**
   * Get all requests (for admin/audit view)
   */
  static getAllRequests(): ApprovalChainRequest[] {
    return Array.from(chainRequests.values()).sort((a, b) => b.submittedAt - a.submittedAt);
  }
  
  /**
   * Get a specific request
   */
  static getRequest(requestId: string): ApprovalChainRequest | undefined {
    return chainRequests.get(requestId);
  }
  
  /**
   * Get requests by status
   */
  static getRequestsByStatus(status: ChainStatus): ApprovalChainRequest[] {
    return Array.from(chainRequests.values())
      .filter(r => r.status === status)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }
  
  /**
   * Get chain history
   */
  static getHistory(requestId?: string) {
    if (requestId) {
      return chainHistory.filter(h => h.requestId === requestId).sort((a, b) => b.timestamp - a.timestamp);
    }
    return [...chainHistory].sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Get statistics
   */
  static getStats() {
    const all = Array.from(chainRequests.values());
    return {
      total: all.length,
      draft: all.filter(r => r.status === 'DRAFT').length,
      finalised: all.filter(r => r.status === 'FINALISED').length,
      inReview: all.filter(r => r.status === 'IN_REVIEW').length,
      approved: all.filter(r => r.status === 'APPROVED').length,
      rejected: all.filter(r => r.status === 'REJECTED').length,
      published: all.filter(r => r.status === 'PUBLISHED').length,
      expired: all.filter(r => r.status === 'EXPIRED').length,
    };
  }
  
  /**
   * Mark as published after auto-publish
   */
  static markPublished(requestId: string, results: PublishResult[]): ApprovalChainRequest {
    const request = chainRequests.get(requestId);
    if (!request) throw new Error('Request not found');
    
    request.status = results.every(r => r.success) ? 'PUBLISHED' : 'PUBLISH_FAILED';
    request.publishedAt = Date.now();
    request.publishResults = results;
    
    chainHistory.push({
      id: `ch-${Date.now()}`,
      timestamp: Date.now(),
      eventType: request.status === 'PUBLISHED' ? 'AUTO_PUBLISHED' : 'PUBLISH_FAILED',
      requestId: request.id,
      actor: 'SYSTEM',
      details: { results },
    });
    
    return request;
  }
  
  /**
   * Get deadline duration based on risk level
   */
  private static getDeadlineForRisk(risk: ContentRiskLevel): number {
    switch (risk) {
      case 'CRITICAL': return 4 * 60 * 60 * 1000;   // 4 hours
      case 'HIGH': return 24 * 60 * 60 * 1000;       // 24 hours
      case 'MEDIUM': return 48 * 60 * 60 * 1000;     // 48 hours
      case 'LOW': return 72 * 60 * 60 * 1000;        // 72 hours
    }
  }
}

function createSignatureHash(approverId: string, requestId: string, decision: string): string {
  const data = `${approverId}:${requestId}:${decision}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}
