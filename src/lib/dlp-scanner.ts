/**
 * Data Loss Prevention (DLP) Scanner
 * Scans content for sensitive information before transformation and publication
 * Detects PII, classified data, credentials, and other sensitive patterns
 */

export interface DLPScanResult {
  safe: boolean;
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: DLPFinding[];
  sanitizedContent: string;
  scanTimestamp: number;
  patternsMatched: number;
}

export interface DLPFinding {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchedText: string;
  position: number;
  recommendation: string;
  category: string;
}

// DLP Pattern definitions
const DLP_PATTERNS: Array<{
  name: string;
  category: string;
  pattern: RegExp;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  replacement: string;
  recommendation: string;
}> = [
  // PII - Personally Identifiable Information
  {
    name: 'Aadhaar Number',
    category: 'PII',
    pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    severity: 'CRITICAL',
    replacement: '[AADHAAR REDACTED]',
    recommendation: 'Remove Aadhaar number immediately - classified as sensitive PII under Aadhaar Act',
  },
  {
    name: 'PAN Number',
    category: 'PII',
    pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    severity: 'CRITICAL',
    replacement: '[PAN REDACTED]',
    recommendation: 'Remove PAN number - financial PII requiring protection',
  },
  {
    name: 'Indian Phone Number',
    category: 'PII',
    pattern: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g,
    severity: 'HIGH',
    replacement: '[PHONE REDACTED]',
    recommendation: 'Remove personal phone number before publication',
  },
  {
    name: 'Email Address',
    category: 'PII',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'MEDIUM',
    replacement: '[EMAIL REDACTED]',
    recommendation: 'Consider removing personal email addresses',
  },
  {
    name: 'Passport Number',
    category: 'PII',
    pattern: /\b[A-Z]\d{8}\b/g,
    severity: 'HIGH',
    replacement: '[PASSPORT REDACTED]',
    recommendation: 'Remove passport number - government ID requiring protection',
  },
  // Financial Data
  {
    name: 'Credit/Debit Card Number',
    category: 'Financial',
    pattern: /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    severity: 'CRITICAL',
    replacement: '[CARD NUMBER REDACTED]',
    recommendation: 'CRITICAL: Financial data detected - must be removed before any publication',
  },
  {
    name: 'Bank Account Number',
    category: 'Financial',
    pattern: /\b\d{9,18}\b/g,
    severity: 'HIGH',
    replacement: '[ACCOUNT REDACTED]',
    recommendation: 'Potential bank account number detected - review and redact',
  },
  {
    name: 'IFSC Code',
    category: 'Financial',
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    severity: 'HIGH',
    replacement: '[IFSC REDACTED]',
    recommendation: 'Remove IFSC code - financial institution identifier',
  },
  // Credentials & Secrets
  {
    name: 'Password Pattern',
    category: 'Credentials',
    pattern: /(?:password|passwd|pwd|secret|key|token|api[_-]?key)\s*[:=]\s*\S+/gi,
    severity: 'CRITICAL',
    replacement: '[CREDENTIAL REDACTED]',
    recommendation: 'CRITICAL: Credentials detected - immediate action required',
  },
  {
    name: 'AWS Access Key',
    category: 'Credentials',
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/g,
    severity: 'CRITICAL',
    replacement: '[AWS KEY REDACTED]',
    recommendation: 'CRITICAL: AWS access key detected - rotate immediately',
  },
  {
    name: 'Private Key Block',
    category: 'Credentials',
    pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    replacement: '[PRIVATE KEY REDACTED]',
    recommendation: 'CRITICAL: Private key detected - security breach risk',
  },
  // Classification Markers
  {
    name: 'Classification: TOP SECRET',
    category: 'Classification',
    pattern: /\b(TOP\s*SECRET|TS\/SCI|TS\/NOFORN)\b/gi,
    severity: 'CRITICAL',
    replacement: '[CLASSIFIED CONTENT REDACTED]',
    recommendation: 'CRITICAL: Top Secret classification detected - DO NOT transform or publish',
  },
  {
    name: 'Classification: SECRET',
    category: 'Classification',
    pattern: /\b(SECRET|CONFIDENTIAL)\b/gi,
    severity: 'HIGH',
    replacement: '[CLASSIFIED CONTENT REDACTED]',
    recommendation: 'Classified content detected - requires authorization before transformation',
  },
  {
    name: 'Classification: RESTRICTED',
    category: 'Classification',
    pattern: /\b(RESTRICTED|RESTRICTED\s*DISTRIBUTION|FOR\s*OFFICIAL\s*USE\s*ONLY)\b/gi,
    severity: 'HIGH',
    replacement: '[RESTRICTED CONTENT FLAGGED]',
    recommendation: 'Restricted content detected - verify distribution authorization',
  },
  // Network Information
  {
    name: 'IP Address',
    category: 'Network',
    pattern: /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    severity: 'MEDIUM',
    replacement: '[IP REDACTED]',
    recommendation: 'Internal IP addresses detected - review before publication',
  },
  {
    name: 'Internal URL',
    category: 'Network',
    pattern: /\bhttps?:\/\/(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|localhost|intranet\.|internal\.|\.gov\.in|\.nic\.in)\S*/gi,
    severity: 'HIGH',
    replacement: '[INTERNAL URL REDACTED]',
    recommendation: 'Internal/government URL detected - do not publish externally',
  },
  // Geolocation
  {
    name: 'GPS Coordinates',
    category: 'Geolocation',
    pattern: /\b[-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?)\s*,\s*[-+]?(?:1(?:[0-7]?\d(?:\.\d+)?|80(?:\.0+)?|[89]\d(?:\.\d+)?|0(?:\.\d+)?)|[1-9]?\d(?:\.\d+)?)\b/g,
    severity: 'MEDIUM',
    recommendation: 'GPS coordinates detected - consider if location disclosure is appropriate',
    replacement: '[LOCATION REDACTED]',
  },
];

export class DLPScanner {
  /**
   * Scan content for sensitive data
   */
  static scan(content: string): DLPScanResult {
    const findings: DLPFinding[] = [];
    let sanitizedContent = content;

    for (const rule of DLP_PATTERNS) {
      const matches = content.matchAll(rule.pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          findings.push({
            id: crypto.randomUUID(),
            type: rule.name,
            severity: rule.severity,
            matchedText: match[0].substring(0, 20) + (match[0].length > 20 ? '...' : ''),
            position: match.index,
            recommendation: rule.recommendation,
            category: rule.category,
          });

          // Sanitize the content
          sanitizedContent = sanitizedContent.replace(match[0], rule.replacement);
        }
      }
    }

    // Determine overall risk level
    const riskLevel = DLPScanner.calculateRiskLevel(findings);

    return {
      safe: findings.length === 0 || riskLevel === 'SAFE',
      riskLevel,
      findings,
      sanitizedContent,
      scanTimestamp: Date.now(),
      patternsMatched: findings.length,
    };
  }

  /**
   * Calculate overall risk level from findings
   */
  private static calculateRiskLevel(findings: DLPFinding[]): DLPScanResult['riskLevel'] {
    if (findings.length === 0) return 'SAFE';

    const maxSeverity = findings.reduce((max, f) => {
      const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      return levels.indexOf(f.severity) > levels.indexOf(max) ? f.severity : max;
    }, 'LOW' as DLPFinding['severity']);

    return maxSeverity;
  }

  /**
   * Get DLP statistics
   */
  static getStats(results: DLPScanResult[]) {
    const allFindings = results.flatMap(r => r.findings);
    return {
      totalScans: results.length,
      totalFindings: allFindings.length,
      byCategory: allFindings.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: allFindings.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      safeCount: results.filter(r => r.safe).length,
      unsafeCount: results.filter(r => !r.safe).length,
    };
  }
}
