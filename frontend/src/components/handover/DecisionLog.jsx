import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import EmptyState from '../common/EmptyState';

export default function DecisionLog({ decisions = [], leaverName = 'Departing Lead' }) {
  if (decisions.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No decisions logged yet"
        description={`When ${leaverName} answers exit interview questions containing 'because', 'we chose', or 'so that', decisions are automatically extracted here.`}
      />
    );
  }

  return (
    <div className="space-y-3">
      {decisions.map((d, idx) => (
        <div
          key={d.id || idx}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs transition hover:border-slate-300"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80">
              {d.artifact_id}
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Extracted Rationale</span>
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
            {d.decision}
          </h4>

          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border-l-4 border-[#18C6B0] text-xs text-slate-700 leading-relaxed italic">
            &ldquo;{d.rationale}&rdquo;
          </div>
        </div>
      ))}
    </div>
  );
}
