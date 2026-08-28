/**
 * Compliance Checker
 * Validates content against regulatory frameworks and compliance standards
 * Supports: IT Act 2000, DPDP Act 2023, GDPR, SOC2, ISO 27001
 */

export interface ComplianceResult {
  compliant: boolean;
  score: number; // 0-100
  badges: ComplianceBadge[];
  violations: ComplianceViolation[];
  recommendations: string[];
  frameworks: string[];
}

export interface ComplianceBadge {
  id: string;
  name: string;
  framework: string;
  description: string;
  earned: boolean;
  criteria: string;
  icon: string;
}

export interface ComplianceViolation {
  id: string;
  framework: string;
  rule: string;
  severity: 'INFO' | 'WARNING' | 'VIOLATION' | 'CRITICAL';
  description: string;
  remediation: string;
}

// Compliance framework rules
const COMPLIANCE_RULES: Array<{
  framework: string;
  rule: string;
  check: (content: string) => boolean;
  severity: ComplianceViolation['severity'];
  remediation: string;
}> = [
  // India IT Act 2000
  {
    framework: 'IT Act 2000',
    rule: 'Section 43A - Reasonable Security Practices',
    check: (content) => !/(?:no\s+security|security\s+optional|skip\s+verification)/gi.test(content),
    severity: 'WARNING',
    remediation: 'Ensure reasonable security practices are documented in content',
  },
  {
    framework: 'IT Act 2000',
    rule: 'Section 72A - Privacy Protection',
    check: (content) => !/\b(?:share\s+personal|sell\s+data|no\s+privacy)\b/gi.test(content),
    severity: 'VIOLATION',
    remediation: 'Content must not suggest unauthorized sharing of personal data',
  },
  // DPDP Act 2023 (Digital Personal Data Protection)
  {
    framework: 'DPDP Act 2023',
    rule: 'Data Fiduciary Obligations',
    check: (content) => !/\b(?:collect\s+without\s+consent|no\s+consent\s+needed|bypass\s+consent)\b/gi.test(content),
    severity: 'CRITICAL',
    remediation: 'All data collection must have valid consent under DPDP Act',
  },
  {
    framework: 'DPDP Act 2023',
    rule: 'Purpose Limitation',
    check: (content) => !/\b(?:any\s+purpose|unlimited\s+use|no\s+restriction)\b/gi.test(content),
    severity: 'WARNING',
    remediation: 'Data processing must be limited to the stated purpose',
  },
  {
    framework: 'DPDP Act 2023',
    rule: 'Data Retention Limits',
    check: (content) => !/\b(?:keep\s+forever|no\s+retention\s+limit|indefinite\s+storage)\b/gi.test(content),
    severity: 'WARNING',
    remediation: 'Define clear data retention periods as required by DPDP Act',
  },
  // GDPR
  {
    framework: 'GDPR',
    rule: 'Article 5 - Data Minimization',
    check: (content) => !/\b(?:collect\s+everything|all\s+data|no\s+limit\s+collection)\b/gi.test(content),
    severity: 'VIOLATION',
    remediation: 'Apply data minimization principle - collect only necessary data',
  },
  {
    framework: 'GDPR',
    rule: 'Article 17 - Right to Erasure',
    check: (content) => !/\b(?:never\s+delete|no\s+deletion|permanent\s+without\s+consent)\b/gi.test(content),
    severity: 'VIOLATION',
    remediation: 'Ensure mechanisms for data erasure requests are in place',
  },
  // SOC 2
  {
    framework: 'SOC 2',
    rule: 'CC6.1 - Logical Access Controls',
    check: (content) => !/\b(?:everyone\s+has\s+access|no\s+access\s+control|public\s+all)\b/gi.test(content),
    severity: 'WARNING',
    remediation: 'Implement proper access controls as per SOC 2 requirements',
  },
  // ISO 27001
  {
    framework: 'ISO 27001',
    rule: 'A.12 - Operations Security',
    check: (content) => !/\b(?:no\s+logging|skip\s+audit|ignore\s+logs)\b/gi.test(content),
    severity: 'WARNING',
    remediation: 'Maintain operational security logging and audit trails',
  },
  // General Content Safety
  {
    framework: 'Content Safety',
    rule: 'No Harmful Content',
    check: (content) => !/\b(?:hack\s+into|illegal\s+access|bypass\s+security|exploit\s+vulnerability)\b/gi.test(content),
    severity: 'CRITICAL',
    remediation: 'Content must not promote illegal activities or unauthorized access',
  },
  {
    framework: 'Content Safety',
    rule: 'No Misinformation Markers',
    check: (content) => !/\b(?:guaranteed\s+returns|100%\s+accurate|never\s+fails|always\s+works)\b/gi.test(content),
    severity: 'INFO',
    remediation: 'Avoid absolute claims that may constitute misinformation',
  },
];

// Compliance badge definitions
const BADGE_DEFINITIONS: Array<{
  name: string;
  framework: string;
  description: string;
  criteria: string;
  icon: string;
  check: (content: string) => boolean;
}> = [
  {
    name: '🇮🇳 IT Act Compliant',
    framework: 'IT Act 2000',
    description: 'Content complies with Indian Information Technology Act',
    criteria: 'No violations of IT Act 2000 provisions',
    icon: '🇮🇳',
    check: (content) => {
      const violations = COMPLIANCE_RULES.filter(r => r.framework === 'IT Act 2000' && !r.check(content));
      return violations.length === 0;
    },
  },
  {
    name: '🛡️ DPDP Compliant',
    framework: 'DPDP Act 2023',
    description: 'Content adheres to Digital Personal Data Protection Act',
    criteria: 'No violations of DPDP Act 2023 provisions',
    icon: '🛡️',
    check: (content) => {
      const violations = COMPLIANCE_RULES.filter(r => r.framework === 'DPDP Act 2023' && !r.check(content));
      return violations.length === 0;
    },
  },
  {
    name: '🇪🇺 GDPR Ready',
    framework: 'GDPR',
    description: 'Content meets GDPR compliance standards',
    criteria: 'No violations of GDPR articles',
    icon: '🇪🇺',
    check: (content) => {
      const violations = COMPLIANCE_RULES.filter(r => r.framework === 'GDPR' && !r.check(content));
      return violations.length === 0;
    },
  },
  {
    name: '🔒 SOC 2 Aligned',
    framework: 'SOC 2',
    description: 'Content aligned with SOC 2 trust service criteria',
    criteria: 'No violations of SOC 2 criteria',
    icon: '🔒',
    check: (content) => {
      const violations = COMPLIANCE_RULES.filter(r => r.framework === 'SOC 2' && !r.check(content));
      return violations.length === 0;
    },
  },
  {
    name: '📋 ISO 27001',
    framework: 'ISO 27001',
    description: 'Content meets ISO 27001 information security standards',
    criteria: 'No violations of ISO 27001 Annex A controls',
    icon: '📋',
    check: (content) => {
      const violations = COMPLIANCE_RULES.filter(r => r.framework === 'ISO 27001' && !r.check(content));
      return violations.length === 0;
    },
  },
  {
    name: '✅ Content Safe',
    framework: 'Content Safety',
    description: 'Content is safe for public distribution',
    criteria: 'No harmful content or misinformation markers',
    icon: '✅',
    check: (content) => {
      const violations = COMPLIANCE_RULES.filter(r => r.framework === 'Content Safety' && !r.check(content));
      return violations.length === 0;
    },
  },
];

export class ComplianceChecker {
  /**
   * Check content against all compliance frameworks
   */
  static check(content: string, frameworks?: string[]): ComplianceResult {
    const applicableRules = frameworks
      ? COMPLIANCE_RULES.filter(r => frameworks.includes(r.framework))
      : COMPLIANCE_RULES;

    const violations: ComplianceViolation[] = [];
    let ruleCount = 0;

    for (const rule of applicableRules) {
      ruleCount++;
      if (!rule.check(content)) {
        violations.push({
          id: crypto.randomUUID(),
          framework: rule.framework,
          rule: rule.rule,
          severity: rule.severity,
          description: `Content violates ${rule.rule} of ${rule.framework}`,
          remediation: rule.remediation,
        });
      }
    }

    // Check badges
    const badges: ComplianceBadge[] = BADGE_DEFINITIONS
      .filter(b => !frameworks || frameworks.includes(b.framework))
      .map(b => ({
        id: crypto.randomUUID(),
        name: b.name,
        framework: b.framework,
        description: b.description,
        earned: b.check(content),
        criteria: b.criteria,
        icon: b.icon,
      }));

    // Calculate score
    const violationPenalty = violations.reduce((penalty, v) => {
      switch (v.severity) {
        case 'CRITICAL': return penalty + 25;
        case 'VIOLATION': return penalty + 15;
        case 'WARNING': return penalty + 5;
        case 'INFO': return penalty + 1;
        default: return penalty;
      }
    }, 0);

    const score = Math.max(0, Math.min(100, 100 - violationPenalty));

    // Generate recommendations
    const recommendations = ComplianceChecker.generateRecommendations(violations, badges);

    const uniqueFrameworks = [...new Set(applicableRules.map(r => r.framework))];

    return {
      compliant: violations.filter(v => v.severity === 'CRITICAL' || v.severity === 'VIOLATION').length === 0,
      score,
      badges,
      violations,
      recommendations,
      frameworks: uniqueFrameworks,
    };
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    violations: ComplianceViolation[],
    badges: ComplianceBadge[]
  ): string[] {
    const recs: string[] = [];

    const critical = violations.filter(v => v.severity === 'CRITICAL');
    if (critical.length > 0) {
      recs.push(`🚨 ${critical.length} critical violation(s) found - immediate remediation required before publication`);
    }

    const unearnedBadges = badges.filter(b => !b.earned);
    if (unearnedBadges.length > 0) {
      recs.push(`Badge(s) not earned: ${unearnedBadges.map(b => b.name).join(', ')}`);
    }

    if (violations.length === 0) {
      recs.push('✅ Content passes all compliance checks');
    }

    const frameworks = [...new Set(violations.map(v => v.framework))];
    for (const fw of frameworks) {
      const fwViolations = violations.filter(v => v.framework === fw);
      recs.push(`${fw}: ${fwViolations.length} violation(s) - review and remediate`);
    }

    return recs;
  }
}
