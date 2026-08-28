"use client";

import React from "react";

export interface WizardStep {
  id: string;
  label: string;
  icon: string;
}

interface StepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0',
      padding: '0.75rem 1.5rem',
      background: 'rgba(17,24,39,0.9)',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.06)',
      marginBottom: '1.5rem',
    }}>
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isComplete = i < currentStep;
        const isLast = i === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div
              onClick={() => onStepClick?.(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: onStepClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                opacity: isActive ? 1 : isComplete ? 0.9 : 0.5,
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isComplete ? '0.75rem' : '0.7rem',
                fontWeight: 700,
                background: isComplete ? '#10b981' : isActive ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: isComplete || isActive ? '#fff' : '#6b7280',
                border: isActive ? '2px solid #3b82f6' : isComplete ? '2px solid #10b981' : '2px solid transparent',
                transition: 'all 0.3s',
              }}>
                {isComplete ? '✓' : step.icon}
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#f3f4f6' : isComplete ? '#10b981' : '#6b7280',
                  whiteSpace: 'nowrap',
                }}>
                  {step.label}
                </div>
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <div style={{
                flex: 1,
                height: '2px',
                margin: '0 0.75rem',
                background: isComplete
                  ? 'linear-gradient(90deg, #10b981, #10b981)'
                  : isActive
                    ? 'linear-gradient(90deg, #3b82f6, rgba(255,255,255,0.08))'
                    : 'rgba(255,255,255,0.08)',
                borderRadius: '1px',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Default wizard steps for content transformation
 */
export const DEFAULT_WIZARD_STEPS: WizardStep[] = [
  { id: 'source', label: 'Source', icon: '📝' },
  { id: 'analyze', label: 'Analyze', icon: '🧠' },
  { id: 'configure', label: 'Configure', icon: '⚙️' },
  { id: 'select', label: 'Select', icon: '🎯' },
  { id: 'transform', label: 'Transform', icon: '⚡' },
];
