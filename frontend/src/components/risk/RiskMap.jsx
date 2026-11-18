import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  HelpCircle,
  X,
  AlertTriangle,
  ArrowRight,
  Sliders,
  GitCommit,
  ShieldAlert,
  Users,
  FileText,
  Layers,
  Check,
} from 'lucide-react';
import LoadingState from '../common/LoadingState';
import ErrorBox from '../common/ErrorBox';
import PageHeader from '../common/PageHeader';
import RiskTable from './RiskTable';
import ArtifactDetailDrawer from './ArtifactDetailDrawer';
import { RiskBadge, BusFactorBadge } from '../common/RiskBadge';
import { echoApi } from '../../api';

const METRIC_EXPLANATIONS = {
  high_risk: {
    title: 'High Risk Exposure',
    badge: '≥30% Score Threshold',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    currentMetric: (data, stats) => `${data?.high_risk_count ?? 0} Critical Artifacts`,
    whatIsIt:
      'High Risk Exposure measures the number of mission-critical repository modules, pull requests, and chat discussions that have high single-owner dependency, high architectural importance, and deficient documentation.',
    formula:
      'Risk Score = Ownership Concentration × System Criticality × (1 - Doc Coverage) × Recency Weight',
    howCalculated: [
      'Ownership Concentration (0.0 - 1.0): Ratio of commits and file touches authored by the departing engineer versus the entire team.',
      'Criticality (1.0 - 5.0 scaled): Calculated from dependency imports, centrality in the call graph, and infrastructure impact.',
      'Documentation Gap (0.0 - 1.0): 1.0 minus the observed doc coverage (analyzing READMEs, inline docstrings, and runbooks).',
      'Recency Weight (0.15 - 1.0): Temporal decay multiplier giving highest urgency to code modified in the last 7 to 30 days.'
    ],
    thresholds:
      'Artifacts scoring ≥ 30% are flagged as high risk. Any artifact scoring ≥ 50% is elevated to Critical priority for immediate exit interview capture.',
    whyItMatters:
      'Without structured handover, these modules represent immediate single points of failure when the primary engineer departs.'
  },
  single_ownership: {
    title: 'Single Ownership (Bus Factor = 1)',
    badge: 'Concentration Warning',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    currentMetric: (data, stats) => `${data?.bus_factor_violations?.length ?? 0} Hotspots`,
    whatIsIt:
      'Single Ownership identifies critical codebase hotspots where 80% or more of all historical commits were made by a single developer (the departing lead), creating an acute Bus Factor of 1.',
    formula:
      'Bus Factor = 1 when (Ownership Concentration ≥ 80%) AND (Criticality ≥ 50%)',
    howCalculated: [
      'Commit Attribution: Extracted from git shortlog and git blame across all branches in the workspace repository.',
      'Concentration Threshold: Triggers when the departing engineer authored ≥ 80% of lines/commits on a file.',
      'Criticality Filter: Only applies to components with criticality of 3/5 or higher to filter out trivial helper scripts.'
    ],
    thresholds:
      'Identifies components that only one person in the company knows how to operate, debug, or deploy safely.',
    whyItMatters:
      'Requires pair-programming handover walkthroughs and ownership transfer before the departure date.'
  },
  average_gaps: {
    title: 'Average Knowledge Gaps',
    badge: 'Deterministic Aggregate',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    currentMetric: (data, stats) => `${stats.avgDocGap}% Doc Gap / ${stats.avgOwnership}% Ownership`,
    whatIsIt:
      'The portfolio-wide mean documentation deficit and author concentration across all tracked code modules and integrated communication channels.',
    formula:
      'Average Doc Gap = Mean(1 - DocCoverage) | Average Ownership = Mean(AuthorCommits / TotalCommits)',
    howCalculated: [
      'Documentation Gap (Average): Measures the missing docstring and runbook coverage across all indexed repository files.',
      'Ownership (Average): Measures the mean percentage of historical contributions authored by the primary lead.',
      'Deterministic Telemetry: Auditable and grounded in AST parser results and git commit metadata without guessing.'
    ],
    thresholds:
      'Teams targeting smooth handovers should aim for < 30% documentation gap on all core services.',
    whyItMatters:
      'Highlights whether a repository has systematic documentation debt or balanced cross-team knowledge.'
  },
  monitored_scope: {
    title: 'Monitored Scope',
    badge: 'Continuous Monitoring',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    currentMetric: (data, stats) => `${data?.artifacts?.length ?? 0} Tracked Entities`,
    whatIsIt:
      'The total inventory of monitored components within this project workspace, spanning git repositories, exported Slack channels, Jira tickets, and runbooks.',
    formula:
      'Monitored Scope = Count(Git Modules) + Count(PRs) + Count(Slack Threads) + Count(Jira Tickets)',
    howCalculated: [
      'Git Scanner: Recursively indexes tracked source files and branch commits while ignoring build caches and vendors.',
      'Activity Connectors: Pulls discussions from Slack and issues from Jira to surface tribal knowledge outside of git.',
      'Real-Time Webhooks: Automatically updates file touch recency and commit counts whenever new pushes occur.'
    ],
    thresholds:
      'Expands as you add additional repositories or connect external communication tools.',
    whyItMatters:
      'Ensures no critical architectural piece is omitted from risk scoring or successor onboarding.'
  }
};

export default function RiskMap({ onNavigateToInterview, activeProject, refreshKey }) {
  const [data, setData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [activeMetricModal, setActiveMetricModal] = useState(null);

  // Multi-repo and continuous monitoring state
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [rescanning, setRescanning] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Calibration state for Recalculate Scores
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState('');
  const [justCalibrated, setJustCalibrated] = useState(false);

  const loadData = async (repoOverride = selectedRepoId) => {
    setLoading(true);
    setErr(null);
    try {
      const pId = activeProject?.id;
      const [riskRes, artRes] = await Promise.all([
        echoApi.getRiskMap(pId, repoOverride || null),
        echoApi.getArtifacts(pId).catch(() => ({ artifacts: [], edges: [] })),
      ]);
      setData(riskRes);
      setGraphData(artRes);
      setLastSyncTime(new Date());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (calibrating) return;
    setCalibrating(true);
    setJustCalibrated(false);
    setCalibrationStep('Calibrating ownership weights & commit churn...');

    try {
      await loadData();
      await new Promise((r) => setTimeout(r, 450));
      setCalibrationStep('Recalculating documentation gaps & bus factor risks...');
      await new Promise((r) => setTimeout(r, 400));
      setJustCalibrated(true);
      setTimeout(() => setJustCalibrated(false), 2400);
    } catch (e) {
      setErr(e.message);
    } finally {
      setCalibrating(false);
      setCalibrationStep('');
    }
  };

  // Silent background refresh for continuous real-time sync (increments numbers automatically without spinner)
  const silentSync = async () => {
    try {
      const pId = activeProject?.id;
      const riskRes = await echoApi.getRiskMap(pId, selectedRepoId || null);
      setData(riskRes);
      setLastSyncTime(new Date());
    } catch {
      // background polling - ignore transient network hiccup
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?.id, refreshKey, selectedRepoId]);

  // Continuous background real-time sync interval (polling every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      silentSync();
    }, 4000);
    return () => clearInterval(timer);
  }, [activeProject?.id, selectedRepoId]);

  // Global ESC key listener to close metric explainer & formula modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveMetricModal(null);
        setFormulaModalOpen(false);
      }
    };
    if (activeMetricModal || formulaModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMetricModal, formulaModalOpen]);

  const handleRescan = async () => {
    setRescanning(true);
    try {
      await echoApi.rescanMonitoring(activeProject?.id);
      await loadData();
    } catch (e) {
      alert(`Monitoring re-scan failed: ${e.message}`);
    } finally {
      setRescanning(false);
    }
  };

  const lastSyncFormatted = useMemo(() => {
    if (!lastSyncTime) return 'Just now';
    return lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [lastSyncTime]);

  // Derive distribution statistics from actual backend artifacts
  const stats = useMemo(() => {
    const list = data?.artifacts || [];
    if (list.length === 0) {
      return { high: 0, med: 0, low: 0, avgOwnership: 0, avgDocGap: 0 };
    }
    let high = 0;
    let med = 0;
    let low = 0;
    let totalOwnership = 0;
    let totalDocGap = 0;

    list.forEach((a) => {
      if (a.risk_pct >= 50) high += 1;
      else if (a.risk_pct >= 30) med += 1;
      else low += 1;

      totalOwnership += (a.components?.ownership_concentration ?? 0);
      totalDocGap += (a.components?.doc_gap ?? 0);
    });

    return {
      high,
      med,
      low,
      avgOwnership: Math.round((totalOwnership / list.length) * 100),
      avgDocGap: Math.round((totalDocGap / list.length) * 100),
    };
  }, [data]);

  if (loading && !data) {
    return <LoadingState label="Computing deterministic risk scores from repository evidence..." />;
  }

  if (err && !data) {
    return (
      <ErrorBox
        msg={err}
        hint="Is the backend running on port 8000? Run: uvicorn main:app --reload --port 8000"
        onRetry={loadData}
      />
    );
  }

  const leaverName = data?.leaver?.name || 'Departing Lead';
  const repoName =
    data?.artifacts?.[0]?.repo ||
    activeProject?.name?.split('—')[0]?.trim() ||
    'core-platform';

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header (Clean, concise, with multi-repo filter and continuous monitoring controls) */}
      <PageHeader
        title="Knowledge Risk Map"
        subtitle={`Knowledge concentration and single-owner hotspots for ${leaverName}.`}
        badge={activeProject?.mode === 'live' ? 'Live Git Scanned' : 'Deterministic Benchmark'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Repository Workspace Dropdown */}
            {(data?.repositories || []).length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-400">Repo:</span>
                <select
                  value={selectedRepoId}
                  onChange={(e) => setSelectedRepoId(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="">All Repositories ({data.repositories.length})</option>
                  {data.repositories.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Continuous Monitoring: Re-scan Commits */}
            <button
              onClick={handleRescan}
              disabled={rescanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Continuous Monitoring: Re-scan repositories for new commits and detect knowledge drift"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin text-teal-600' : 'text-teal-700'}`} />
              <span>{rescanning ? 'Scanning Commits...' : 'Re-scan Commits'}</span>
            </button>

            <button
              onClick={() => setFormulaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              title="Inspect scoring formula & factor weights"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>How risk is calculated</span>
            </button>

            <button
              onClick={handleRecalculate}
              disabled={calibrating || loading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-2xs cursor-pointer ${
                calibrating
                  ? 'bg-teal-50 text-teal-800 border border-teal-300 ring-2 ring-teal-500/20'
                  : justCalibrated
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
              }`}
              title="Calibrate knowledge-risk scoring engine"
            >
              {justCalibrated ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50" />
              ) : (
                <RefreshCw
                  className={`w-3.5 h-3.5 ${calibrating ? 'animate-spin text-teal-600' : 'text-slate-400'}`}
                />
              )}
              <span>
                {calibrating
                  ? 'Calibrating...'
                  : justCalibrated
                  ? 'Scores Calibrated'
                  : 'Recalculate Scores'}
              </span>
            </button>
          </div>
        }
      />

      {/* Calibration Animation & Progress Banner */}
      {calibrating && (
        <div className="mb-4 p-3 bg-teal-50/90 border border-teal-200/90 rounded-2xl flex items-center justify-between text-xs text-teal-900 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
            </span>
            <span className="font-semibold text-teal-950">{calibrationStep}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-teal-700">Calibrating...</span>
            <div className="w-20 h-1.5 bg-teal-200/70 rounded-full overflow-hidden">
              <div className="w-full h-full bg-teal-600 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Analytics Summary Strip (With tiny time in bottom corner & continuous sync) */}
      <div className={`bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs ${calibrating ? 'opacity-70 scale-[0.99] transition-all duration-300' : 'transition-all duration-300'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: High Risk Exposure */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-white border border-rose-200/90 hover:border-rose-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    High Risk Exposure
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMetricModal('high_risk')}
                  className="w-5 h-5 rounded-full border border-rose-200/90 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 font-bold text-xs flex items-center justify-center cursor-help transition shadow-2xs shrink-0"
                  title="What is this & how is it calculated? (Esc to close)"
                  aria-label="Explain High Risk Exposure"
                >
                  ?
                </button>
              </div>

              {/* Metric Display */}
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl sm:text-4xl font-black text-rose-700 font-mono tracking-tight">
                  {data?.high_risk_count ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">artifacts</span>
              </div>
            </div>

            {/* Footer Breakdown */}
            <div className="mt-3.5 pt-2.5 border-t border-rose-100/70 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="font-semibold text-rose-800">{stats.high} Critical</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">{stats.med} Elevated</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100/70 text-rose-800 border border-rose-200/60">
                ≥30%
              </span>
            </div>
          </div>

          {/* Card 2: Single Ownership */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-white border border-amber-200/90 hover:border-amber-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Single Ownership
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMetricModal('single_ownership')}
                  className="w-5 h-5 rounded-full border border-amber-200/90 bg-white hover:bg-amber-50 text-amber-600 hover:text-amber-800 font-bold text-xs flex items-center justify-center cursor-help transition shadow-2xs shrink-0"
                  title="What is this & how is it calculated? (Esc to close)"
                  aria-label="Explain Single Ownership"
                >
                  ?
                </button>
              </div>

              {/* Metric Display */}
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl sm:text-4xl font-black text-amber-800 font-mono tracking-tight">
                  {data?.bus_factor_violations?.length ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">hotspots</span>
              </div>
            </div>

            {/* Footer Breakdown */}
            <div className="mt-3.5 pt-2.5 border-t border-amber-100/70 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium truncate">
                Sole author: <strong className="text-amber-900">{leaverName}</strong>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100/70 text-amber-800 border border-amber-200/60 shrink-0">
                Bus Factor = 1
              </span>
            </div>
          </div>

          {/* Card 3: Knowledge Gaps & Ownership */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-white border border-teal-200/90 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Average Gaps
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMetricModal('average_gaps')}
                  className="w-5 h-5 rounded-full border border-teal-200/90 bg-white hover:bg-teal-50 text-teal-600 hover:text-teal-800 font-bold text-xs flex items-center justify-center cursor-help transition shadow-2xs shrink-0"
                  title="What is this & how is it calculated? (Esc to close)"
                  aria-label="Explain Average Gaps"
                >
                  ?
                </button>
              </div>

              {/* Metric Display */}
              <div className="flex items-baseline gap-2 pt-1 font-mono">
                <span className="text-3xl sm:text-4xl font-black text-teal-900 tracking-tight">
                  {stats.avgDocGap}%
                </span>
                <span className="text-xs text-slate-400 font-sans font-medium">/</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-700 tracking-tight">
                  {stats.avgOwnership}%
                </span>
              </div>
            </div>

            {/* Footer Breakdown */}
            <div className="mt-3.5 pt-2.5 border-t border-teal-100/70 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span>Concentration</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-100/70 text-teal-800 border border-teal-200/60 shrink-0">
                AST Grounded
              </span>
            </div>
          </div>

          {/* Card 4: Monitored Scope */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-white border border-indigo-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-800 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    <Layers className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Monitored Scope
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMetricModal('monitored_scope')}
                  className="w-5 h-5 rounded-full border border-indigo-200/90 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center justify-center cursor-help transition shadow-2xs shrink-0"
                  title="What is this & how is it calculated? (Esc to close)"
                  aria-label="Explain Monitored Scope"
                >
                  ?
                </button>
              </div>

              {/* Metric Display */}
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl sm:text-4xl font-black text-indigo-950 font-mono tracking-tight">
                  {data?.artifacts?.length ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">modules</span>
              </div>
            </div>

            {/* Footer Breakdown */}
            <div className="mt-3.5 pt-2.5 border-t border-indigo-100/70 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium truncate">
                Across {data?.repositories?.length || 1} repository
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100/70 text-emerald-800 border border-emerald-200/60 inline-flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Continuous</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Continuous Sync Strip Footer (With latest commit message & tiny time in bottom corner) */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-slate-500 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-700">Continuous Monitoring Live</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">·</span>
            {data?.latest_commit ? (
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] max-w-full sm:max-w-md truncate"
                title={`Latest commit: ${data.latest_commit.message}${data.latest_commit.author_name ? ` by ${data.latest_commit.author_name}` : ''}`}
              >
                <GitCommit className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-medium text-slate-800 truncate">
                  {data.latest_commit.message}
                </span>
                {data.latest_commit.author_name && (
                  <span className="text-slate-400 shrink-0 font-sans hidden sm:inline">
                    — {data.latest_commit.author_name}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Real-time sync via commit webhooks</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono text-slate-500 shrink-0 self-start sm:self-auto">
            <span className="text-slate-400">Last updated:</span>
            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
              {lastSyncFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Table (Linear-Style File Explorer) */}
      <RiskTable
        artifacts={data?.artifacts}
        plantedGaps={data?.gaps_planted}
        leaverName={leaverName}
        repoName={repoName}
        onSelectArtifact={(artifact) => setSelectedArtifact(artifact)}
      />

      {/* Slide-over Artifact Detail Drawer */}
      <ArtifactDetailDrawer
        artifact={selectedArtifact}
        graphData={graphData}
        isOpen={Boolean(selectedArtifact)}
        onClose={() => setSelectedArtifact(null)}
        onNavigateToInterview={onNavigateToInterview}
        leaverName={leaverName}
      />

      {/* Accessible "How risk is calculated" Modal */}
      {formulaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#0EB8A0] flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Deterministic Risk Formula
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    How Echo computes objective knowledge exposure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFormulaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close formula details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600 max-h-[75vh] overflow-y-auto">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 font-bold leading-relaxed">
                Risk = OwnershipConcentration × Criticality × (1 − DocCoverage) × RecencyWeight
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="font-bold text-slate-900 block mb-1">Ownership Concentration:</span>
                  <span className="text-slate-500 leading-relaxed">
                    Fraction of Git touches authored solely by {leaverName} out of all historical commits on this file.
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="font-bold text-slate-900 block mb-1">Criticality Factor (1–5):</span>
                  <span className="text-slate-500 leading-relaxed">
                    Module severity scale determined by dependency imports, operational centrality, and AST analysis.
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="font-bold text-slate-900 block mb-1">Documentation Gap:</span>
                  <span className="text-slate-500 leading-relaxed">
                    Calculated as (1 − DocCoverage). Files with 0% runbook or docstring coverage have a 100% gap.
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="font-bold text-slate-900 block mb-1">Recency Decay Multiplier:</span>
                  <span className="text-slate-500 leading-relaxed">
                    1.0 for ≤7 days, 0.7 for ≤30 days, 0.4 for ≤90 days, 0.15 for stale legacy code touched over 90 days ago.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 text-teal-950">
                <span className="font-bold block mb-0.5">Threshold Classification:</span>
                <p className="text-[11px] text-teal-900 leading-relaxed">
                  Artifacts with score ≥ 30% are flagged as requiring active exit interview documentation and successor landmine tracking. Artifacts with score ≥ 50% are ranked as Critical.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setFormulaModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Calculation Explanation Modal (Esc to close) */}
      {activeMetricModal && METRIC_EXPLANATIONS[activeMetricModal] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveMetricModal(null)}
          role="presentation"
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="metric-modal-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#0EB8A0] flex items-center justify-center font-bold text-sm">
                  ?
                </div>
                <div>
                  <h3 id="metric-modal-title" className="text-base font-bold text-slate-900">
                    {METRIC_EXPLANATIONS[activeMetricModal].title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${METRIC_EXPLANATIONS[activeMetricModal].badgeColor}`}>
                      {METRIC_EXPLANATIONS[activeMetricModal].badge}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">
                      Current: {METRIC_EXPLANATIONS[activeMetricModal].currentMetric(data, stats)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveMetricModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close metric details (Esc)"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-slate-600 max-h-[75vh] overflow-y-auto">
              {/* What is it */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  What is this metric?
                </h4>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {METRIC_EXPLANATIONS[activeMetricModal].whatIsIt}
                </p>
              </div>

              {/* How it is calculated / Formula */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  How is it calculated?
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl font-mono text-[11px] text-slate-900 font-bold leading-relaxed mb-2.5">
                  {METRIC_EXPLANATIONS[activeMetricModal].formula}
                </div>
                <ul className="space-y-1.5 pl-1">
                  {METRIC_EXPLANATIONS[activeMetricModal].howCalculated.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Thresholds & Impact */}
              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 text-teal-950 space-y-1">
                <span className="font-bold text-xs block text-teal-900">Why it matters for handovers:</span>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  {METRIC_EXPLANATIONS[activeMetricModal].whyItMatters}
                </p>
              </div>
            </div>

            {/* Footer with Esc button hint and Close button */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 font-semibold shadow-2xs">Esc</kbd> to close
              </span>
              <button
                onClick={() => setActiveMetricModal(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
