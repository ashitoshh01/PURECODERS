import React, { useState, useEffect } from 'react';
import {
  Mic,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react';
import PageHeader from '../common/PageHeader';
import LoadingState from '../common/LoadingState';
import ErrorBox from '../common/ErrorBox';
import InterviewProgress from './InterviewProgress';
import InterviewQuestionCard from './InterviewQuestionCard';
import { echoApi } from '../../api';

export default function ExitInterview({ onAnswerSubmitted, focusArtifactId, activeProject, refreshKey }) {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [clearingId, setClearingId] = useState(null);
  const [err, setErr] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Reload calibration state
  const [reloading, setReloading] = useState(false);
  const [reloadStep, setReloadStep] = useState('');
  const [justReloaded, setJustReloaded] = useState(false);

  const loadQuestionsAndAnswers = async () => {
    setLoading(true);
    setErr(null);
    try {
      const pId = activeProject?.id;
      const [qData, aData] = await Promise.all([
        echoApi.getInterviewQuestions(6, pId),
        echoApi.getInterviewAnswers(pId).catch(() => ({ answers: [] })),
      ]);
      setData(qData);
      if (aData && aData.answers) {
        const savedMap = {};
        const answersMap = {};
        aData.answers.forEach((a) => {
          savedMap[a.question_id] = true;
          answersMap[a.question_id] = a.answer;
        });
        setSaved(savedMap);
        setAnswers(answersMap);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadQuestions = async () => {
    if (reloading) return;
    setReloading(true);
    setJustReloaded(false);
    setReloadStep('Analyzing tacit knowledge gaps & bus factor hotspots...');

    try {
      await loadQuestionsAndAnswers();
      await new Promise((r) => setTimeout(r, 450));
      setReloadStep('Calibrating prioritized architectural prompts & questions...');
      await new Promise((r) => setTimeout(r, 400));
      setJustReloaded(true);
      setTimeout(() => setJustReloaded(false), 2400);
    } catch (e) {
      setErr(e.message);
    } finally {
      setReloading(false);
      setReloadStep('');
    }
  };

  useEffect(() => {
    loadQuestionsAndAnswers();
  }, [activeProject?.id, refreshKey]);

  // If focusArtifactId was passed from Risk Map, scroll into view
  useEffect(() => {
    if (focusArtifactId && data) {
      setTimeout(() => {
        const el = document.getElementById(`question-${focusArtifactId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-[#18C6B0]');
          setTimeout(() => el.classList.remove('ring-2', 'ring-[#18C6B0]'), 2500);
        }
      }, 200);
    }
  }, [focusArtifactId, data]);

  const handleSubmitAnswer = async (q, answerText) => {
    setSavingId(q.id);
    try {
      await echoApi.submitInterviewAnswer({
        question_id: q.id,
        artifact_id: q.artifact_id,
        answer: answerText,
        submitted_by: data?.leaver?.name,
      });
      setSaved((prev) => ({ ...prev, [q.id]: true }));
      setAnswers((prev) => ({ ...prev, [q.id]: answerText }));
      if (onAnswerSubmitted) onAnswerSubmitted();
    } catch (e) {
      alert(`Failed to save answer: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleClearAnswer = async (q) => {
    setClearingId(q.id);
    try {
      await echoApi.clearInterviewAnswer(q.id);
      setSaved((prev) => {
        const next = { ...prev };
        delete next[q.id];
        return next;
      });
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[q.id];
        return next;
      });
      if (onAnswerSubmitted) onAnswerSubmitted();
    } catch (e) {
      alert(`Failed to clear answer: ${e.message}`);
    } finally {
      setClearingId(null);
    }
  };

  if (loading && !data) {
    return <LoadingState label="Generating grounded exit interview questions from git activity..." />;
  }

  if (err && !data) {
    return (
      <ErrorBox
        msg={err}
        hint="Ensure backend is running: uvicorn main:app --reload --port 8000"
        onRetry={loadQuestionsAndAnswers}
      />
    );
  }

  const answeredCount = Object.keys(saved).filter((k) => saved[k]).length;
  const totalQuestions = data?.questions?.length || 0;
  const leaverName = data?.leaver?.name || 'Departing Lead';

  // Filter questions
  const filteredQuestions = (data?.questions || []).filter((q) => {
    if (categoryFilter === 'all') return true;
    return q.gap_type === categoryFilter;
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <PageHeader
        title="Exit Interview Extraction"
        subtitle={`Grounded knowledge capture and architectural decision transfer for ${leaverName}.`}
        badge="Evidence Grounded"
        actions={
          <button
            onClick={handleReloadQuestions}
            disabled={reloading || loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-2xs cursor-pointer ${
              reloading
                ? 'bg-teal-50 text-teal-800 border border-teal-300 ring-2 ring-teal-500/20'
                : justReloaded
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
            }`}
            title="Calibrate and reload prioritized interview questions"
          >
            {justReloaded ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50" />
            ) : (
              <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
            )}
            <span>
              {reloading
                ? 'Calibrating Questions...'
                : justReloaded
                ? 'Questions Reloaded'
                : 'Reload Questions'}
            </span>
          </button>
        }
      />

      {/* Reload Animation & Progress Banner */}
      {reloading && (
        <div className="p-3 bg-teal-50/90 border border-teal-200/90 rounded-2xl flex items-center justify-between text-xs text-teal-900 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
            </span>
            <span className="font-semibold text-teal-950">{reloadStep}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-teal-700">Calibrating prompts...</span>
            <div className="w-20 h-1.5 bg-teal-200/70 rounded-full overflow-hidden">
              <div className="w-full h-full bg-teal-600 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Progress & Knowledge Extraction Bar */}
      <InterviewProgress
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        decisionCount={answeredCount}
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/90 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'undocumented_single_owner', label: 'Undocumented Modules' },
            { id: 'unexplained_change', label: 'Unexplained Changes' },
            { id: 'solo_external_contact', label: 'External Contacts' },
            { id: 'quiet_failure', label: 'Quiet Failures' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-teal-50 text-teal-800 border border-teal-200/90'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredQuestions.length} of {totalQuestions} prioritized prompts
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
            {totalQuestions === 0
              ? 'No exit interview questions generated yet. Questions will be generated once knowledge gaps are detected from ingested repository evidence.'
              : 'No questions generated for this filter category.'}
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <InterviewQuestionCard
              key={q.id}
              question={q}
              index={idx}
              savedAnswer={answers[q.id]}
              isSaved={Boolean(saved[q.id])}
              onSaveAnswer={handleSubmitAnswer}
              saving={savingId === q.id}
              onClearAnswer={handleClearAnswer}
              clearing={clearingId === q.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
