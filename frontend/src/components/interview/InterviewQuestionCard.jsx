import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Edit3,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export default function InterviewQuestionCard({
  question,
  index,
  savedAnswer,
  isSaved,
  onSaveAnswer,
  saving,
}) {
  const [answerText, setAnswerText] = useState(savedAnswer || '');
  const [isEditing, setIsEditing] = useState(false);

  const categoryLabels = {
    undocumented_single_owner: 'Undocumented & Single Owner',
    unexplained_change: 'Unexplained Change',
    solo_external_contact: 'Solo External Relationship',
    quiet_failure: 'Quiet Failure Mode',
  };

  const textLower = (answerText || '').toLowerCase();
  const hasDecisionSignal = ['because', 'we chose', 'so that', 'option'].some((k) =>
    textLower.includes(k)
  );

  const handleSave = () => {
    if (!answerText.trim() || saving) return;
    onSaveAnswer(question, answerText.trim());
    setIsEditing(false);
  };

  return (
    <div
      id={`question-${question.artifact_id}`}
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300"
    >
      {/* Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200/80">
            {index + 1}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
            {categoryLabels[question.gap_type] || question.gap_type}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 font-medium">
            {question.artifact_id}
          </span>
          <RiskBadge score={question.risk_score} size="sm" />
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mt-3.5">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Grounded Evidence Banner */}
      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-600">
        <FileText className="w-4 h-4 text-[#0EB8A0] shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="leading-relaxed">
            <span className="font-bold text-slate-800">Grounded Evidence: </span>
            <span className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200/80">
              {question.evidence}
            </span>
          </div>
          {question.rationale && (
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{question.rationale}</p>
          )}
        </div>
      </div>

      {/* Answer Area */}
      <div className="mt-4">
        {isSaved && !isEditing ? (
          /* Saved State */
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs fade-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-emerald-950 flex flex-wrap items-center gap-2">
                    <span>Answer captured &amp; indexed in knowledge graph</span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Linked to {question.artifact_id}
                    </span>
                  </div>
                  <blockquote className="mt-2 text-slate-800 italic bg-white/80 p-3 rounded-lg border border-emerald-100 text-xs sm:text-sm leading-relaxed">
                    &ldquo;{savedAnswer || answerText}&rdquo;
                  </blockquote>
                </div>
              </div>

              <button
                onClick={() => {
                  setAnswerText(savedAnswer || '');
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200 bg-white/90 transition shadow-2xs shrink-0 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ) : (
          /* Input Textarea */
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSave();
                  }
                }}
                placeholder="Type your explanation... (e.g. 'we chose 7 because the vendor API rate-limited us')"
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0] transition leading-relaxed"
              />
            </div>

            {/* Real-time Decision Signal Banner */}
            {hasDecisionSignal && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs fade-in">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="font-bold">Potential architectural decision detected:</span>
                <span className="text-purple-800">
                  This will be automatically extracted into the successor Decision Log.
                </span>
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="text-[11px] text-slate-400">
                <span>Tip: Press </span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600 font-semibold">
                  ⌘ + Enter
                </kbd>
                <span> to save</span>
              </div>

              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={handleSave}
                  disabled={!answerText.trim() || saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#071126] bg-[#18C6B0] hover:bg-[#0EB8A0] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
