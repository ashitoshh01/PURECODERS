import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBox({ msg, hint, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50/80 p-5 text-rose-900 shadow-xs fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5 border border-rose-200/60">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-950">Connection or Service Notice</h4>
          <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">
            {msg || 'Unable to complete request with the knowledge-risk engine.'}
          </p>
          {hint && (
            <p className="text-xs text-rose-800/90 mt-2.5 font-mono bg-white/70 p-2.5 rounded-lg border border-rose-200/80 leading-relaxed overflow-x-auto">
              {hint}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
              <span>Retry Request</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
