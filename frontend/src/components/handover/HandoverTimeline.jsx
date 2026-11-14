import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Check } from 'lucide-react';
import { echoApi } from '../../api';

export default function HandoverTimeline({ onboardingPath = [], onTaskToggled }) {
  const [togglingId, setTogglingId] = useState(null);

  const handleToggle = async (step) => {
    if (togglingId) return;
    setTogglingId(step.id);
    try {
      if (step.id) {
        await echoApi.toggleOnboardingTask(step.id);
      }
      if (onTaskToggled) onTaskToggled();
    } catch (e) {
      console.error('Failed to toggle task:', e);
    } finally {
      setTogglingId(null);
    }
  };

  if (onboardingPath.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
        No onboarding tasks generated yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {onboardingPath.map((step, idx) => {
        const isDone = Boolean(step.is_completed);
        const isToggling = togglingId === step.id;

        return (
          <div
            key={step.id || idx}
            onClick={() => handleToggle(step)}
            className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
              isDone
                ? 'bg-slate-50/80 border-slate-200/60 opacity-85'
                : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            {/* Custom Interactive Checkbox button */}
            <button
              type="button"
              disabled={isToggling}
              className="mt-0.5 shrink-0 cursor-pointer focus:outline-none"
              aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
            >
              {isDone ? (
                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-[#18C6B0] transition bg-white" />
              )}
            </button>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80">
                  Week {step.week} · Days {step.days}
                </span>
                <span className={`text-xs text-slate-400 font-medium ${isDone ? 'line-through' : ''}`}>
                  Phase {step.week === 1 ? 'Orientation & Shadowing' : 'Independent Execution'}
                </span>
              </div>

              <div
                className={`text-sm font-bold transition leading-snug ${
                  isDone ? 'text-slate-500 line-through' : 'text-slate-900'
                }`}
              >
                {step.task}
              </div>

              <div className="text-xs text-slate-500 mt-1 flex items-start gap-1.5 leading-relaxed">
                <span className="font-bold text-slate-700 shrink-0">Rationale:</span>
                <span>{step.why}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
