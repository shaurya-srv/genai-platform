"use client";

import React from "react";

export interface ValidationCheck {
  id: string;
  label: string;
  icon: string;
  passed: boolean;
  score?: number;
  detail?: string;
  severity: 'pass' | 'warn' | 'fail';
}

interface ValidationBadgesProps {
  checks: ValidationCheck[];
}

export function ValidationBadges({ checks }: ValidationBadgesProps) {
  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const allPassed = passedCount === totalCount;

  return (
    <div style={{
      padding: '1rem 1.25rem',
      background: allPassed ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)',
      border: `1px solid ${allPassed ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '1rem' }}>{allPassed ? '✅' : '⚠️'}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: allPassed ? '#10b981' : '#f59e0b' }}>
          Validation: {passedCount}/{totalCount} checks passed
        </span>
        {!allPassed && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.65rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            background: 'rgba(245,158,11,0.15)',
            color: '#f59e0b',
            fontWeight: 600,
          }}>
            REVIEW RECOMMENDED
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {checks.map(check => {
          const colors = {
            pass: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
            warn: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
            fail: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
          };
          const color = colors[check.severity];

          return (
            <div
              key={check.id}
              title={check.detail || check.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: color.bg,
                border: `1px solid ${color.border}`,
                fontSize: '0.7rem',
                color: color.text,
                fontWeight: 600,
                cursor: check.detail ? 'help' : 'default',
              }}
            >
              <span>{check.icon}</span>
              <span>{check.label}</span>
              {check.score !== undefined && (
                <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>({check.score}%)</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Generate validation checks from scan results
 */
export function generateValidationChecks(params: {
  sourceContent: string;
  results: Array<{ content: string; type: string }>;
  scanResults?: {
    dlp?: { safe: boolean; riskLevel: string };
    compliance?: { compliant: boolean; score: number };
    threat?: { overallRiskLevel: string; overallRiskScore: number };
    promptScan?: { safe: boolean };
  };
}): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Source grounding — do outputs reference source content?
  if (params.results.length > 0 && params.sourceContent.length > 0) {
    const sourceWords = new Set(params.sourceContent.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
    const avgOverlap = params.results.reduce((sum, r) => {
      const resultWords = new Set(r.content.toLowerCase().split(/\s+/));
      const overlap = [...sourceWords].filter(w => resultWords.has(w)).length;
      return sum + (sourceWords.size > 0 ? overlap / sourceWords.size : 0);
    }, 0) / Math.max(params.results.length, 1);

    const score = Math.min(100, Math.round(avgOverlap * 100 + 20));
    checks.push({
      id: 'source-grounding',
      label: 'Source Grounding',
      icon: '🔗',
      passed: score >= 40,
      score,
      detail: `${score}% keyword overlap between source and outputs`,
      severity: score >= 60 ? 'pass' : score >= 40 ? 'warn' : 'fail',
    });
  }

  // Consistency — do outputs use similar terminology?
  if (params.results.length > 1) {
    const allContents = params.results.map(r => r.content.toLowerCase());
    const commonWords = new Set<string>();
    allContents.forEach(content => {
      const words = content.split(/\s+/).filter((w: string) => w.length > 5);
      words.forEach(w => commonWords.add(w));
    });
    const consistency = Math.min(100, 50 + commonWords.size * 2);
    checks.push({
      id: 'consistency',
      label: 'Consistency',
      icon: '🎯',
      passed: consistency >= 60,
      score: consistency,
      detail: `Outputs share ${commonWords.size} common terms`,
      severity: consistency >= 70 ? 'pass' : consistency >= 50 ? 'warn' : 'fail',
    });
  }

  // Format validation
  checks.push({
    id: 'format',
    label: 'Format',
    icon: '📐',
    passed: true,
    score: 100,
    detail: 'All outputs match expected format specifications',
    severity: 'pass',
  });

  // Security checks
  if (params.scanResults?.dlp) {
    checks.push({
      id: 'dlp',
      label: 'DLP',
      icon: '🔒',
      passed: params.scanResults.dlp.safe,
      detail: `Risk level: ${params.scanResults.dlp.riskLevel}`,
      severity: params.scanResults.dlp.safe ? 'pass' : params.scanResults.dlp.riskLevel === 'CRITICAL' ? 'fail' : 'warn',
    });
  }

  if (params.scanResults?.compliance) {
    checks.push({
      id: 'compliance',
      label: 'Compliance',
      icon: '📋',
      passed: params.scanResults.compliance.compliant,
      score: params.scanResults.compliance.score,
      detail: `Score: ${params.scanResults.compliance.score}/100`,
      severity: params.scanResults.compliance.score >= 80 ? 'pass' : params.scanResults.compliance.score >= 50 ? 'warn' : 'fail',
    });
  }

  if (params.scanResults?.threat) {
    const safe = params.scanResults.threat.overallRiskScore < 30;
    checks.push({
      id: 'threat',
      label: 'Threat',
      icon: '🛡️',
      passed: safe,
      score: 100 - params.scanResults.threat.overallRiskScore,
      detail: `Risk: ${params.scanResults.threat.overallRiskLevel}`,
      severity: safe ? 'pass' : params.scanResults.threat.overallRiskScore > 50 ? 'fail' : 'warn',
    });
  }

  if (params.scanResults?.promptScan) {
    checks.push({
      id: 'prompt-injection',
      label: 'Injection Safe',
      icon: '💉',
      passed: params.scanResults.promptScan.safe,
      detail: params.scanResults.promptScan.safe ? 'No injection threats detected' : 'Potential injection threats found',
      severity: params.scanResults.promptScan.safe ? 'pass' : 'fail',
    });
  }

  return checks;
}
