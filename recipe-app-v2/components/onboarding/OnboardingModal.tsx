'use client';

import React, { useState } from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';
import Step1DietPreference from './Step1DietPreference';
import Step2SpiceLevel from './Step2SpiceLevel';
import Step3CookingGoal from './Step3CookingGoal';
import Step4FavoriteCuisines from './Step4FavoriteCuisines';
import Step5Appliances from './Step5Appliances';
import Step6Restrictions from './Step6Restrictions';
import Step7CookTime from './Step7CookTime';

interface OnboardingModalProps {
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [machine] = useState(() => new OnboardingMachine());
  const [currentStep, setCurrentStep] = useState(machine.getCurrentStep());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    machine.goNext();
    setCurrentStep(machine.getCurrentStep());
  };

  const handleBack = () => {
    machine.goBack();
    setCurrentStep(machine.getCurrentStep());
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await machine.submit();
      onComplete();
    } catch (error) {
      console.error('Onboarding submission failed:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1DietPreference machine={machine} />;
      case 2:
        return <Step2SpiceLevel machine={machine} />;
      case 3:
        return <Step3CookingGoal machine={machine} />;
      case 4:
        return <Step4FavoriteCuisines machine={machine} />;
      case 5:
        return <Step5Appliances machine={machine} />;
      case 6:
        return <Step6Restrictions machine={machine} />;
      case 7:
        return <Step7CookTime machine={machine} />;
      default:
        return null;
    }
  };

  const progress = (currentStep / 7) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#ff6600',
                width: `${progress}%`,
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
            Step {currentStep} of 7
          </p>
        </div>

        {/* Step Content */}
        <div style={{ marginBottom: '2rem' }}>{renderStep()}</div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            disabled={!machine.canGoBack()}
            className="btn"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              background: 'white',
              cursor: machine.canGoBack() ? 'pointer' : 'not-allowed',
              opacity: machine.canGoBack() ? 1 : 0.5,
            }}
          >
            Back
          </button>

          {currentStep < 7 ? (
            <button
              onClick={handleNext}
              disabled={!machine.canGoNext()}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                cursor: machine.canGoNext() ? 'pointer' : 'not-allowed',
                opacity: machine.canGoNext() ? 1 : 0.5,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!machine.canGoNext() || isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                cursor: machine.canGoNext() && !isSubmitting ? 'pointer' : 'not-allowed',
                opacity: machine.canGoNext() && !isSubmitting ? 1 : 0.5,
              }}
            >
              {isSubmitting ? 'Completing...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
