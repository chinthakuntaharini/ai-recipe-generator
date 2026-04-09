'use client';

import React from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';

const Step6Restrictions: React.FC<{ machine: OnboardingMachine }> = ({ machine }) => {
  const restrictions = [
    'Gluten-free', 'Dairy-free', 'Nut-free', 'Soy-free', 'Low sodium', 'Diabetic-friendly', 'None'
  ];
  const selected = machine.getResponses().dietaryRestrictions || [];

  const toggleRestriction = (restriction: string) => {
    if (restriction === 'None') {
      machine.updateResponse('dietaryRestrictions', ['None']);
    } else {
      const filtered = selected.filter(r => r !== 'None');
      const newSelected = filtered.includes(restriction)
        ? filtered.filter(r => r !== restriction)
        : [...filtered, restriction];
      machine.updateResponse('dietaryRestrictions', newSelected.length > 0 ? newSelected : ['None']);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Any dietary restrictions or allergies?
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        Select all that apply
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {restrictions.map((restriction) => (
          <button
            key={restriction}
            onClick={() => toggleRestriction(restriction)}
            className={`toggle-pill ${selected.includes(restriction) ? 'active' : ''}`}
            style={{ padding: '0.5rem 1rem' }}
          >
            {restriction}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step6Restrictions;
