'use client';

import React from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';
import { CookingTime } from '@/types';

const Step7CookTime: React.FC<{ machine: OnboardingMachine }> = ({ machine }) => {
  const options: CookingTime[] = ['Under 15 min', '15–30 min', '30–60 min', 'Over an hour'];
  const selected = machine.getResponses().usualCookingTime;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        How much time do you usually have to cook?
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => machine.updateResponse('usualCookingTime', option)}
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

export default Step7CookTime;
