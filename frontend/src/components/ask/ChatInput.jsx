import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

export default function ChatInput({
  onSend,
  busy,
  suggestedQueries = [
    'Why is the retry limit 7?',
    'What is the wifi password?',
    'How does nightly sync work?',
  ],
  showSuggestions = true,
}) {
  const [input, setInput] = useState('');

  const handleSend = (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : input).trim();
    if (!text || busy) return;
    setInput('');
    onSend(text);
  };

  return (
    <div className="w-full">
      {/* Quick query suggestion chips */}
      {showSuggestions && suggestedQueries && suggestedQueries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#0EB8A0]" />
            <span>Quick queries:</span>
          </span>
          {suggestedQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={busy}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 hover:border-teal-300 transition font-medium disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input box */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          disabled={busy}
          placeholder='Ask anything about the codebase... (e.g. "Why is the retry limit 7?")'
          className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0] transition shadow-xs disabled:opacity-50"
        />

        <button
          onClick={() => handleSend()}
          disabled={busy || !input.trim()}
          className="absolute right-2 p-2 rounded-lg bg-[#18C6B0] hover:bg-[#0EB8A0] disabled:opacity-40 text-[#071126] font-bold transition shadow-2xs disabled:cursor-not-allowed cursor-pointer"
          title="Send message"
          aria-label="Send query"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
        <span>Grounded on stored commits, tickets &amp; exit interview answers.</span>
        <span className="hidden sm:inline font-mono">Press Enter to send</span>
      </div>
    </div>
  );
}
