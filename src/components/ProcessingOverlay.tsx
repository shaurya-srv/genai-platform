"use client";

import React, { useEffect, useState } from "react";

export interface PipelineStep {
  id: string;
  label: string;
  icon: string;
  detail: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

interface ProcessingOverlayProps {
  isVisible: boolean;
  currentStep: number;
  steps: PipelineStep[];
  title?: string;
}

export function ProcessingOverlay({ isVisible, currentStep, steps, title = "Transforming Content" }: ProcessingOverlayProps) {
  const [show, setShow] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setFade(true)));
    } else {
      setFade(false);
      setTimeout(() => setShow(false), 400);
    }
  }, [isVisible]);

  if (!show) return null;

  const completedSteps = steps.filter(s => s.status === 'done').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const activeStep = steps[currentStep];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: fade ? 'rgba(2,6,23,0.95)' : 'rgba(2,6,23,0)',
      backdropFilter: fade ? 'blur(20px)' : 'blur(0px)',
      transition: 'all 0.4s ease',
      opacity: fade ? 1 : 0,
    }}>
      <div style={{
        width: '680px', maxWidth: '95vw',
        background: 'linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(15,23,42,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px', padding: '2.5rem',
        boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 120px rgba(59,130,246,0.1)',
        transform: fade ? 'scale(1)' : 'scale(0.9)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '3rem', marginBottom: '0.75rem',
            animation: 'spin 2s linear infinite',
          }}>⚡</div>
          <h2 style={{
            fontSize: '1.5rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem',
          }}>{title}</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {completedSteps} of {steps.length} steps complete
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`, borderRadius: '3px',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 20px rgba(59,130,246,0.5)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>{Math.round(progress)}% complete</span>
            <span style={{ fontSize: '0.65rem', color: '#475569' }}>{completedSteps}/{steps.length}</span>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '2rem' }}>
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = step.status === 'done';
            const isError = step.status === 'error';

            const color = isDone ? '#10b981' : isActive ? '#3b82f6' : isError ? '#ef4444' : '#334155';

            return (
              <div key={step.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 0.9rem', borderRadius: '10px',
                background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                transition: 'all 0.3s ease',
              }}>
                {/* Icon */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isDone ? '0.7rem' : '0.65rem', fontWeight: 700,
                  background: `${color}20`, border: `2px solid ${color}`,
                  color: color, transition: 'all 0.3s',
                }}>
                  {isDone ? '✓' : isActive ? (
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: '#3b82f6',
                      animation: 'pulse-dot 1s ease-in-out infinite',
                    }} />
                  ) : isError ? '✗' : (i + 1)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                    color: isDone ? '#94a3b8' : isActive ? '#f1f5f9' : isError ? '#fca5a5' : '#475569',
                    transition: 'color 0.3s',
                  }}>
                    {step.icon} {step.label}
                  </div>
                  {isActive && step.detail && (
                    <div style={{
                      fontSize: '0.65rem', color: '#93c5fd', marginTop: '0.1rem',
                      fontStyle: 'italic', animation: 'fade-in 0.3s ease',
                    }}>
                      {step.detail}
                    </div>
                  )}
                </div>

                {/* Status */}
                {isDone && (
                  <span style={{
                    fontSize: '0.55rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                    background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600,
                    animation: 'fade-in 0.3s ease',
                  }}>
                    DONE
                  </span>
                )}
                {isActive && (
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid #3b82f6', borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                )}
                {isError && (
                  <span style={{
                    fontSize: '0.55rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                    background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600,
                  }}>
                    FAILED
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Active step detail */}
        {activeStep && activeStep.status === 'active' && (
          <div style={{
            padding: '1rem 1.25rem', borderRadius: '12px',
            background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
            animation: 'fade-in 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6',
                animation: 'pulse-dot 1s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#93c5fd' }}>
                Currently Processing
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
              {activeStep.icon} {activeStep.label}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              {activeStep.detail}
            </div>
          </div>
        )}

        {/* Footer tip */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.65rem', color: '#334155' }}>
            🔐 Content is being secured through the full security pipeline
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/**
 * Default pipeline steps for the transform flow
 */
export const TRANSFORM_STEPS: PipelineStep[] = [
  { id: 'ingest', label: 'Content Ingestion', icon: '📥', detail: 'Loading and parsing source content...', status: 'pending' },
  { id: 'sanitize', label: 'Prompt Injection Defense', icon: '🛡️', detail: 'Scanning for prompt injection attacks, overrides, and manipulation patterns...', status: 'pending' },
  { id: 'dlp', label: 'DLP Scan', icon: '🔍', detail: 'Detecting PII, credentials, classified data, financial information...', status: 'pending' },
  { id: 'threat', label: 'Threat Analysis', icon: '⚔️', detail: 'Analyzing content for phishing, data exfiltration, and insider threat indicators...', status: 'pending' },
  { id: 'compliance', label: 'Compliance Check', icon: '📋', detail: 'Validating against IT Act 2000, DPDP Act 2023, GDPR, SOC2, ISO 27001...', status: 'pending' },
  { id: 'context', label: 'Context Extraction', icon: '🧠', detail: 'Building structured context — extracting topic, facts, entities, risks, key metrics...', status: 'pending' },
  { id: 'generate', label: 'Content Generation', icon: '⚡', detail: 'Generating all selected outputs from shared context — ensuring cross-format consistency...', status: 'pending' },
  { id: 'validate', label: 'Validation Layer', icon: '✅', detail: 'Running source grounding, factual consistency, and format validation checks...', status: 'pending' },
  { id: 'blockchain', label: 'Blockchain Record', icon: '⛓️', detail: 'Recording transformation on immutable hash-chain ledger with SHA-256 linking...', status: 'pending' },
  { id: 'approval', label: 'Approval Requests', icon: '✍️', detail: 'Creating multi-signature approval requests for each output type...', status: 'pending' },
];
