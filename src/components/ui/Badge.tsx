import React from 'react';

type Tone = 'emerald' | 'amber' | 'blue' | 'red' | 'slate';

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

const tones: Record<Tone, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
  slate: 'bg-slate-800 text-slate-300 border-slate-700',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'slate', children, className = '' }) => (
  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${tones[tone]} ${className}`}>
    {children}
  </span>
);
