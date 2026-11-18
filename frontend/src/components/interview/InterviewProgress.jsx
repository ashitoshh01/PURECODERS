import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function InterviewProgress({
  totalQuestions = 6,
  answeredCount = 0,
  decisionCount = 0,
}) {
  const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const remaining = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Progress info */}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Knowledge Extraction Progress
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
              {answeredCount} of {totalQuestions} answered ({pct}%)
            </span>
            {remaining > 0 ? (
              <span className="text-xs text-slate-400 font-medium">
                · {remaining} remaining
              </span>
            ) : (
              <span className="text-xs text-emerald-600 font-semibold">
                · All questions completed
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden max-w-md border border-slate-200/60">
            <div
              className="h-full bg-[#18C6B0] rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Right: Decisions badge + Status badge */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Decisions logged badge */}
          {decisionCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-bold">{decisionCount}</span>
              <span className="font-medium">decisions logged</span>
            </div>
          )}

          {/* Session Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>{pct === 100 ? 'All Captured' : 'Active Session'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
