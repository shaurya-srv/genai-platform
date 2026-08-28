/**
 * Blockchain Verification Service
 * Handles on-chain recording, verification, and audit trail management
 * Uses Ethereum-compatible blockchain for immutable record keeping
 */

import { createHash, randomUUID } from 'crypto';

// Types
export interface TransformationRecord {
  id: string;
  contentHash: string;
  outputHash: string;
  outputType: string;
  operator: string;
  timestamp: number;
  verified: boolean;
  complianceBadges: string[];
  threatLevel: string;
  approvalCount: number;
  requiredApprovals: number;
}

export interface AuditEntry {
  id: string;
  transformationId: string;
  action: string;
  actor: string;
  timestamp: number;
  metadata: string;
  txHash: string;
}

export interface ApprovalRecord {
  id: string;
  transformationId: string;
  approver: string;
  role: string;
  timestamp: number;
  approved: boolean;
  txHash: string;
}

// In-memory blockchain simulation (replace with actual Ethereum RPC in production)
class BlockchainService {
  private records: Map<string, TransformationRecord> = new Map();
  private auditTrail: Map<string, AuditEntry[]> = new Map();
  private approvalChains: Map<string, ApprovalRecord[]> = new Map();
  private publishedOutputs: Set<string> = new Set();
  private blockNumber: number = 1000000;

  /**
   * Generate SHA-256 hash of content
   */
  static hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate a simulated transaction hash
   */
  private generateTxHash(): string {
    const data = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    return '0x' + createHash('sha256').update(data).digest('hex');
  }

  /**
   * Record a new content transformation on-chain
   */
  async recordTransformation(
    sourceContent: string,
    outputContent: string,
    outputType: string,
    operator: string,
    threatLevel: string = 'LOW'
  ): Promise<TransformationRecord> {
    const id = randomUUID();
    const contentHash = BlockchainService.hashContent(sourceContent);
    const outputHash = BlockchainService.hashContent(outputContent);

    const record: TransformationRecord = {
      id,
      contentHash,
      outputHash,
      outputType,
      operator,
      timestamp: Date.now(),
      verified: false,
      complianceBadges: [],
      threatLevel,
      approvalCount: 0,
      requiredApprovals: 2, // Multi-sig: need 2 approvals
    };

    this.records.set(id, record);
    this.blockNumber++;

    // Log audit entry
    this.addAuditEntry(id, 'CREATED', operator, `Transformation created for ${outputType}`);

    return record;
  }

  /**
   * Verify transformation authenticity by comparing hashes
   */
  async verifyTransformation(id: string, outputHash: string): Promise<boolean> {
    const record = this.records.get(id);
    if (!record) throw new Error('Transformation not found');

    const isValid = record.outputHash === outputHash;
    record.verified = isValid;

    this.addAuditEntry(
      id,
      isValid ? 'VERIFIED' : 'VERIFICATION_FAILED',
      'system',
      `Hash verification: ${isValid ? 'PASS' : 'FAIL'}`
    );

    return isValid;
  }

  /**
   * Add compliance badge to a transformation
   */
  async addComplianceBadge(id: string, badge: string, auditor: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) throw new Error('Transformation not found');

    record.complianceBadges.push(badge);
    this.addAuditEntry(id, 'COMPLIANCE_ADDED', auditor, `Badge: ${badge}`);
  }

  /**
   * Record approval in multi-sig chain
   */
  async recordApproval(
    id: string,
    approver: string,
    role: string,
    approved: boolean
  ): Promise<ApprovalRecord> {
    const record = this.records.get(id);
    if (!record) throw new Error('Transformation not found');

    const approval: ApprovalRecord = {
      id: randomUUID(),
      transformationId: id,
      approver,
      role,
      timestamp: Date.now(),
      approved,
      txHash: this.generateTxHash(),
    };

    const chain = this.approvalChains.get(id) || [];
    chain.push(approval);
    this.approvalChains.set(id, chain);

    if (approved) {
      record.approvalCount++;
    }

    this.addAuditEntry(
      id,
      approved ? 'APPROVED' : 'REJECTED',
      approver,
      `Role: ${role} | Decision: ${approved ? 'Approve' : 'Reject'}`
    );

    return approval;
  }

  /**
   * Check if transformation has enough approvals
   */
  isFullyApproved(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;
    return record.approvalCount >= record.requiredApprovals;
  }

  /**
   * Publish output (prevents re-publication)
   */
  async publishOutput(id: string, publisher: string): Promise<boolean> {
    const record = this.records.get(id);
    if (!record) throw new Error('Transformation not found');
    if (!record.verified) throw new Error('Output not verified');
    if (this.publishedOutputs.has(id)) throw new Error('Already published');

    this.publishedOutputs.add(id);
    this.addAuditEntry(id, 'PUBLISHED', publisher, 'Output published to external platform');
    return true;
  }

  /**
   * Check if output is published
   */
  isPublished(id: string): boolean {
    return this.publishedOutputs.has(id);
  }

  /**
   * Get transformation record
   */
  getRecord(id: string): TransformationRecord | undefined {
    return this.records.get(id);
  }

  /**
   * Get approval chain
   */
  getApprovalChain(id: string): ApprovalRecord[] {
    return this.approvalChains.get(id) || [];
  }

  /**
   * Get audit trail
   */
  getAuditTrail(id: string): AuditEntry[] {
    return this.auditTrail.get(id) || [];
  }

  /**
   * Get all records for an operator
   */
  getOperatorRecords(operator: string): TransformationRecord[] {
    return Array.from(this.records.values()).filter(r => r.operator === operator);
  }

  /**
   * Get all records (admin view)
   */
  getAllRecords(): TransformationRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Add audit entry
   */
  private addAuditEntry(
    transformationId: string,
    action: string,
    actor: string,
    metadata: string
  ): void {
    const entry: AuditEntry = {
      id: randomUUID(),
      transformationId,
      action,
      actor,
      timestamp: Date.now(),
      metadata,
      txHash: this.generateTxHash(),
    };

    const trail = this.auditTrail.get(transformationId) || [];
    trail.push(entry);
    this.auditTrail.set(transformationId, trail);
  }

  /**
   * Get blockchain stats
   */
  getStats() {
    return {
      totalTransformations: this.records.size,
      totalAuditEntries: Array.from(this.auditTrail.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalApprovals: Array.from(this.approvalChains.values()).reduce((sum, arr) => sum + arr.length, 0),
      publishedOutputs: this.publishedOutputs.size,
      currentBlockNumber: this.blockNumber,
    };
  }
}

// Singleton instance
export const blockchain = new BlockchainService();
