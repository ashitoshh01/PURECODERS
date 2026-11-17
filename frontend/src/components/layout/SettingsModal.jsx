import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Network,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Ticket,
  Loader2,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { echoApi } from '../../api';

export function SettingsModal({ isOpen, onClose, onScanLiveGit }) {
  const [connectors, setConnectors] = useState([]);
  const [loadingConn, setLoadingConn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState(null);

  // Slack Modal State
  const [slackModalOpen, setSlackModalOpen] = useState(false);
  const [slackToken, setSlackToken] = useState('');
  const [slackWorkspaceName, setSlackWorkspaceName] = useState('Core Slack Workspace');
  const [syncingSlack, setSyncingSlack] = useState(false);

  // Jira Modal State
  const [jiraModalOpen, setJiraModalOpen] = useState(false);
  const [jiraDomain, setJiraDomain] = useState('company.atlassian.net');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [syncingJira, setSyncingJira] = useState(false);

  const refreshConnectors = () => {
    setLoadingConn(true);
    echoApi.getConnectors()
      .then((res) => setConnectors(res.connectors || []))
      .catch(() => setConnectors([]))
      .finally(() => setLoadingConn(false));
  };

  useEffect(() => {
    if (isOpen) {
      refreshConnectors();
    }
  }, [isOpen]);

  const handleTriggerScan = async () => {
    setScanning(true);
    setScanMsg(null);
    try {
      const res = await echoApi.scanGitRepository('.');
      setScanMsg(`Successfully scanned ${res.artifacts_count} artifacts from current Git workspace!`);
      if (onScanLiveGit) onScanLiveGit();
    } catch (e) {
      setScanMsg(`Scan failed: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleConnectSlackToken = async (e) => {
    e.preventDefault();
    if (!slackToken.trim()) return;
    setSyncingSlack(true);
    try {
      await echoApi.connectSlackToken(slackToken.trim(), slackWorkspaceName.trim());
      const syncRes = await echoApi.syncSlack();
      setScanMsg(`Connected to Slack and ingested ${syncRes.ingested_count} discussion threads!`);
      setSlackModalOpen(false);
      setSlackToken('');
      refreshConnectors();
      if (onScanLiveGit) onScanLiveGit();
    } catch (err) {
      setScanMsg(`Slack connection failed: ${err.message}`);
    } finally {
      setSyncingSlack(false);
    }
  };

  const handleSyncSlack = async () => {
    setSyncingSlack(true);
    try {
      const syncRes = await echoApi.syncSlack();
      setScanMsg(`Slack sync complete: updated ${syncRes.ingested_count} discussion threads.`);
      refreshConnectors();
      if (onScanLiveGit) onScanLiveGit();
    } catch (err) {
      setScanMsg(`Slack sync failed: ${err.message}`);
    } finally {
      setSyncingSlack(false);
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      await echoApi.disconnectSlack();
      setScanMsg('Slack workspace disconnected.');
      refreshConnectors();
      if (onScanLiveGit) onScanLiveGit();
    } catch (err) {
      setScanMsg(`Disconnect failed: ${err.message}`);
    }
  };

  const handleConnectJiraToken = async (e) => {
    e.preventDefault();
    if (!jiraDomain.trim() || !jiraEmail.trim() || !jiraApiToken.trim()) return;
    setSyncingJira(true);
    try {
      await echoApi.connectJiraToken(jiraDomain.trim(), jiraEmail.trim(), jiraApiToken.trim());
      const syncRes = await echoApi.syncJira();
      setScanMsg(`Connected to Jira and ingested ${syncRes.ingested_count} issue tickets!`);
      setJiraModalOpen(false);
      setJiraApiToken('');
      refreshConnectors();
      if (onScanLiveGit) onScanLiveGit();
    } catch (err) {
      setScanMsg(`Jira connection failed: ${err.message}`);
    } finally {
      setSyncingJira(false);
    }
  };

  const handleSyncJira = async () => {
    setSyncingJira(true);
    try {
      const syncRes = await echoApi.syncJira();
      setScanMsg(`Jira sync complete: updated ${syncRes.ingested_count} issue tickets.`);
      refreshConnectors();
      if (onScanLiveGit) onScanLiveGit();
    } catch (err) {
      setScanMsg(`Jira sync failed: ${err.message}`);
    } finally {
      setSyncingJira(false);
    }
  };

  const handleDisconnectJira = async () => {
    try {
      await echoApi.disconnectJira();
      setScanMsg('Atlassian Jira disconnected.');
      refreshConnectors();
      if (onScanLiveGit) onScanLiveGit();
    } catch (err) {
      setScanMsg(`Disconnect failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#0EB8A0]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Engine &amp; Connector Settings</h3>
              <p className="text-[11px] text-slate-400">Activity telemetry &amp; deterministic calculation parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm text-slate-600">
          {/* Real Connectors Telemetry */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-[#0EB8A0]" />
                <span>External Activity Connectors (Actual Status)</span>
              </h4>
              {loadingConn && <span className="text-[11px] text-slate-400">Inspecting...</span>}
            </div>

            <div className="space-y-2">
              {connectors.map((c) => {
                const isConn = c.status === 'connected';
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                            isConn
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isConn ? 'Connected' : 'Not Configured'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{c.details}</p>
                    </div>

                    {c.type === 'git' && (
                      <button
                        onClick={handleTriggerScan}
                        disabled={scanning}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold hover:bg-teal-100 transition shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {scanning ? 'Scanning...' : 'Scan Now'}
                      </button>
                    )}

                    {c.type === 'github' && isConn && (
                      <button
                        onClick={async () => {
                          try {
                            await echoApi.disconnectGitHub();
                            const res = await echoApi.getConnectors();
                            setConnectors(res.connectors || []);
                          } catch (e) {
                            setScanMsg(`Disconnect failed: ${e.message}`);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition shrink-0 cursor-pointer"
                      >
                        Disconnect
                      </button>
                    )}

                    {c.type === 'slack' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isConn ? (
                          <>
                            <button
                              onClick={handleSyncSlack}
                              disabled={syncingSlack}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold hover:bg-teal-100 transition cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3 h-3 ${syncingSlack ? 'animate-spin' : ''}`} />
                              <span>Sync</span>
                            </button>
                            <button
                              onClick={handleDisconnectSlack}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSlackModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition cursor-pointer"
                          >
                            Connect Slack
                          </button>
                        )}
                      </div>
                    )}

                    {c.type === 'jira' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isConn ? (
                          <>
                            <button
                              onClick={handleSyncJira}
                              disabled={syncingJira}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold hover:bg-teal-100 transition cursor-pointer flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3 h-3 ${syncingJira ? 'animate-spin' : ''}`} />
                              <span>Sync</span>
                            </button>
                            <button
                              onClick={handleDisconnectJira}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setJiraModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition cursor-pointer"
                          >
                            Connect Jira
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {scanMsg && (
              <p className="text-xs mt-2 text-teal-900 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                {scanMsg}
              </p>
            )}
          </div>

          {/* Formula */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Deterministic Risk Formula
            </h4>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 leading-relaxed font-semibold">
              Risk = OwnershipConcentration × Criticality × (1 − DocCoverage) × RecencyWeight
            </div>
          </div>

          {/* Recency Weights */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recency Decay Weights
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">≤ 7 days</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">Weight: 1.0 (Critical)</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">≤ 30 days</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">Weight: 0.7 (Active)</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">≤ 90 days</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">Weight: 0.4 (Moderate)</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="font-semibold text-slate-900">&gt; 90 days</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">Weight: 0.15 (Archival)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Connect Slack Dialog */}
      {slackModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Connect Slack Workspace</h3>
              </div>
              <button
                onClick={() => setSlackModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSlackToken} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={slackWorkspaceName}
                  onChange={(e) => setSlackWorkspaceName(e.target.value)}
                  placeholder="e.g. Core Engineering Slack"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Slack Bot or User Token (xoxb / xoxp)</label>
                <input
                  type="password"
                  value={slackToken}
                  onChange={(e) => setSlackToken(e.target.value)}
                  placeholder="xoxb-..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Scopes: channels:history, channels:read, users:read. Threads are ingested without storing user passwords.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSlackModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncingSlack || !slackToken.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {syncingSlack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Connect &amp; Ingest Threads</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Jira Dialog */}
      {jiraModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Connect Atlassian Jira</h3>
              </div>
              <button
                onClick={() => setJiraModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectJiraToken} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Atlassian Domain</label>
                <input
                  type="text"
                  value={jiraDomain}
                  onChange={(e) => setJiraDomain(e.target.value)}
                  placeholder="your-company.atlassian.net"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Atlassian Account Email</label>
                <input
                  type="email"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jira API Token</label>
                <input
                  type="password"
                  value={jiraApiToken}
                  onChange={(e) => setJiraApiToken(e.target.value)}
                  placeholder="Atlassian API token..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Generated in Atlassian Account Settings &gt; Security &gt; Create API token.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setJiraModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncingJira || !jiraApiToken.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {syncingJira ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Connect &amp; Ingest Tickets</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#0EB8A0]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Echo Demo &amp; Pitch Guide</h3>
              <p className="text-[11px] text-slate-400">Step-by-step evaluator rubric</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm text-slate-600">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-semibold text-slate-900 text-xs uppercase tracking-wide">
              The 2-Minute Rubric Flow
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Follow this structured sequence for a comprehensive evaluation:
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-teal-800">Step 1 (0:00 - 0:50): Risk Map</span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Inspect <code className="text-slate-900 font-mono font-semibold">nightly_sync.py</code>: single ownership, 0% doc coverage, touched recently. Notice detected planted gaps.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-teal-800">Step 2 (0:50 - 1:20): Exit Interview</span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Type answer: <em className="text-slate-900 font-medium">"we chose 7 because the vendor API rate-limited us"</em>. Notice the real-time decision signal!
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-teal-800">Step 3 (1:20 - 1:40): Handover Package</span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Show dynamic 2-week plan with interactive checkmarks, defused landmines, and manager approval sign-off.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-teal-800">Step 4 (1:40 - 2:00): Ask Echo Trust Layer</span>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ask: <strong className="text-slate-900">"Why is the retry limit 7?"</strong> → Grounded cited answer from interview.<br />
                Ask: <strong className="text-slate-900">"What is the wifi password?"</strong> → <em>Honesty fallback with suggested contact: Priya</em>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
