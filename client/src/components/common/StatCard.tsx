import React from 'react';
import { Card, CardContent } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  subtitle,
  color = 'indigo',
  onClick,
}) => {
  const colorStyles = {
    indigo: 'from-indigo-500/10 to-indigo-500/0 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/0 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/0 text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/10 to-rose-500/0 text-rose-400 border-rose-500/20',
    purple: 'from-purple-500/10 to-purple-500/0 text-purple-400 border-purple-500/20',
    blue: 'from-blue-500/10 to-blue-500/0 text-blue-400 border-blue-500/20',
  };

  const iconBg = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <Card
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden group border border-slate-800/80 bg-gradient-to-b hover:border-slate-700 transition-all duration-300',
        colorStyles[color],
        onClick && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className={clsx('p-2.5 rounded-xl border', iconBg[color])}>
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight font-mono">
            {value}
          </div>
        </div>

        {(change || subtitle) && (
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
            {change ? (
              <div className="flex items-center gap-1.5 font-medium">
                {change.isPositive === true && (
                  <span className="flex items-center text-emerald-400 font-semibold gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{change.value}%
                  </span>
                )}
                {change.isPositive === false && (
                  <span className="flex items-center text-rose-400 font-semibold gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {change.value}%
                  </span>
                )}
                {change.isPositive === undefined && (
                  <span className="flex items-center text-slate-400 gap-0.5">
                    <Minus className="w-3.5 h-3.5" />
                    {change.value}
                  </span>
                )}
                <span className="text-slate-400">{change.label || 'vs last month'}</span>
              </div>
            ) : (
              <span className="text-slate-400">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
