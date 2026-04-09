'use client';

import React from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';
import { CookingGoal } from '@/types';

const Step3CookingGoal: React.FC<{ machine: OnboardingMachine }> = ({ machine }) => {
  const options: CookingGoal[] = ['Taste & Indulgence', 'Fitness & Health', 'Quick & Easy', 'Balanced'];
  const selected = machine.getResponses().cookingGoal;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        What is your primary cooking goal?
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => machine.updateResponse('cookingGoal', option)}
            className={`toggle-pill ${selected === option ? 'active' : ''}`}
            style={{ padding: '1rem', textAlign: 'center' }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step3CookingGoal;
