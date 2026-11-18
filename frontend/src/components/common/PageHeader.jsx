import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200/90">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {badge && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 shrink-0">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed break-words">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
