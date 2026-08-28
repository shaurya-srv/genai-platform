/**
 * Central Audit Tracker
 * Maintains a complete record of all system activities
 * Tracks who requested what, when, and prevents data leaks
 */

export interface AuditRecord {
  id: string;
  timestamp: number;
  eventType: AuditEventType;
  actor: string;
  actorRole: string;
  targetId: string;
  targetType: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  riskLevel: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
  blockchainTxHash?: string;
}

export type AuditEventType =
  | 'TRANSFORMATION_REQUESTED'
  | 'TRANSFORMATION_COMPLETED'
  | 'CONTENT_UPLOADED'
  | 'CONTENT_PUBLISHED'
  | 'DLP_SCAN_COMPLETED'
  | 'COMPLIANCE_CHECK_COMPLETED'
  | 'THREAT_ANALYSIS_COMPLETED'
  | 'PROMPT_INJECTION_SCAN'
  | 'FILE_UPLOAD'
  | 'URL_FETCH'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'BLOCKCHAIN_RECORD_CREATED'
  | 'BLOCKCHAIN_VERIFICATION'
  | 'ACCESS_GRANTED'
  | 'ACCESS_DENIED'
  | 'DATA_EXPORT'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'CONFIGURATION_CHANGED'
  | 'EMERGENCY_ACCESS'
  | 'SUSPICIOUS_ACTIVITY'
  | 'CHAIN_VERIFICATION';

// In-memory store
const auditLog: AuditRecord[] = [];
const ALERT_THRESHOLDS = {
  failedLogins: 5,
  dataExports: 10,
  suspiciousActivities: 3,
  timeWindowMinutes: 15,
};

export class AuditTracker {
  /**
   * Record an audit event
   */
  static record(event: Omit<AuditRecord, 'id' | 'timestamp'>): AuditRecord {
    const record: AuditRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...event,
    };

    auditLog.push(record);

    // Check for suspicious patterns
    AuditTracker.checkForSuspiciousPatterns(record);

    return record;
  }

  /**
   * Get all audit records
   */
  static getAll(): AuditRecord[] {
    return [...auditLog].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get records for a specific target
   */
  static getForTarget(targetId: string): AuditRecord[] {
    return auditLog.filter(r => r.targetId === targetId);
  }

  /**
   * Get records for a specific actor
   */
  static getForActor(actor: string): AuditRecord[] {
    return auditLog.filter(r => r.actor === actor);
  }

  /**
   * Get records by event type
   */
  static getByType(eventType: AuditEventType): AuditRecord[] {
    return auditLog.filter(r => r.eventType === eventType);
  }

  /**
   * Get records within a time window
   */
  static getInTimeWindow(minutes: number): AuditRecord[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return auditLog.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Get high-risk records
   */
  static getHighRisk(): AuditRecord[] {
    return auditLog.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'MEDIUM');
  }

  /**
   * Generate compliance report
   */
  static generateComplianceReport(startDate: number, endDate: number): {
    period: { start: string; end: string };
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByRisk: Record<string, number>;
    uniqueActors: number;
    uniqueTargets: number;
    highRiskEvents: number;
    complianceScore: number;
  } {
    const records = auditLog.filter(
      r => r.timestamp >= startDate && r.timestamp <= endDate
    );

    const eventsByType: Record<string, number> = {};
    const eventsByRisk: Record<string, number> = {};
    const actors = new Set<string>();
    const targets = new Set<string>();

    for (const record of records) {
      eventsByType[record.eventType] = (eventsByType[record.eventType] || 0) + 1;
      eventsByRisk[record.riskLevel] = (eventsByRisk[record.riskLevel] || 0) + 1;
      actors.add(record.actor);
      targets.add(record.targetId);
    }

    const highRiskEvents = records.filter(r => r.riskLevel === 'HIGH').length;
    const complianceScore = Math.max(0, 100 - highRiskEvents * 10);

    return {
      period: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
      },
      totalEvents: records.length,
      eventsByType,
      eventsByRisk,
      uniqueActors: actors.size,
      uniqueTargets: targets.size,
      highRiskEvents,
      complianceScore,
    };
  }

  /**
   * Get audit statistics
   */
  static getStats() {
    const records = auditLog;
    const last24h = records.filter(r => r.timestamp >= Date.now() - 24 * 60 * 60 * 1000);
    const lastHour = records.filter(r => r.timestamp >= Date.now() - 60 * 60 * 1000);

    return {
      totalRecords: records.length,
      last24Hours: last24h.length,
      lastHour: lastHour.length,
      highRisk: records.filter(r => r.riskLevel === 'HIGH').length,
      mediumRisk: records.filter(r => r.riskLevel === 'MEDIUM').length,
      uniqueActors: new Set(records.map(r => r.actor)).size,
      alerts: AuditTracker.getActiveAlerts(),
    };
  }

  /**
   * Check for suspicious activity patterns
   */
  private static checkForSuspiciousPatterns(record: AuditRecord): void {
    const windowMs = ALERT_THRESHOLDS.timeWindowMinutes * 60 * 1000;
    const windowStart = Date.now() - windowMs;

    // Check for failed access patterns
    const recentAccessDenied = auditLog.filter(
      r => r.eventType === 'ACCESS_DENIED' && r.timestamp >= windowStart
    );
    if (recentAccessDenied.length >= ALERT_THRESHOLDS.failedLogins) {
      AuditTracker.record({
        eventType: 'SUSPICIOUS_ACTIVITY',
        actor: 'SYSTEM',
        actorRole: 'SYSTEM',
        targetId: record.targetId,
        targetType: 'ALERT',
        action: 'Multiple failed access attempts detected',
        details: { count: recentAccessDenied.length, window: ALERT_THRESHOLDS.timeWindowMinutes },
        ipAddress: '0.0.0.0',
        userAgent: 'SYSTEM',
        riskLevel: 'HIGH',
      });
    }

    // Check for excessive data exports
    const recentExports = auditLog.filter(
      r => r.eventType === 'DATA_EXPORT' && r.timestamp >= windowStart
    );
    if (recentExports.length >= ALERT_THRESHOLDS.dataExports) {
      AuditTracker.record({
        eventType: 'SUSPICIOUS_ACTIVITY',
        actor: 'SYSTEM',
        actorRole: 'SYSTEM',
        targetId: record.targetId,
        targetType: 'ALERT',
        action: 'Excessive data export activity detected',
        details: { count: recentExports.length, window: ALERT_THRESHOLDS.timeWindowMinutes },
        ipAddress: '0.0.0.0',
        userAgent: 'SYSTEM',
        riskLevel: 'HIGH',
      });
    }
  }

  /**
   * Get active alerts
   */
  static getActiveAlerts(): AuditRecord[] {
    const windowMs = 60 * 60 * 1000; // Last hour
    const windowStart = Date.now() - windowMs;
    return auditLog.filter(
      r => r.eventType === 'SUSPICIOUS_ACTIVITY' && r.timestamp >= windowStart
    );
  }
}
