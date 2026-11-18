import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Edit3,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  AlertTriangle,
  Repeat,
  Volume2,
  Trash2,
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export default function InterviewQuestionCard({
  question,
  index,
  savedAnswer,
  isSaved,
  onSaveAnswer,
  saving,
  onClearAnswer,
  clearing,
}) {
  const [answerText, setAnswerText] = useState(savedAnswer || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const categoryLabels = {
    undocumented_single_owner: 'Undocumented & Single Owner',
    unexplained_change: 'Unexplained Change',
    solo_external_contact: 'Solo External Relationship',
    quiet_failure: 'Quiet Failure Mode',
  };

  const textLower = (answerText || '').toLowerCase();
  const hasDecisionSignal = ['because', 'we chose', 'we decided', 'so that', 'option', 'instead of', 'tradeoff'].some((k) =>
    textLower.includes(k)
  );
  const hasLandmineSignal = ['fails silently', 'silent failure', 'be careful', 'danger', 'gotcha', 'landmine', 'crash', 'memory leak', 'timeout', 'deadlock', 'broke'].some((k) =>
    textLower.includes(k)
  );
  const hasOpenLoopSignal = ['unfinished', 'half-done', 'still pending', 'need to migrate', 'open loop', 'todo', 'haven\'t finished', 'next step'].some((k) =>
    textLower.includes(k)
  );

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setAnswerText((prev) => {
          const base = prev.endsWith(' ') || prev.length === 0 ? prev : prev + ' ';
          return transcript.trim();
        });
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleSave = () => {
    if (isRecording && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsRecording(false);
    }
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

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAnswerText(savedAnswer || '');
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-200 bg-white/90 transition shadow-2xs shrink-0 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAnswer) onClearAnswer(question);
                    setAnswerText('');
                  }}
                  disabled={clearing}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 bg-white transition shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                  title="Clear and reset this answer"
                >
                  {clearing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{clearing ? 'Clearing...' : 'Clear'}</span>
                </button>
              </div>
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
                placeholder="Type your explanation or click the microphone to speak... (e.g. 'we chose 7 because the vendor API rate-limited us')"
                className={`w-full rounded-xl border bg-white p-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition leading-relaxed ${
                  isRecording
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : 'border-slate-200 focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0]'
                }`}
              />

              {/* Floating Voice Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-3 bottom-3 p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300'
                }`}
                title={isRecording ? 'Stop recording' : 'Speak your answer (Voice exit interview)'}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-teal-600" />
                    <span className="hidden sm:inline">Voice Answer</span>
                  </>
                )}
              </button>
            </div>

            {/* Voice Active Telemetry Wave */}
            {isRecording && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold">Echo Voice Transcribing:</span>
                  <span className="text-rose-700">Listening to hands-free speech...</span>
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="px-2.5 py-0.5 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold text-[11px] cursor-pointer"
                >
                  Done Speaking
                </button>
              </div>
            )}

            {/* Real-time Extracted Signals (Sleek Inline Pill Row) */}
            {(hasDecisionSignal || hasLandmineSignal || hasOpenLoopSignal) && (
              <div className="flex flex-wrap items-center gap-2 pt-1 fade-in">
                <span className="text-[11px] font-semibold text-slate-400">Signals detected:</span>
                {hasDecisionSignal && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>Architectural Decision</span>
                  </span>
                )}
                {hasLandmineSignal && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Silent Landmine</span>
                  </span>
                )}
                {hasOpenLoopSignal && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    <Repeat className="w-3 h-3 text-amber-600" />
                    <span>Open Loop</span>
                  </span>
                )}
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
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {/* Clear Option when editing */}
                {isSaved ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearAnswer) onClearAnswer(question);
                      setAnswerText('');
                      setIsEditing(false);
                    }}
                    disabled={clearing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition cursor-pointer disabled:opacity-50"
                    title="Delete saved answer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{clearing ? 'Clearing...' : 'Clear Answer'}</span>
                  </button>
                ) : answerText.trim() ? (
                  <button
                    type="button"
                    onClick={() => setAnswerText('')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    title="Clear text field"
                  >
                    <span>Clear Text</span>
                  </button>
                ) : null}

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
