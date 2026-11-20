import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Loader2,
  AlertTriangle,
  Sparkles,
  Repeat,
  RefreshCw,
  Check,
  Clock,
} from 'lucide-react';
import { echoApi } from '../../api';

export default function ReviewerPortal({ projectId, onItemsUpdated }) {
  const [items, setItems] = useState({ decisions: [], landmines: [], open_loops: [], pending_count: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all'

  const loadReviewItems = async () => {
    setLoading(true);
    try {
      const res = await echoApi.getReviewItems(projectId);
      setItems(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewItems();
  }, [projectId]);

  const handleApprove = async (itemType, itemId) => {
    setUpdatingId(itemId);
    try {
      await echoApi.approveReviewItem(itemType, itemId, 'Reviewer Lead');
      await loadReviewItems();
      if (onItemsUpdated) onItemsUpdated();
    } catch (e) {
      alert(`Approval failed: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (itemType, itemId) => {
    setUpdatingId(itemId);
    try {
      await echoApi.rejectReviewItem(itemType, itemId, 'Reviewer Lead');
      await loadReviewItems();
      if (onItemsUpdated) onItemsUpdated();
    } catch (e) {
      alert(`Rejection failed: ${e.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const allItems = [
    ...(items.decisions || []).map((d) => ({ ...d, itemType: 'decision', displayTitle: d.decision, displaySubtitle: d.rationale })),
    ...(items.landmines || []).map((l) => ({ ...l, itemType: 'landmine', displayTitle: l.title, displaySubtitle: l.symptom || l.description })),
    ...(items.open_loops || []).map((o) => ({ ...o, itemType: 'open_loop', displayTitle: o.title, displaySubtitle: o.description })),
  ];

  const filteredItems = filter === 'pending'
    ? allItems.filter((i) => i.review_status === 'pending_review' || !i.review_status)
    : allItems;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#0EB8A0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Reviewer Sign-off &amp; Knowledge Verification</h3>
              {items.pending_count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                  {items.pending_count} Pending Review
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Audit structured decisions, quiet gotchas, and open loops extracted from exit interviews.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${filter === 'pending' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Pending ({items.pending_count})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Items ({allItems.length})
            </button>
          </div>

          <button
            onClick={loadReviewItems}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition cursor-pointer"
            title="Refresh review queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Review Queue Items */}
      {filteredItems.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-slate-700">All exit interview knowledge artifacts reviewed and verified!</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Approved decisions and landmines are locked into the handover package.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isApproved = item.review_status === 'approved';
            const isUpdating = updatingId === item.id;

            return (
              <div
                key={`${item.itemType}-${item.id}`}
                className={`p-3.5 rounded-xl border transition ${isApproved
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {item.artifact_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${item.itemType === 'decision'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : item.itemType === 'landmine'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                    >
                      {item.itemType === 'decision' && <Sparkles className="w-3 h-3 text-purple-600" />}
                      {item.itemType === 'landmine' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      {item.itemType === 'open_loop' && <Repeat className="w-3 h-3 text-amber-600" />}
                      <span className="capitalize">{item.itemType.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.freshness_status === 'needs_reverification' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Code Drift Detected</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isApproved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                    >
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Approved &amp; Locked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {item.displayTitle}
                  </h4>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.displaySubtitle}
                  </p>

                  {/* Remediation or alternatives if present */}
                  {item.how_to_recover && (
                    <div className="mt-2 p-2 rounded-lg bg-teal-50 border border-teal-200 text-[11px] text-teal-900">
                      <span className="font-bold">Recovery Procedure: </span>
                      <span>{item.how_to_recover}</span>
                    </div>
                  )}

                  {item.rejected_alternatives && (
                    <div className="mt-2 p-2 rounded-lg bg-purple-50 border border-purple-200 text-[11px] text-purple-900">
                      <span className="font-bold">Rejected Alternatives: </span>
                      <span>{item.rejected_alternatives}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400">
                      {item.last_verified_at && (
                        <span>Last verified: {new Date(item.last_verified_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.freshness_status === 'needs_reverification' && (
                        <button
                          onClick={async () => {
                            await echoApi.verifyFreshnessRecord(item.itemType, item.id, 'Reviewer Lead');
                            await loadReviewItems();
                            if (onItemsUpdated) onItemsUpdated();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
                        >
                          Re-verify Freshness
                        </button>
                      )}
                      {!isApproved && (
                        <button
                          onClick={() => handleReject(item.itemType, item.id)}
                          disabled={isUpdating}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleApprove(item.itemType, item.id)}
                        disabled={isUpdating || isApproved}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 opacity-60 cursor-default'
                            : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                        }`}
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{isApproved ? 'Approved' : 'Verify & Sign Off'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
