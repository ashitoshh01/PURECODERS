import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  X,
  Key,
  Bot,
  SlidersHorizontal,
  ChevronDown,
  Copy,
  Check,
  Database,
  HelpCircle,
  RotateCcw,
  GitBranch,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { echoApi } from '../../api';

export default function AskEcho({ activeProject, successor, refreshKey }) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const scrollRef = useRef(null);
  const menuRef = useRef(null);

  const successorName = successor?.name || 'Successor';

  const defaultGreeting = {
    role: 'echo',
    text: `Hi ${successorName}! I'm Echo, your knowledge-risk assistant powered by ASI:One. I answer questions with deep grounding across the codebase, commit history, exit interview notes, and architectural decisions. If evidence is missing, I won't guess — I'll tell you who to ask instead.`,
    citations: [],
    ai_provider: 'asi1',
    ai_model: 'asi1',
    is_ai: true,
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOptionsOpen(false);
      }
    };
    if (optionsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [optionsOpen]);

  const loadConversationHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await echoApi.getConversations(activeProject?.id);
      if (res && res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else {
        setMessages([defaultGreeting]);
      }
    } catch {
      setMessages([defaultGreeting]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAiStatus = async () => {
    try {
      const st = await echoApi.getAiStatus();
      setAiStatus(st);
    } catch (e) {
      console.error('Failed to load AI status:', e);
    }
  };

  useEffect(() => {
    loadConversationHistory();
    loadAiStatus();
  }, [activeProject?.id, refreshKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const handleSend = async (queryText) => {
    if (!queryText.trim() || busy) return;

    // Append user message immediately
    setMessages((prev) => [...prev, { role: 'user', text: queryText }]);
    setBusy(true);

    try {
      const response = await echoApi.askEcho(queryText, successorName, activeProject?.id);
      setMessages((prev) => [...prev, { role: 'echo', ...response }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'echo',
          answer: null,
          echo_says: `Error contacting ASI:One AI assistant: ${e.message}`,
          citations: [],
          is_ai: false,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const clearChat = () => {
    setMessages([defaultGreeting]);
  };

  const handleCopyTranscript = async () => {
    try {
      const formatted = messages
        .map((m) => {
          const author = m.role === 'user' ? 'You' : 'Echo';
          const body = m.role === 'user' ? m.text : m.answer || m.echo_says || m.text;
          return `### ${author}\n${body}\n`;
        })
        .join('\n---\n\n');

      await navigator.clipboard.writeText(formatted);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2500);
    } catch (err) {
      console.error('Failed to copy transcript:', err);
    }
  };

  const handleSaveKey = async (e) => {
    e?.preventDefault();
    if (!newKey.trim()) return;
    setSavingKey(true);
    try {
      const updated = await echoApi.updateAiConfig(newKey.trim());
      setAiStatus(updated);
      setSaveSuccess(true);
      setNewKey('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to save key: ${err.message}`);
    } finally {
      setSavingKey(false);
    }
  };

  // Determine dynamic suggested queries based on active project
  const isEvakili =
    activeProject?.name?.toLowerCase().includes('evakili') || activeProject?.id === 'proj-live';
  const suggestedQueries = isEvakili
    ? [
        'What features are built in evakili?',
        'Why was staticfiles autocomplete added?',
        'What changes did Ashu make recently?',
        'Who should I ask about Core Architecture?',
      ]
    : [
        'Why is the retry limit 7?',
        'What is the wifi password?',
        'How does nightly sync work?',
      ];

  return (
    <div className="w-full h-[calc(100vh-9.5rem)] flex flex-col fade-in">
      {/* Clean, Streamlined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-[#071126] border border-slate-700/60 text-[#18C6B0] flex items-center justify-center shadow-xs shrink-0">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Ask Echo
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Trust Layer
              </span>
              <div
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                  aiStatus?.is_configured
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    aiStatus?.is_configured ? 'bg-purple-600 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>{aiStatus?.is_configured ? 'ASI:One Grounded' : 'ASI:One: Set Key'}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-tight mt-0.5">
              Retrieval-first Q&A grounded in verified commits, AST analysis, and exit interviews
            </p>
          </div>
        </div>

        {/* Clean Options & Features Dropdown Menu */}
        <div className="relative shrink-0 flex items-center gap-2" ref={menuRef}>
          <button
            onClick={() => setOptionsOpen(!optionsOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer focus:outline-none"
            aria-label="Features and assistant options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Options &amp; Features</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Elevated Dropdown Menu Panel */}
          {optionsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 z-50 p-2 space-y-1 fade-in">
              {/* ASI:One AI Settings */}
              <button
                onClick={() => {
                  setShowConfigModal(true);
                  setOptionsOpen(false);
                }}
                className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>ASI:One AI Engine</span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                        aiStatus?.is_configured
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {aiStatus?.is_configured ? 'Active' : 'Setup'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Model {aiStatus?.model || 'asi1'} · Update API key
                  </p>
                </div>
              </button>

              {/* Clear Chat */}
              <button
                onClick={() => {
                  clearChat();
                  setOptionsOpen(false);
                }}
                className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">Clear Conversation</div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Reset session back to initial greeting
                  </p>
                </div>
              </button>

              {/* Copy Transcript */}
              <button
                onClick={() => {
                  handleCopyTranscript();
                  setOptionsOpen(false);
                }}
                className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">Copy Transcript</div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Export questions &amp; answers to clipboard
                  </p>
                </div>
              </button>

              {/* Grounding Scope */}
              <button
                onClick={() => {
                  setShowScopeModal(true);
                  setOptionsOpen(false);
                }}
                className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">Grounding Scope</div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Inspect verified sources &amp; commits
                  </p>
                </div>
              </button>

              {/* Toggle Starter Suggestions */}
              <button
                onClick={() => {
                  setShowSuggestions(!showSuggestions);
                  setOptionsOpen(false);
                }}
                className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>Starter Questions</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {showSuggestions ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Toggle quick prompt chips
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Studio Area (Max Big Size) */}
      <div className="w-full flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mt-3">
        {/* Copy Notification Toast */}
        {copiedTranscript && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Chat transcript copied to clipboard!</span>
          </div>
        )}

        {/* Messages Area (Max width & vertical space) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {messages.map((m, idx) => (
            <ChatMessage key={m.id || idx} message={m} />
          ))}

          {busy && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-950 text-xs w-fit shadow-xs animate-pulse">
              <Bot className="w-4 h-4 text-[#0EB8A0] animate-bounce" />
              <span className="font-semibold">
                Echo is consulting ASI:One AI with full project context &amp; commits...
              </span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Expansive Chat Input Container */}
        <div className="p-3 sm:p-4 bg-slate-50/70 border-t border-slate-200/80">
          <ChatInput
            onSend={handleSend}
            busy={busy}
            suggestedQueries={suggestedQueries}
            showSuggestions={showSuggestions}
          />
        </div>
      </div>

      {/* ASI:One Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ASI:One AI Engine</h3>
                  <p className="text-xs text-slate-500">Autonomous intelligence by Fetch.ai / ASI Alliance</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Provider &amp; Model:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {aiStatus?.model || 'asi1'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">API Endpoint:</span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {aiStatus?.base_url || 'https://api.asi1.ai/v1'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{aiStatus?.is_configured ? 'Active & Grounded' : 'Needs API Key'}</span>
                  </span>
                </div>
                {aiStatus?.masked_key && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Loaded Key:</span>
                    <span className="font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px] font-semibold">
                      {aiStatus.masked_key}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-purple-950">
                <p className="font-bold mb-1">Environment File (.env)</p>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Your key is saved in the project's root <code className="bg-purple-100 px-1 py-0.5 rounded font-mono font-semibold">.env</code> file under <code className="bg-purple-100 px-1 py-0.5 rounded font-mono font-semibold">ASI1_API_KEY</code>. You can paste or update it directly in the file, or use the form below.
                </p>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-2">
                <label className="block font-semibold text-slate-700">Update ASI:One API Key:</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="sk_..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#18C6B0] text-xs font-mono"
                  />
                  <button
                    type="submit"
                    disabled={savingKey || !newKey.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {savingKey ? 'Saving...' : 'Save'}
                  </button>
                </div>
                {saveSuccess && (
                  <p className="text-[11px] text-emerald-700 font-bold">✓ Key successfully saved to .env!</p>
                )}
              </form>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grounding Scope & Evidence Sources Modal */}
      {showScopeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Grounded Knowledge Scope</h3>
                  <p className="text-xs text-slate-500">Verified artifacts used for deterministic Q&amp;A</p>
                </div>
              </div>
              <button
                onClick={() => setShowScopeModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Active Workspace:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {activeProject?.name || 'PURECODERS'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Grounding Trust Tier:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0EB8A0]" />
                    <span>Deterministic First (No Hallucinations)</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Indexed Data Layers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#0EB8A0]" />
                    <div>
                      <div className="font-bold text-slate-800">Git Commits &amp; Diffs</div>
                      <div className="text-[10px] text-slate-400">Authorship, timestamps &amp; blame</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0EB8A0]" />
                    <div>
                      <div className="font-bold text-slate-800">AST Knowledge Graph</div>
                      <div className="text-[10px] text-slate-400">Dependency calls &amp; imports</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#0EB8A0]" />
                    <div>
                      <div className="font-bold text-slate-800">Exit Interview Notes</div>
                      <div className="text-[10px] text-slate-400">Captured tacit knowledge</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0EB8A0]" />
                    <div>
                      <div className="font-bold text-slate-800">Decisions &amp; Landmines</div>
                      <div className="text-[10px] text-slate-400">Extracted architectural rationale</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950 text-[11px] leading-relaxed">
                Echo never fabricates answers when information is absent. If a question addresses ungrounded topics (e.g. unknown WiFi passwords or untracked legacy APIs), Echo triggers the <strong>Honesty Fallback</strong> and routes you to the relevant human expert.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowScopeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
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
