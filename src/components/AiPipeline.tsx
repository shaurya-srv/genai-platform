"use client";

import React from "react";

export interface PipelineStep {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  detail?: string;
}

interface AiPipelineProps {
  steps: PipelineStep[];
  currentStep: number;
}

export function AiPipeline({ steps, currentStep }: AiPipelineProps) {
  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(17,24,39,0.9)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div className="animate-spin" style={{ fontSize: '1.25rem' }}>⚡</div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f3f4f6' }}>AI Processing Pipeline</h3>
        <span style={{
          marginLeft: 'auto',
          fontSize: '0.7rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '12px',
          background: 'rgba(59,130,246,0.15)',
          color: '#93c5fd',
          fontWeight: 600,
        }}>
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isComplete = step.status === 'complete' || i < currentStep;
          const isError = step.status === 'error';

          const statusColor = isComplete ? '#10b981' : isActive ? '#3b82f6' : isError ? '#ef4444' : '#4b5563';
          const bgColor = isActive ? 'rgba(59,130,246,0.08)' : 'transparent';

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: bgColor,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Status indicator */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                flexShrink: 0,
                background: `${statusColor}20`,
                border: `2px solid ${statusColor}`,
                color: statusColor,
                fontWeight: 700,
              }}>
                {isComplete ? '✓' : isActive ? (
                  <div className="animate-spin" style={{ fontSize: '0.7rem' }}>⟳</div>
                ) : isError ? '✗' : (i + 1)}
              </div>

              {/* Step info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isComplete ? '#d1d5db' : isActive ? '#f3f4f6' : '#6b7280',
                  transition: 'color 0.3s',
                }}>
                  {step.icon} {step.label}
                </div>
                {step.detail && isActive && (
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#93c5fd',
                    marginTop: '0.15rem',
                    fontStyle: 'italic',
                  }}>
                    {step.detail}
                  </div>
                )}
              </div>

              {/* Status badge */}
              {isComplete && (
                <span style={{
                  fontSize: '0.55rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10b981',
                  fontWeight: 600,
                }}>
                  DONE
                </span>
              )}
              {isActive && (
                <span style={{
                  fontSize: '0.55rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  background: 'rgba(59,130,246,0.15)',
                  color: '#3b82f6',
                  fontWeight: 600,
                }} className="animate-pulse">
                  RUNNING
                </span>
              )}
              {isError && (
                <span style={{
                  fontSize: '0.55rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  fontWeight: 600,
                }}>
                  ERROR
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: '1rem', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${((currentStep + 1) / steps.length) * 100}%`,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          borderRadius: '2px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

/**
 * Default pipeline steps for content transformation
 */
export const DEFAULT_PIPELINE_STEPS: PipelineStep[] = [
  { id: 'ingest', label: 'Content Ingestion', icon: '📥', status: 'pending', detail: 'Processing source content...' },
  { id: 'sanitize', label: 'Prompt Injection Defense', icon: '🛡️', status: 'pending', detail: 'Scanning for injection threats...' },
  { id: 'dlp', label: 'DLP Scan', icon: '🔍', status: 'pending', detail: 'Detecting sensitive data...' },
  { id: 'threat', label: 'Threat Analysis', icon: '⚔️', status: 'pending', detail: 'Analyzing security threats...' },
  { id: 'compliance', label: 'Compliance Check', icon: '📋', status: 'pending', detail: 'Validating regulations...' },
  { id: 'context', label: 'Context Extraction', icon: '🧠', status: 'pending', detail: 'Building structured context...' },
  { id: 'transform', label: 'Content Generation', icon: '⚡', status: 'pending', detail: 'Generating outputs...' },
  { id: 'validate', label: 'Validation', icon: '✅', status: 'pending', detail: 'Verifying consistency...' },
  { id: 'record', label: 'Blockchain Record', icon: '⛓️', status: 'pending', detail: 'Recording on hash chain...' },
];
