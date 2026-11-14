import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function LoadingState({ label = 'Loading knowledge data...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-16 px-4 text-center fade-in"
    >
      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mb-3 shadow-xs">
        <Loader2 className="w-6 h-6 text-[#18C6B0] animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-1">Connecting to knowledge graph engine</p>
    </div>
  );
}
