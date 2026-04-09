'use client';

import React, { useEffect, useState } from 'react';

// SVG Food Icons
const foodIcons = {
  carrot: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 10c0-1.1-.9-2-2-2h-2V6c0-1.1-.9-2-2-2s-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-6z" fill="#ff6600" opacity="0.8"/>
    </svg>
  ),
  tomato: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="14" r="7" fill="#ff4444" opacity="0.8"/>
      <path d="M12 7c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" fill="#44aa44" opacity="0.8"/>
    </svg>
  ),
  chilli: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 4c-2 0-3 2-3 4s1 6 3 10c1 2 2 3 4 3s3-1 4-3c2-4 3-8 3-10s-1-4-3-4c-1 0-2 1-2 2 0-1-1-2-2-2-1 0-2 1-2 2 0-1-1-2-2-2z" fill="#dd2222" opacity="0.8"/>
    </svg>
  ),
  onion: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="13" rx="6" ry="8" fill="#cc99ff" opacity="0.8"/>
      <path d="M12 5c-1 0-2 1-2 2v2c0 1 1 2 2 2s2-1 2-2V7c0-1-1-2-2-2z" fill="#99cc66" opacity="0.8"/>
    </svg>
  ),
  pan: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="10" cy="12" r="7" fill="#666666" opacity="0.8"/>
      <rect x="16" y="11" width="6" height="2" rx="1" fill="#666666" opacity="0.8"/>
    </svg>
  ),
  pot: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="10" width="12" height="10" rx="2" fill="#888888" opacity="0.8"/>
      <rect x="4" y="8" width="16" height="2" rx="1" fill="#888888" opacity="0.8"/>
    </svg>
  ),
  knife: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 20l8-8 8 8-8-8-8 8z" fill="#cccccc" opacity="0.8"/>
      <rect x="11" y="2" width="2" height="10" fill="#666666" opacity="0.8"/>
    </svg>
  ),
  spoon: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="8" rx="4" ry="5" fill="#cccccc" opacity="0.8"/>
      <rect x="11" y="12" width="2" height="10" rx="1" fill="#cccccc" opacity="0.8"/>
    </svg>
  ),
  fork: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="8" y="2" width="2" height="12" fill="#cccccc" opacity="0.8"/>
      <rect x="12" y="2" width="2" height="12" fill="#cccccc" opacity="0.8"/>
      <rect x="10" y="12" width="4" height="10" rx="1" fill="#cccccc" opacity="0.8"/>
    </svg>
  ),
  pepper: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4c-3 0-5 2-5 5 0 4 2 8 5 11 3-3 5-7 5-11 0-3-2-5-5-5z" fill="#228822" opacity="0.8"/>
      <path d="M12 4c-1 0-2-1-2-2h4c0 1-1 2-2 2z" fill="#44aa44" opacity="0.8"/>
    </svg>
  ),
  bowl: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 12c0-4 4-8 8-8s8 4 8 8v2c0 2-2 4-4 4H8c-2 0-4-2-4-4v-2z" fill="#ff9966" opacity="0.8"/>
    </svg>
  ),
  garlic: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="14" rx="5" ry="7" fill="#eeeecc" opacity="0.8"/>
      <path d="M12 7c-1 0-2-1-2-2v-2c0-1 1-2 2-2s2 1 2 2v2c0 1-1 2-2 2z" fill="#ccddaa" opacity="0.8"/>
    </svg>
  ),
};

interface FloatingElement {
  id: number;
  icon: keyof typeof foodIcons;
  size: number;
  duration: number;
  delay: number;
  xStart: number;
  xEnd: number;
  rotationStart: number;
  rotationEnd: number;
  opacity: number;
}

const FloatingBackground: React.FC = () => {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const iconKeys = Object.keys(foodIcons) as (keyof typeof foodIcons)[];
    const generatedElements: FloatingElement[] = [];

    for (let i = 0; i < 12; i++) {
      generatedElements.push({
        id: i,
        icon: iconKeys[Math.floor(Math.random() * iconKeys.length)],
        size: 40 + Math.random() * 40, // 40-80px
        duration: 8 + Math.random() * 12, // 8-20s
        delay: Math.random() * 5, // 0-5s
        xStart: Math.random() * 100, // 0-100vw
        xEnd: (Math.random() - 0.5) * 40, // -20 to +20vw drift
        rotationStart: (Math.random() - 0.5) * 30, // -15 to +15deg
        rotationEnd: (Math.random() - 0.5) * 30, // -15 to +15deg
        opacity: 0.06 + Math.random() * 0.06, // 0.06-0.12
      });
    }

    setElements(generatedElements);
  }, []);

  return (
    <div className="floating-background" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {elements.map((element) => (
        <div
          key={element.id}
          className="floating-element"
          style={{
            '--float-duration': `${element.duration}s`,
            '--float-delay': `${element.delay}s`,
            '--float-x-start': `${element.xStart}vw`,
            '--float-x-end': `${element.xEnd}vw`,
            '--float-rotation-start': `${element.rotationStart}deg`,
            '--float-rotation-end': `${element.rotationEnd}deg`,
            '--float-opacity': element.opacity,
            width: `${element.size}px`,
            height: `${element.size}px`,
            left: 0,
            bottom: 0,
          } as React.CSSProperties}
        >
          {foodIcons[element.icon]}
        </div>
      ))}
    </div>
  );
};

export default FloatingBackground;
