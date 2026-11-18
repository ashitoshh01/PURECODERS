import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  FileCode,
  GitPullRequest,
  Ticket,
  MessageSquare,
  FileText,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';
import { getRiskColor } from '../../api';

export default function RiskTable({
  artifacts = [],
  plantedGaps = [],
  leaverName = 'Departing Lead',
  repoName = 'core-platform',
  branch = 'main',
  onSelectArtifact,
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'priority' | 'at_risk' | 'critical' | 'bus1' | 'planted'
  const [sortKey, setSortKey] = useState('risk_desc'); // 'risk_desc' | 'risk_asc' | 'criticality' | 'recency' | 'title'

  const typeIcons = {
    module: FileCode,
    script: FileCode,
    config: FileCode,
    pull_request: GitPullRequest,
    ticket: Ticket,
    chat_thread: MessageSquare,
    document: FileText,
  };

  const filteredArtifacts = useMemo(() => {
    if (!artifacts) return [];
    return artifacts.filter((a) => {
      // Search filter
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.artifact_id.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // Filter logic aligned with deterministic thresholds
      if (filterType === 'priority') return a.risk_pct >= 50 || a.bus_factor_one;
      if (filterType === 'at_risk') return a.risk_pct >= 30; // Matches KPI card threshold
      if (filterType === 'critical') return a.risk_pct >= 50; // Matches Critical tier
      if (filterType === 'bus1') return a.bus_factor_one;
      if (filterType === 'planted') return plantedGaps.includes(a.artifact_id);
      if (filterType === 'module') return a.type === 'module' || a.type === 'script';
      if (filterType === 'pull_request') return a.type === 'pull_request';
      if (filterType === 'ticket') return a.type === 'ticket';

      return true;
    });
  }, [artifacts, search, filterType, plantedGaps]);

  const sortedArtifacts = useMemo(() => {
    return [...filteredArtifacts].sort((a, b) => {
      if (sortKey === 'risk_desc') return b.risk_score - a.risk_score;
      if (sortKey === 'risk_asc') return a.risk_score - b.risk_score;
      if (sortKey === 'criticality') {
        const critA = a.components?.criticality ?? 0;
        const critB = b.components?.criticality ?? 0;
        return critB - critA;
      }
      if (sortKey === 'recency') {
        const recA = a.components?.recency_weight ?? 0;
        const recB = b.components?.recency_weight ?? 0;
        return recB - recA;
      }
      if (sortKey === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [filteredArtifacts, sortKey]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200/90 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search artifacts, IDs, or file paths..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#18C6B0] focus:bg-white transition"
          />
        </div>

        {/* Filter Pills and Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Artifacts' },
              { id: 'priority', label: '🔥 Priority Hotspots' },
              { id: 'critical', label: 'Critical (≥50%)' },
              { id: 'bus1', label: 'Bus Factor = 1' },
              { id: 'planted', label: 'Planted Gaps' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                  filterType === f.id
                    ? 'bg-teal-50 text-teal-900 border border-teal-200/90'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="text-xs bg-transparent border-0 text-slate-700 font-semibold focus:ring-0 cursor-pointer pr-4 py-1"
            >
              <option value="risk_desc">Risk: Highest First</option>
              <option value="risk_asc">Risk: Lowest First</option>
              <option value="criticality">Criticality Scale</option>
              <option value="recency">Recency Weight</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Element (Linear-style File Explorer) */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs text-slate-600">
          <thead className="bg-slate-50/90 border-b border-slate-200/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Artifact Name &amp; ID</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Ownership ({leaverName})</th>
              <th className="py-3 px-3">Criticality</th>
              <th className="py-3 px-3">Documentation</th>
              <th className="py-3 px-3">Recency</th>
              <th className="py-3 px-4 text-right">Risk Score</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedArtifacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  {artifacts.length === 0
                    ? 'No artifacts tracked. Ingest a Git repository to begin tracking knowledge risks.'
                    : 'No artifacts match your search and filter criteria.'}
                </td>
              </tr>
            ) : (
              sortedArtifacts.map((a) => {
                const Icon = typeIcons[a.type] || FileCode;
                const isPlanted = plantedGaps.includes(a.artifact_id);
                const color = getRiskColor(a.risk_pct);

                // Clean filename: remove redundant "— script" if present in title
                const cleanTitle = a.title.split('—')[0].trim();
                const critScore = a.components?.criticality != null ? Math.round(a.components.criticality * 5) : null;
                const docGapPct = Math.round((a.components?.doc_gap ?? 0) * 100);

                return (
                  <tr
                    key={a.artifact_id}
                    onClick={() => onSelectArtifact(a)}
                    className="hover:bg-slate-50/90 transition cursor-pointer group"
                  >
                    {/* Artifact Title & Identifier */}
                    <td className="py-4 px-4 max-w-xs sm:max-w-md">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-900 transition mt-0.5 shrink-0 border border-slate-200/60">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-teal-900 transition truncate leading-snug">
                            {cleanTitle}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="font-mono text-[10px] text-slate-500 font-medium bg-slate-100 px-1 py-0.2 rounded border border-slate-200/60">
                              {a.artifact_id}
                            </span>
                            <span
                              className="text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/60 inline-flex items-center gap-1"
                              title={a.updated_at ? `Updated: ${a.updated_at}` : 'Monitored'}
                            >
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              <span>{a.updated_label || (a.days_since_touch === 0 ? 'Just now' : `${a.days_since_touch}d ago`)}</span>
                            </span>
                            {a.bus_factor_one && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                Bus factor 1
                              </span>
                            )}
                            {isPlanted && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                Planted gap
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type Column */}
                    <td className="py-4 px-3">
                      <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 capitalize">
                        {a.type}
                      </span>
                    </td>

                    {/* Ownership Column (Clean percentage + slim 4px progress indicator) */}
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-xs w-10">
                          {Math.round((a.components?.ownership_concentration ?? 0) * 100)}%
                        </span>
                        <div className="w-14 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div
                            className="h-full bg-[#18C6B0] rounded-full"
                            style={{
                              width: `${Math.round((a.components?.ownership_concentration ?? 0) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Criticality Column (Clean score + indicator) */}
                    <td className="py-4 px-3">
                      {critScore != null ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
                          <span>{critScore}/5</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              critScore >= 4 ? 'bg-rose-500' : critScore >= 3 ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Documentation Gap Column */}
                    <td className="py-4 px-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          docGapPct >= 80
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : docGapPct >= 50
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {docGapPct}% gap
                      </span>
                    </td>

                    {/* Recency Column */}
                    <td className="py-4 px-3 font-mono text-[11px] text-slate-700 font-semibold">
                      ×{a.components?.recency_weight}
                    </td>

                    {/* Risk Score Column (Prominent % + slim 4px rounded bar) */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 mb-1.5">
                        <RiskBadge pct={a.risk_pct} size="sm" showLabel={false} />
                      </div>
                      <div className="w-20 ml-auto h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full ${color.bar}`}
                          style={{ width: `${Math.min(100, a.risk_pct)}%` }}
                        />
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-teal-900 text-xs font-semibold transition">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50/80 border-t border-slate-200/90 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Showing {sortedArtifacts.length} of {artifacts?.length || 0} tracked artifacts</span>
        <span className="font-mono text-[11px]">{repoName} branch @ {branch}</span>
      </div>
    </div>
  );
}
