
import React, { useEffect, useState } from 'react';
import { Particle } from '../types';

export const AshParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const particleCount = 50; // Increased density for realism
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        // Spread randomly across width
        x: Math.random() * 100, 
        // Start near the "char" line of the fire container
        y: 0, 
        size: Math.random() * 4 + 1, // Varied sizes (small bits of ash)
        // Loop delays to create continuous effect
        delay: Math.random() * 3, 
        duration: Math.random() * 2 + 2 // Slower float for ash
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none z-40">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bg-stone-900 rounded-sm ash-particle"
          style={{
            left: `${p.x}%`,
            bottom: '50%', /* Start from the middle of the fire line container (where the char is) */
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: 0.8,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            animationIterationCount: 'infinite',
            // Random rotation and horizontal drift
            '--tw-rotate': `${Math.random() * 720}deg`,
            '--tw-translate-x': `${(Math.random() - 0.5) * 60}px`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
