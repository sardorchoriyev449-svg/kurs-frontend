import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs ${className}`}>
    {children}
  </div>
);
