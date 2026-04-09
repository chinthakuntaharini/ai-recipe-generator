'use client';

import React from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';
import { DietType } from '@/types';

interface Props {
  machine: OnboardingMachine;
}

const Step1DietPreference: React.FC<Props> = ({ machine }) => {
  const options: DietType[] = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Eggetarian'];
  const selected = machine.getResponses().dietPreference;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        What do you prefer to eat?
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => machine.updateResponse('dietPreference', option)}
            className={`toggle-pill ${selected === option ? 'active' : ''}`}
            style={{
              padding: '1rem',
              textAlign: 'center',
              fontSize: '1rem',
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step1DietPreference;
