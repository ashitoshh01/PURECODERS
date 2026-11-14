import React from 'react';

export default function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = 'teal', // 'teal' | 'rose' | 'amber' | 'emerald' | 'purple' | 'blue' | 'slate'
  badge,
}) {
  const accentStyles = {
    teal: {
      iconBg: 'bg-teal-50 text-teal-700 border-teal-100',
      valueColor: 'text-slate-900',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-700 border-rose-100',
      valueColor: 'text-rose-700',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
      valueColor: 'text-amber-700',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      valueColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-700 border-purple-100',
      valueColor: 'text-purple-700',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    blue: {
      iconBg: 'bg-sky-50 text-sky-700 border-sky-100',
      valueColor: 'text-slate-900',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      valueColor: 'text-slate-800',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  };

  const style = accentStyles[accent] || accentStyles.teal;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs transition duration-150 hover:shadow-sm hover:border-slate-300 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
            {label}
          </span>
          <div className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${style.valueColor}`}>
            {value}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {Icon && (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs ${style.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
      {subtext && (
        <p className="text-xs text-slate-500 mt-2 font-normal leading-relaxed border-t border-slate-100 pt-2">
          {subtext}
        </p>
      )}
    </div>
  );
}
