import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  GitCommit,
  GitPullRequest,
  Clock,
  Check,
  X,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowRight,
  Layers
} from 'lucide-react';
import { echoApi } from '../../api';

export default function KnowledgeFreshnessMonitor({
  projectId,
  activeProject,
  currentUser,
  onOpenConnectModal
}) {
  const [overview, setOverview] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'needs_reverification' | 'fresh'
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchFreshnessData = async () => {
    try {
      const [ovRes, alertsRes, recRes] = await Promise.all([
        echoApi.getFreshnessOverview(projectId),
        echoApi.getFreshnessAlerts(projectId, false),
        echoApi.getFreshnessRecords(projectId)
      ]);
      setOverview(ovRes);
      setAlerts(alertsRes.alerts || []);
      setRecords(recRes.records || []);
    } catch (err) {
      console.error('Failed to load freshness data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchFreshnessData();
  }, [projectId]);

  const handleRunScan = async () => {
    setScanning(true);
    try {
      await echoApi.rescanFreshness(projectId);
      await fetchFreshnessData();
    } catch (err) {
      alert(`Freshness scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleVerifyRecord = async (recordType, recordId) => {
    setActionInProgress(`verify-${recordId}`);
    try {
      const verifier = currentUser?.full_name || 'Reviewer Lead';
      await echoApi.verifyFreshnessRecord(recordType, recordId, verifier);
      await fetchFreshnessData();
    } catch (err) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDismissAlert = async (alertId) => {
    setActionInProgress(`dismiss-${alertId}`);
    try {
      const dismisser = currentUser?.full_name || 'Reviewer Lead';
      await echoApi.dismissFreshnessAlert(alertId, dismisser);
      await fetchFreshnessData();
    } catch (err) {
      alert(`Dismiss failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredRecords = records.filter(r => {
    if (filter === 'needs_reverification') return r.freshness_status === 'needs_reverification';
    if (filter === 'fresh') return r.freshness_status === 'fresh' || !r.freshness_status;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200/90 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#0EB8A0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Knowledge Freshness Monitor
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  Continuous Maintenance
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">
                Documentation can become outdated even after a successful handover. Echo monitors recent GitHub commits and pull requests against verified decisions, alerting the team when implementation details drift.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleRunScan}
              disabled={scanning || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EB8A0] hover:bg-[#0c9a86] active:scale-95 text-white font-medium text-sm shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Scanning Commits...' : 'Run Freshness Scan'}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Freshness Health</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {overview ? `${overview.freshness_health_score}%` : '—'}
              </span>
              <span className={`text-xs font-semibold ${overview?.needs_reverification_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {overview?.needs_reverification_count > 0 ? 'Review Needed' : 'In Sync'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (overview?.freshness_health_score || 100) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${overview?.freshness_health_score || 100}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Records</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {overview?.fresh_records_count ?? '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Confirmed matching code</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Needs Re-verification</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {overview?.needs_reverification_count ?? 0}
            </div>
            <p className="text-xs text-amber-700 font-medium mt-1">Recent commit divergence</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Monitored</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {overview?.total_monitored_records ?? '—'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Decisions &amp; landmines</p>
          </div>
        </div>
      </div>

      {/* Freshness Alerts Feed (Contradictions between Documentation and Commits) */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Action Required: Code Drift Detected ({alerts.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Recent commits or PRs conflict with documented knowledge
            </span>
          </div>

          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white rounded-2xl border-2 border-amber-200/80 p-5 shadow-xs transition hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Documented Decision */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {alert.artifact_id || 'KNOWLEDGE-RECORD'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Needs Re-verification
                      </span>
                      <span className="text-xs text-slate-400">
                        Record ID: {alert.record_id}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {alert.title}
                    </h3>

                    <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-amber-400 text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900 block mb-1">Documented Statement:</span>
                      &ldquo;{alert.documented_statement}&rdquo;
                    </div>

                    {/* Mismatch Explanation */}
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Discrepancy: </span>
                        <span>{alert.mismatch_details}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Arrow Divider (on Desktop) */}
                  <div className="hidden lg:flex flex-col items-center justify-center px-2 pt-8 text-slate-300">
                    <ArrowRight className="w-5 h-5 text-amber-400" />
                  </div>

                  {/* Right: Conflicting Commit Evidence */}
                  <div className="w-full lg:w-96 p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <GitCommit className="w-3.5 h-3.5 text-[#18C6B0]" />
                        <span>Conflicting Commit Evidence</span>
                      </div>
                      <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">
                        {alert.contradicting_commit_id ? alert.contradicting_commit_id.slice(0, 10) : 'HEAD'}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-white bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                      &ldquo;{alert.contradicting_message}&rdquo;
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Committed by <strong className="text-slate-200">{alert.contradicting_author}</strong></span>
                      <span>{alert.created_at ? new Date(alert.created_at).toLocaleDateString() : 'Recent'}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleVerifyRecord(alert.record_type, alert.record_id)}
                        disabled={actionInProgress === `verify-${alert.record_id}`}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-[#0EB8A0] hover:bg-[#0c9a86] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="Confirm that the documentation is accurate or has been updated to reflect the new implementation"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{actionInProgress === `verify-${alert.record_id}` ? 'Updating...' : 'Re-verify Record'}</span>
                      </button>

                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        disabled={actionInProgress === `dismiss-${alert.id}`}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                        title="Dismiss alert if this commit does not impact the documented rule"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Monitored Knowledge Records List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Knowledge Records Inventory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuously tracked decisions and operational gotchas with last-verified timestamps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                All ({records.length})
              </button>
              <button
                onClick={() => setFilter('needs_reverification')}
                className={`px-3 py-1 rounded-lg transition ${
                  filter === 'needs_reverification' ? 'bg-white text-amber-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Needs Review ({records.filter(r => r.freshness_status === 'needs_reverification').length})
              </button>
              <button
                onClick={() => setFilter('fresh')}
                className={`px-3 py-1 rounded-lg transition ${
                  filter === 'fresh' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Fresh ({records.filter(r => r.freshness_status !== 'needs_reverification').length})
              </button>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No knowledge records match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((r) => {
              const isNeedsReview = r.freshness_status === 'needs_reverification';
              return (
                <div key={`${r.record_type}-${r.id}`} className="p-4 sm:p-5 hover:bg-slate-50/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          {r.artifact_id}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          {r.record_type}
                        </span>
                        {isNeedsReview ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Needs Re-verification</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Fresh &amp; Verified</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {r.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {r.details}
                      </p>

                      {r.mismatch_reason && (
                        <div className="mt-1 text-xs text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                          <strong>Conflict: </strong>{r.mismatch_reason}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <div className="text-right text-[11px] text-slate-400">
                        <div>Last Verified:</div>
                        <span className="font-medium text-slate-600">
                          {r.last_verified_at ? new Date(r.last_verified_at).toLocaleDateString() : 'Initial'}
                        </span>
                        {r.last_verified_by && (
                          <span className="block text-[10px] text-slate-400">by {r.last_verified_by}</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleVerifyRecord(r.record_type, r.id)}
                        disabled={actionInProgress === `verify-${r.id}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-teal-600" />
                        <span>Verify Freshness</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

