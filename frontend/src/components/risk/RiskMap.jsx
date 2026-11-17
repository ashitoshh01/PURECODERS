import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  Target,
  FileCode2,
  RefreshCw,
  HelpCircle,
  X,
  AlertTriangle,
  ArrowRight,
  FileCode,
  GitPullRequest,
  Ticket,
  MessageSquare,
  FileText,
  Sliders,
} from 'lucide-react';
import MetricCard from '../common/MetricCard';
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
  const [driftAlerts, setDriftAlerts] = useState([]);
  const [rescanning, setRescanning] = useState(false);

  const loadData = async (repoOverride = selectedRepoId) => {
    setLoading(true);
    setErr(null);
    try {
      const pId = activeProject?.id;
      const [riskRes, artRes, driftRes] = await Promise.all([
        echoApi.getRiskMap(pId, repoOverride || null),
        echoApi.getArtifacts(pId).catch(() => ({ artifacts: [], edges: [] })),
        echoApi.getDriftAlerts(pId).catch(() => ({ alerts: [] })),
      ]);
      setData(riskRes);
      setGraphData(artRes);
      setDriftAlerts(driftRes.alerts || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?.id, refreshKey, selectedRepoId]);

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

  const handleResolveAlert = async (alertId) => {
    try {
      await echoApi.resolveDriftAlert(alertId);
      setDriftAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (e) {
      alert(`Failed to resolve alert: ${e.message}`);
    }
  };

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

  // Derive top priority attention items from real data (top 3 highest risk artifacts)
  const priorityItems = useMemo(() => {
    if (!data?.artifacts || data.artifacts.length === 0) return [];
    return [...data.artifacts]
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 3);
  }, [data]);

  const typeIcons = {
    module: FileCode,
    script: FileCode,
    config: FileCode,
    pull_request: GitPullRequest,
    ticket: Ticket,
    chat_thread: MessageSquare,
    document: FileText,
  };

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

      {/* Continuous Monitoring: Knowledge Drift Alerts Banner */}
      {driftAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/90 rounded-2xl p-4 shadow-xs space-y-3 fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Continuous Monitoring: Knowledge Drift Detected ({driftAlerts.length} Active Alerts)</span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              Pre-notice Warning
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {driftAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white/90 p-3 rounded-xl border border-amber-200/80 text-xs flex items-start justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                      {alert.artifact_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                        alert.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {alert.alert_type === 'stale_knowledge' ? 'Stale Code Drift' : 'Concentration Spike'}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">{alert.message}</p>
                </div>

                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
                  title="Acknowledge and dismiss drift alert"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Metric KPI Cards (Standalone numerals & consistent badge placement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="High-Risk Artifacts"
          value={data?.high_risk_count ?? 0}
          subtext="Artifacts requiring immediate attention (≥30% score)"
          icon={ShieldAlert}
          accent="rose"
          badge={data?.high_risk_count > 0 ? 'Action required' : 'Low exposure'}
        />

        <MetricCard
          label="Bus-Factor = 1 Hotspots"
          value={data?.bus_factor_violations?.length ?? 0}
          subtext="Modules with concentrated single ownership"
          icon={Users}
          accent="amber"
          badge={data?.bus_factor_violations?.length > 0 ? 'Single owner' : 'Redundant'}
        />

        <MetricCard
          label="Identified Knowledge Gaps"
          value={
            data?.gaps_planted && data.gaps_planted.length > 0
              ? data.gaps_detected?.length ?? 0
              : data?.high_risk_count ?? 0
          }
          subtext={
            data?.gaps_planted && data.gaps_planted.length > 0
              ? `Out of ${data.gaps_planted.length} benchmark planted gaps`
              : 'Gaps requiring exit interview coverage'
          }
          icon={Target}
          accent="teal"
          badge={data?.gaps_planted && data.gaps_planted.length > 0 ? 'Benchmark' : 'Live'}
        />

        <MetricCard
          label="Total Monitored Artifacts"
          value={data?.artifacts?.length ?? 0}
          subtext={`Tracked across ${repoName}`}
          icon={FileCode2}
          accent="blue"
        />
      </div>

      {/* Compact Horizontal Overview Strip (Reclaims vertical space) */}
      <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="pt-2 md:pt-0">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Risk Severity Breakdown
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-rose-700">{stats.high} Critical</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-amber-800">{stats.med} Elevated</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-emerald-800">{stats.low} Low</span>
            </div>
          </div>

          <div className="pt-2 md:pt-0 md:pl-4">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Avg Leaver Ownership
            </span>
            <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
              {stats.avgOwnership}%
            </span>
          </div>

          <div className="pt-2 md:pt-0 md:pl-4">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Avg Documentation Gap
            </span>
            <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
              {stats.avgDocGap}%
            </span>
          </div>

          <div className="pt-2 md:pt-0 md:pl-4">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Tracked Contributor
            </span>
            <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
              {leaverName}
            </span>
          </div>
        </div>
      </div>

      {/* Priority Attention Section (Guides project leads to immediate risks) */}
      {priorityItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Priority Attention Hotspots
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Top 3 modules requiring documentation before handover
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {priorityItems.map((item, idx) => {
              const Icon = typeIcons[item.type] || FileCode;
              return (
                <div
                  key={item.artifact_id}
                  onClick={() => setSelectedArtifact(item)}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                          <Icon className="w-3.5 h-3.5 text-slate-700" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-900 transition">
                          {item.title}
                        </span>
                      </div>
                      <RiskBadge pct={item.risk_pct} size="sm" showLabel={false} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.artifact_id}
                      </span>
                      {item.bus_factor_one && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          Bus factor 1
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                      <div>
                        Ownership: <span className="font-semibold text-slate-800">{Math.round((item.components?.ownership_concentration ?? 0) * 100)}%</span> · Doc gap: <span className="font-semibold text-slate-800">{Math.round((item.components?.doc_gap ?? 0) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-teal-800 group-hover:text-teal-950 flex items-center gap-1">
                      <span>Inspect Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                    {onNavigateToInterview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToInterview(item.artifact_id);
                        }}
                        className="text-slate-400 hover:text-slate-700 underline cursor-pointer"
                      >
                        Interview
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
