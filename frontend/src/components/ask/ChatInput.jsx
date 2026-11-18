import React, { useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

export default function ChatInput({
  onSend,
  busy,
  suggestedQueries = [
    'Why was the payment retry limit changed to 7?',
    'How does the nightly data sync job work?',
    'What are the highest risk areas in Core Platform?',
    'Who is the domain expert for auth and sessions?',
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
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
          {suggestedQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition font-medium disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ChatGPT-Style Floating Input Capsule */}
      <div className="relative flex items-center bg-white border border-slate-300 hover:border-slate-400 focus-within:border-slate-700 focus-within:ring-2 focus-within:ring-slate-900/5 rounded-2xl sm:rounded-3xl shadow-sm transition p-1.5 sm:p-2">
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
          placeholder="Ask Echo anything about the codebase..."
          className="w-full pl-3 sm:pl-4 pr-12 py-2 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none disabled:opacity-50"
        />

        <button
          onClick={() => handleSend()}
          disabled={busy || !input.trim()}
          className={`absolute right-2 sm:right-3 w-8 h-8 rounded-full flex items-center justify-center transition shadow-2xs cursor-pointer ${
            input.trim() && !busy
              ? 'bg-slate-900 hover:bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
          title="Send message"
          aria-label="Send message"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div className="text-center text-[11px] text-slate-400 mt-2 px-2">
        Echo can make mistakes. Grounded on verified git commits, AST analysis, and exit interviews.
      </div>
    </div>
  );
}
