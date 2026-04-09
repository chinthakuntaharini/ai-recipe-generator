'use client';

import React from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';
import { SpiceLevel } from '@/types';

interface Props {
  machine: OnboardingMachine;
}

const Step2SpiceLevel: React.FC<Props> = ({ machine }) => {
  const options: SpiceLevel[] = ['Mild', 'Medium', 'Spicy', 'Very Spicy'];
  const selected = machine.getResponses().spiceLevel;

  const getEmoji = (level: SpiceLevel) => {
    switch (level) {
      case 'Mild': return '🌶️';
      case 'Medium': return '🌶️🌶️';
      case 'Spicy': return '🌶️🌶️🌶️';
      case 'Very Spicy': return '🌶️🌶️🌶️🌶️';
      default: return '';
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        How spicy do you like your food?
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => machine.updateResponse('spiceLevel', option)}
            className={`toggle-pill ${selected === option ? 'active' : ''}`}
            style={{
              padding: '1rem',
              textAlign: 'center',
              fontSize: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{getEmoji(option)}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step2SpiceLevel;
