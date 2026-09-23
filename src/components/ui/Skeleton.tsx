import React from 'react';

export const Skeleton: React.FC<{
  className?: string;
}> = ({ className = 'h-4 w-full' }) => (
  <div className={`bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl ${className}`} />
);