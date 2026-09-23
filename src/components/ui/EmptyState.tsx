import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl bg-white/50 dark:bg-zinc-900/50">
    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl mb-4">
      <Icon className="w-8 h-8 stroke-[1.5]" />
    </div>
    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'zinc' | 'indigo' | 'emerald' | 'rose' | 'amber';
}> = ({ children, variant = 'zinc' }) => {
  const styles = {
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
};