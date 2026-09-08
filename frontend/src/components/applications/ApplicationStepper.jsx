import { Check } from 'lucide-react';

const STEPS = [
  { step: 1, title: 'Business Profile', label: '1. Business Profile' },
  { step: 2, title: 'Required Approvals', label: '2. Required Approvals' },
  { step: 3, title: 'Upload Documents', label: '3. Upload Documents' },
  { step: 4, title: 'Review & Validation', label: '4. Review & Validation' },
];

export function ApplicationStepper({ currentStep = 1, onStepClick = null, maxCompletedStep = 1 }) {
  return (
    <nav aria-label="Application Progress" className="stepper-container">
      <ol className="stepper-list">
        {STEPS.map(({ step, title }) => {
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isClickable = onStepClick && step <= Math.max(currentStep, maxCompletedStep);

          return (
            <li
              key={step}
              className={`stepper-item ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <button
                type="button"
                className="stepper-step"
                aria-label={title}
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(step)}
              >
                <span className="stepper-bubble">
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
                </span>
                <span className="stepper-title">{title}</span>
              </button>
              {step < STEPS.length && <div className="stepper-line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
