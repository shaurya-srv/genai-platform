/**
 * SIEM Export Module
 * 
 * Exports audit logs in SIEM-compatible formats:
 * - CEF (Common Event Format) — syslog-compatible, used by ArcSight, QRadar, Splunk
 * - JSON — structured format for Elasticsearch, Logstash, generic SIEM ingestion
 * - CSV — spreadsheet-compatible for compliance reporting
 * 
 * CEF Format Reference:
 * CEF:Version|Vendor|Product|Version|SignatureID|Name|Severity|Extension
 */

import { AuditRecord, AuditEventType } from './audit-tracker';

// ==================== CEF SEVERITY MAPPING ====================

const RISK_TO_CEF_SEVERITY: Record<string, number> = {
  INFO: 0,
  LOW: 3,
  MEDIUM: 5,
  HIGH: 10,
};

const EVENT_TYPE_TO_SIGNATURE_ID: Record<string, string> = {
  TRANSFORMATION_REQUESTED: '9001001',
  TRANSFORMATION_COMPLETED: '9001002',
  CONTENT_UPLOADED: '9001003',
  CONTENT_PUBLISHED: '9001004',
  DLP_SCAN_COMPLETED: '9002001',
  COMPLIANCE_CHECK_COMPLETED: '9002002',
  THREAT_ANALYSIS_COMPLETED: '9002003',
  PROMPT_INJECTION_SCAN: '9002004',
  FILE_UPLOAD: '9001005',
  URL_FETCH: '9001006',
  APPROVAL_REQUESTED: '9003001',
  APPROVAL_GRANTED: '9003002',
  APPROVAL_REJECTED: '9003003',
  BLOCKCHAIN_RECORD_CREATED: '9004001',
  BLOCKCHAIN_VERIFICATION: '9004002',
  CHAIN_VERIFICATION: '9004003',
  ACCESS_GRANTED: '9005001',
  ACCESS_DENIED: '9005002',
  DATA_EXPORT: '9005003',
  USER_LOGIN: '9006001',
  USER_LOGOUT: '9006002',
  CONFIGURATION_CHANGED: '9007001',
  EMERGENCY_ACCESS: '9008001',
  SUSPICIOUS_ACTIVITY: '9009001',
};

const VENDOR = 'NTRO';
const PRODUCT = 'GenAI-Platform';
const VERSION = '2.0';

// ==================== CEF FORMATTER ====================

function escapeCEF(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/=/g, '\\=');
}

/**
 * Format a single audit record as a CEF line
 * CEF:0|NTRO|GenAI-Platform|2.0|<sigId>|<name>|<severity>|<extensions>
 */
export function formatCEF(record: AuditRecord): string {
  const sigId = EVENT_TYPE_TO_SIGNATURE_ID[record.eventType] || '9000000';
  const severity = RISK_TO_CEF_SEVERITY[record.riskLevel] || 0;
  const name = record.eventType.replace(/_/g, ' ');
  const timestamp = new Date(record.timestamp).toISOString();

  const extensions = [
    `rt=${timestamp}`,
    `src=${record.ipAddress || 'unknown'}`,
    `dhost=genai-platform`,
    `suser=${escapeCEF(record.actor)}`,
    `spriv=${escapeCEF(record.actorRole)}`,
    `cs1=${escapeCEF(record.action)}`,
    `cs1Label=Action`,
    `cs2=${escapeCEF(record.targetId)}`,
    `cs2Label=TargetId`,
    `cs3=${escapeCEF(record.targetType)}`,
    `cs3Label=TargetType`,
    `cs4=${escapeCEF(record.riskLevel)}`,
    `cs4Label=RiskLevel`,
    `cs5=${escapeCEF(record.userAgent || 'unknown')}`,
    `cs5Label=UserAgent`,
    `cn1=${record.details ? Object.keys(record.details).length : 0}`,
    `cn1Label=DetailFields`,
    `flexString1=${escapeCEF(JSON.stringify(record.details || {}))}`,
    `flexString1Label=Details`,
  ].join(' ');

  return `CEF:0|${VENDOR}|${PRODUCT}|${VERSION}|${sigId}|${escapeCEF(name)}|${severity}|${extensions}`;
}

// ==================== JSON FORMATTER ====================

/**
 * Format audit records as structured JSON for SIEM ingestion
 * Compatible with Elasticsearch, Logstash, and generic JSON-based SIEMs
 */
export function formatJSON(records: AuditRecord[], pretty: boolean = true): string {
  const envelope = {
    exportMetadata: {
      format: 'JSON',
      vendor: VENDOR,
      product: PRODUCT,
      version: VERSION,
      exportTime: new Date().toISOString(),
      recordCount: records.length,
      siemCompatibility: ['Elasticsearch', 'Logstash', 'Splunk HEC', 'Sentinel', ' Chronicle'],
    },
    events: records.map(record => ({
      '@timestamp': new Date(record.timestamp).toISOString(),
      '@version': '1',
      event: {
        id: record.id,
        type: record.eventType,
        category: categorizeEventType(record.eventType),
        outcome: record.riskLevel === 'HIGH' ? 'failure' : 'success',
        severity: RISK_TO_CEF_SEVERITY[record.riskLevel],
        module: 'genai-platform',
      },
      host: { name: 'genai-platform' },
      source: { ip: record.ipAddress || '127.0.0.1' },
      user: {
        name: record.actor,
        roles: [record.actorRole],
      },
      audit: {
        target: { id: record.targetId, type: record.targetType },
        action: record.action,
        riskLevel: record.riskLevel,
        details: record.details,
        blockchainTxHash: record.blockchainTxHash || null,
      },
      tags: buildTags(record),
    })),
  };

  return pretty ? JSON.stringify(envelope, null, 2) : JSON.stringify(envelope);
}

// ==================== CSV FORMATTER ====================

/**
 * Format audit records as CSV for spreadsheet/compliance reporting
 */
export function formatCSV(records: AuditRecord[]): string {
  const headers = [
    'Timestamp', 'Event ID', 'Event Type', 'Category', 'Actor', 'Actor Role',
    'Target ID', 'Target Type', 'Action', 'Risk Level', 'IP Address',
    'User Agent', 'Blockchain Tx Hash', 'Details',
  ];

  const rows = records.map(r => [
    new Date(r.timestamp).toISOString(),
    r.id,
    r.eventType,
    categorizeEventType(r.eventType),
    r.actor,
    r.actorRole,
    r.targetId,
    r.targetType,
    `"${(r.action || '').replace(/"/g, '""')}"`,
    r.riskLevel,
    r.ipAddress || '',
    `"${(r.userAgent || '').replace(/"/g, '""')}"`,
    r.blockchainTxHash || '',
    `"${JSON.stringify(r.details || {}).replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ==================== SYSLOG FORMATTER ====================

/**
 * Format as syslog-compatible lines (RFC 5424)
 * Useful for forwarding to syslog-ng, rsyslog, or Fluentd
 */
export function formatSyslog(records: AuditRecord[]): string {
  return records.map(record => {
    const timestamp = new Date(record.timestamp).toISOString();
    const severity = record.riskLevel === 'HIGH' ? 2 : record.riskLevel === 'MEDIUM' ? 4 : 6;
    const facility = 16; // local0
    const priority = facility * 8 + severity;
    const tag = `genai-platform[${record.eventType.toLowerCase()}]`;

    return `<${priority}>1 ${timestamp} genai-platform ${tag} - - - ${JSON.stringify({
      eventId: record.id,
      eventType: record.eventType,
      actor: record.actor,
      actorRole: record.actorRole,
      action: record.action,
      riskLevel: record.riskLevel,
      target: { id: record.targetId, type: record.targetType },
      details: record.details,
    })}`;
  }).join('\n');
}

// ==================== HELPERS ====================

function categorizeEventType(eventType: AuditEventType): string {
  if (eventType.startsWith('TRANSFORMATION') || eventType === 'CONTENT_UPLOADED' || eventType === 'CONTENT_PUBLISHED' || eventType === 'FILE_UPLOAD' || eventType === 'URL_FETCH') return 'content';
  if (eventType.startsWith('DLP') || eventType.startsWith('THREAT') || eventType.startsWith('COMPLIANCE') || eventType.startsWith('PROMPT')) return 'security';
  if (eventType.startsWith('APPROVAL')) return 'approval';
  if (eventType.startsWith('BLOCKCHAIN') || eventType === 'CHAIN_VERIFICATION') return 'blockchain';
  if (eventType.startsWith('ACCESS') || eventType.startsWith('USER')) return 'auth';
  if (eventType.startsWith('CONFIGURATION') || eventType === 'EMERGENCY_ACCESS') return 'admin';
  if (eventType === 'SUSPICIOUS_ACTIVITY' || eventType === 'DATA_EXPORT') return 'alert';
  return 'other';
}

function buildTags(record: AuditRecord): string[] {
  const tags: string[] = ['genai-platform', `risk:${record.riskLevel.toLowerCase()}`];
  if (record.riskLevel === 'HIGH') tags.push('siem-alert', 'requires-investigation');
  if (record.eventType === 'ACCESS_DENIED') tags.push('auth-failure');
  if (record.eventType === 'SUSPICIOUS_ACTIVITY') tags.push('suspicious', 'siem-alert');
  if (record.eventType === 'DATA_EXPORT') tags.push('data-exfil-watch');
  if (record.eventType.includes('APPROVAL')) tags.push('workflow');
  if (record.eventType.includes('BLOCKCHAIN')) tags.push('provenance');
  return tags;
}

// ==================== MAIN EXPORT FUNCTION ====================

export type SIEMFormat = 'cef' | 'json' | 'csv' | 'syslog';

export interface SIEMExportResult {
  format: SIEMFormat;
  content: string;
  mimeType: string;
  fileName: string;
  recordCount: number;
}

/**
 * Export audit records in the specified SIEM format
 */
export function exportAuditLogs(
  records: AuditRecord[],
  format: SIEMFormat,
  filters?: {
    startDate?: number;
    endDate?: number;
    eventTypes?: AuditEventType[];
    riskLevels?: string[];
    actors?: string[];
  }
): SIEMExportResult {
  // Apply filters
  let filtered = [...records];

  if (filters) {
    if (filters.startDate) filtered = filtered.filter(r => r.timestamp >= filters.startDate!);
    if (filters.endDate) filtered = filtered.filter(r => r.timestamp <= filters.endDate!);
    if (filters.eventTypes?.length) filtered = filtered.filter(r => filters.eventTypes!.includes(r.eventType));
    if (filters.riskLevels?.length) filtered = filtered.filter(r => filters.riskLevels!.includes(r.riskLevel));
    if (filters.actors?.length) filtered = filtered.filter(r => filters.actors!.includes(r.actor));
  }

  // Sort chronologically
  filtered.sort((a, b) => a.timestamp - b.timestamp);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  switch (format) {
    case 'cef':
      return {
        format: 'cef',
        content: filtered.map(formatCEF).join('\n'),
        mimeType: 'text/plain',
        fileName: `audit-export-${timestamp}.cef`,
        recordCount: filtered.length,
      };
    case 'json':
      return {
        format: 'json',
        content: formatJSON(filtered),
        mimeType: 'application/json',
        fileName: `audit-export-${timestamp}.json`,
        recordCount: filtered.length,
      };
    case 'csv':
      return {
        format: 'csv',
        content: formatCSV(filtered),
        mimeType: 'text/csv',
        fileName: `audit-export-${timestamp}.csv`,
        recordCount: filtered.length,
      };
    case 'syslog':
      return {
        format: 'syslog',
        content: formatSyslog(filtered),
        mimeType: 'text/plain',
        fileName: `audit-export-${timestamp}.log`,
        recordCount: filtered.length,
      };
  }
}
