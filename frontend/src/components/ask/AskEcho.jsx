import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Plus,
  History,
  Trash2,
  X,
  MessageSquare,
  Clock,
  RotateCcw,
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { echoApi } from '../../api';

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function AskEcho({ activeProject, successor, refreshKey }) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConvTitle, setActiveConvTitle] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef(null);

  const successorName = successor?.name || 'Successor';

  const defaultGreeting = {
    role: 'echo',
    text: `Hi ${successorName}! I'm Echo, your knowledge-risk assistant powered by ASI:One. I answer questions with deep grounding across the codebase, commit history, exit interview notes, and architectural decisions. If evidence is missing, I won't guess — I'll tell you who to ask instead.`,
    citations: [],
    ai_provider: 'asi1',
    ai_model: 'asi1',
    is_ai: true,
  };

  const loadConversationsList = async () => {
    try {
      const res = await echoApi.getConversations(activeProject?.id);
      if (res && res.conversations) {
        setConversations(res.conversations);
      }
      return res;
    } catch (e) {
      console.warn('Failed to load conversations list:', e);
      return null;
    }
  };

  const loadInitialChat = async () => {
    setLoadingHistory(true);
    try {
      const res = await loadConversationsList();
      if (res && res.conversations && res.conversations.length > 0) {
        // Load the latest conversation by default
        const latest = res.conversations[0];
        const detail = await echoApi.getConversation(latest.id);
        if (detail && detail.messages && detail.messages.length > 0) {
          setMessages(detail.messages);
          setActiveConvId(latest.id);
          setActiveConvTitle(latest.title);
        } else {
          setMessages([defaultGreeting]);
        }
      } else if (res && res.messages && res.messages.length > 0) {
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

  useEffect(() => {
    loadInitialChat();
  }, [activeProject?.id, refreshKey]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const handleSelectConversation = async (convId) => {
    setBusy(true);
    try {
      const res = await echoApi.getConversation(convId);
      if (res && res.messages) {
        setMessages(res.messages.length > 0 ? res.messages : [defaultGreeting]);
        setActiveConvId(convId);
        setActiveConvTitle(res.title || 'Conversation');
      }
      if (window.innerWidth < 640) {
        setHistoryOpen(false);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setActiveConvTitle('');
    setMessages([defaultGreeting]);
    if (window.innerWidth < 640) {
      setHistoryOpen(false);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await echoApi.deleteConversation(convId);
      if (activeConvId === convId) {
        handleNewChat();
      }
      loadConversationsList();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSend = async (queryText) => {
    if (!queryText.trim() || busy) return;

    // Append user message immediately
    setMessages((prev) => [...prev, { role: 'user', text: queryText }]);
    setBusy(true);

    try {
      const response = await echoApi.askEcho(
        queryText,
        successorName,
        activeProject?.id,
        activeConvId
      );
      setMessages((prev) => [...prev, { role: 'echo', ...response }]);
      if (response.conversation_id) {
        setActiveConvId(response.conversation_id);
      }
      if (response.conversation_title && !activeConvTitle) {
        setActiveConvTitle(response.conversation_title);
      }
      loadConversationsList();
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
    <div className="w-full h-full flex flex-col bg-white overflow-hidden fade-in relative">
      {/* ChatGPT-Style Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 border-b border-slate-100 bg-white/95 backdrop-blur-sm flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#071126] text-[#18C6B0] flex items-center justify-center font-bold shadow-xs shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight shrink-0">Echo</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 shrink-0">
            ASI:One Grounded
          </span>
          {activeConvTitle && (
            <span className="hidden md:inline text-xs text-slate-500 font-medium truncate max-w-xs pl-2 border-l border-slate-200">
              {activeConvTitle}
            </span>
          )}
        </div>

        {/* Top Action Controls: New Chat & History (Options removed as requested) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition cursor-pointer"
            title="Start a new conversation"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* History Button (Replacing Options) */}
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
              historyOpen
                ? 'bg-teal-50 text-teal-900 border-teal-300 shadow-2xs'
                : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200'
            }`}
            title="Open chat history"
          >
            <History className="w-3.5 h-3.5 text-teal-600" />
            <span>History</span>
            {conversations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono font-bold">
                {conversations.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Chat Canvas with Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {messages.map((m, idx) => (
            <ChatMessage key={m.id || idx} message={m} />
          ))}

          {busy && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-950 text-xs w-fit shadow-2xs animate-pulse">
              <Bot className="w-4 h-4 text-[#0EB8A0] animate-bounce" />
              <span className="font-semibold">
                Echo is consulting ASI:One AI with verified git context &amp; commits...
              </span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Fixed Bottom Input Dock */}
      <div className="shrink-0 bg-gradient-to-t from-white via-white to-transparent pt-3 pb-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto w-full">
          <ChatInput
            onSend={handleSend}
            busy={busy}
            suggestedQueries={suggestedQueries}
            showSuggestions={messages.length <= 1}
          />
        </div>
      </div>

      {/* Slide-over Chat History Panel */}
      {historyOpen && (
        <aside
          className="absolute top-14 bottom-0 right-0 z-30 w-full sm:w-80 md:w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-200"
          aria-label="Chat history"
        >
          {/* History Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Chat History</h3>
              <span className="text-[11px] font-mono text-slate-400">({conversations.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                title="Start new conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close history panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History Conversations List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {conversations.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No previous chats yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Ask a question to start your first grounded conversation with Echo.
                </p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = activeConvId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c.id)}
                    className={`group relative p-3 rounded-2xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-200/90 text-teal-950 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-slate-900 group-hover:text-teal-900">
                          {c.title || 'Untitled Conversation'}
                        </div>
                        {c.preview && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                            {c.preview}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-medium">
                          <span>{c.message_count ? `${c.message_count} msgs` : 'Chat'}</span>
                          <span>·</span>
                          <span>{formatTimeAgo(c.updated_at || c.created_at)}</span>
                        </div>
                      </div>

                      {/* Delete Conversation Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
