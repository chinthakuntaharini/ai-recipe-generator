'use client';

import React from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';

const Step4FavoriteCuisines: React.FC<{ machine: OnboardingMachine }> = ({ machine }) => {
  const cuisines = [
    'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Japanese',
    'Middle Eastern', 'Thai', 'Korean', 'Mediterranean', 'Continental', 'Street Food'
  ];
  const selected = machine.getResponses().favoriteCuisines || [];

  const toggleCuisine = (cuisine: string) => {
    const newSelected = selected.includes(cuisine)
      ? selected.filter(c => c !== cuisine)
      : [...selected, cuisine];
    machine.updateResponse('favoriteCuisines', newSelected);
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        What is your favourite cuisine?
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        Select all that apply
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {cuisines.map((cuisine) => (
          <button
            key={cuisine}
            onClick={() => toggleCuisine(cuisine)}
            className={`toggle-pill ${selected.includes(cuisine) ? 'active' : ''}`}
            style={{ padding: '0.5rem 1rem' }}
          >
            {cuisine}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step4FavoriteCuisines;
