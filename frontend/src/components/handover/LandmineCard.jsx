import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export default function LandmineCard({
  landmine,
  rank,
  onNavigateToInterview,
  leaverName = 'Departing Lead',
}) {
  const isCaptured = Boolean(landmine.captured);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs transition hover:border-slate-300 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-200 mt-0.5">
              #{rank}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {landmine.title}
              </h4>
              <span className="text-[11px] font-mono text-slate-400 mt-0.5 block font-medium">
                {landmine.artifact_id}
              </span>
            </div>
          </div>

          <RiskBadge pct={landmine.risk_pct} size="sm" />
        </div>
      </div>

      {/* Captured / Uncaptured State */}
      <div className="mt-3.5">
        {isCaptured ? (
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Captured from Exit Interview:</span>
            </div>
            <p className="text-slate-800 italic bg-white/80 p-2.5 rounded-lg border border-emerald-100 leading-relaxed text-xs">
              &ldquo;{landmine.captured}&rdquo;
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-amber-900 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Knowledge gap uncaptured — requires {leaverName}&apos;s input</span>
            </div>
            {onNavigateToInterview && (
              <button
                onClick={() => onNavigateToInterview(landmine.artifact_id)}
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 transition shrink-0 cursor-pointer"
              >
                <span>Answer now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
