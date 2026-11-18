import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  HelpCircle,
  X,
  AlertTriangle,
  ArrowRight,
  Sliders,
  GitCommit,
} from 'lucide-react';
import LoadingState from '../common/LoadingState';
import ErrorBox from '../common/ErrorBox';
import PageHeader from '../common/PageHeader';
import RiskTable from './RiskTable';
import ArtifactDetailDrawer from './ArtifactDetailDrawer';
import { RiskBadge, BusFactorBadge } from '../common/RiskBadge';
import { echoApi } from '../../api';

export default function RiskMap({ onNavigateToInterview, activeProject, refreshKey }) {
  const [data, setData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);

  // Multi-repo and continuous monitoring state
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [rescanning, setRescanning] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

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
              onClick={() => loadData()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0EB8A0]' : 'text-slate-400'}`}
              />
              <span>Recalculate Scores</span>
            </button>
          </div>
        }
      />

      {/* Unified Analytics Summary Strip (With tiny time in bottom corner & continuous sync) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Tile 1: High Risk Exposure */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                High Risk Exposure
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                ≥30% Score
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {data?.high_risk_count ?? 0}
              </span>
              <span className="text-xs text-slate-500">artifacts</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <span className="font-semibold text-rose-600">{stats.high} Critical</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-amber-600">{stats.med} Elevated</span>
            </div>
          </div>

          {/* Tile 2: Bus Factor Hotspots */}
          <div className="space-y-1 sm:pl-4 pt-3 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Single Ownership
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Bus Factor = 1
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {data?.bus_factor_violations?.length ?? 0}
              </span>
              <span className="text-xs text-slate-500">hotspots</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate pt-0.5">
              Concentrated knowledge with {leaverName}
            </p>
          </div>

          {/* Tile 3: Knowledge Gaps & Ownership */}
          <div className="space-y-1 sm:pl-4 pt-3 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Average Gaps
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Deterministic
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {stats.avgDocGap}%
                </span>
                <span className="text-[11px] text-slate-500">Doc Gap</span>
              </div>
              <span className="text-slate-300">/</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-slate-800 font-mono">
                  {stats.avgOwnership}%
                </span>
                <span className="text-[11px] text-slate-500">Ownership</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              Based on git blame &amp; documentation depth
            </p>
          </div>

          {/* Tile 4: Monitored Scope */}
          <div className="space-y-1 sm:pl-4 pt-3 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Monitored Scope
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Continuous
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {data?.artifacts?.length ?? 0}
              </span>
              <span className="text-xs text-slate-500 truncate">modules &amp; channels</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate pt-0.5">
              Across repository <span className="font-semibold text-slate-700">{repoName}</span>
            </p>
          </div>
        </div>

        {/* Live Continuous Sync Strip Footer (With latest commit message & tiny time in bottom corner) */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-slate-500">
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-700">Continuous Monitoring Live</span>
            </div>
            <span className="text-slate-300">·</span>
            {data?.latest_commit ? (
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] max-w-md sm:max-w-lg truncate"
                title={`Latest commit: ${data.latest_commit.message}${data.latest_commit.author_name ? ` by ${data.latest_commit.author_name}` : ''}`}
              >
                <GitCommit className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-medium text-slate-800 truncate">
                  {data.latest_commit.message}
                </span>
                {data.latest_commit.author_name && (
                  <span className="text-slate-400 shrink-0 font-sans">
                    — {data.latest_commit.author_name}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">Real-time sync via commit webhooks</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono text-slate-500 sm:ml-auto self-end sm:self-auto shrink-0">
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
    </div>
  );
}
