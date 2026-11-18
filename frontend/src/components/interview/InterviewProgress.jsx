import React from 'react';
import { Clock, CheckCircle2, Sparkles } from 'lucide-react';

export default function InterviewProgress({
  totalQuestions = 6,
  answeredCount = 0,
  secondsLeft = 15 * 60,
  decisionCount = 0,
}) {
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const remaining = Math.max(0, totalQuestions - answeredCount);
  const isUrgent = secondsLeft < 120;

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
            {remaining > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                · {remaining} remaining
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

        {/* Right: Decisions badge + Countdown Timer */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Decisions logged badge */}
          {decisionCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-bold">{decisionCount}</span>
              <span className="font-medium">decisions logged</span>
            </div>
          )}

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition ${
              isUrgent
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200/80 text-slate-800'
            }`}
          >
            <Clock
              className={`w-4 h-4 ${
                isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-400'
              }`}
            />
            <div>
              <div className="font-mono text-base font-bold leading-none">
                {mins}:{secs}
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                Session budget
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
