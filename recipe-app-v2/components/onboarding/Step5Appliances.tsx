'use client';

import React from 'react';
import { OnboardingMachine } from '@/lib/onboarding-machine';
import { Appliance } from '@/types';

const Step5Appliances: React.FC<{ machine: OnboardingMachine }> = ({ machine }) => {
  const appliances: Appliance[] = [
    'Gas stove', 'Induction', 'Microwave', 'Air fryer', 'Oven/OTG', 'Pressure cooker', 'Instant pot'
  ];
  const selected = machine.getResponses().availableAppliances || [];

  const toggleAppliance = (appliance: Appliance) => {
    const newSelected = selected.includes(appliance)
      ? selected.filter(a => a !== appliance)
      : [...selected, appliance];
    machine.updateResponse('availableAppliances', newSelected);
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Which appliances do you usually cook with?
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        Select all that apply
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {appliances.map((appliance) => (
          <button
            key={appliance}
            onClick={() => toggleAppliance(appliance)}
            className={`toggle-pill ${selected.includes(appliance) ? 'active' : ''}`}
            style={{ padding: '1rem', textAlign: 'center' }}
          >
            {appliance}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Step5Appliances;
