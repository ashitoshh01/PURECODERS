import React from 'react';
import {
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  Link2,
  FileText,
  Clock,
  Code2,
} from 'lucide-react';

function renderInline(str) {
  if (!str) return null;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-slate-100 text-teal-900 font-mono text-[11px] border border-slate-200 font-semibold"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts.length > 0 ? parts : str;
}

function FormattedContent({ text, isUser }) {
  if (!text) return null;
  if (isUser) {
    return <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{text}</div>;
  }

  // Handle multi-line code blocks
  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-slate-800">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Code block
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.split('\n');
          const lang = lines[0].replace('```', '').trim() || 'code';
          const codeContent = lines.slice(1, -1).join('\n');
          return (
            <div key={bIdx} className="rounded-xl overflow-hidden border border-slate-800 bg-[#071126] my-2 text-slate-200 font-mono text-xs">
              <div className="px-3 py-1.5 bg-[#0b162c] border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5 uppercase font-semibold">
                  <Code2 className="w-3.5 h-3.5 text-[#18C6B0]" />
                  <span>{lang}</span>
                </span>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        const paragraphs = trimmed.split(/\n\n+/);
        return (
          <React.Fragment key={bIdx}>
            {paragraphs.map((p, pIdx) => {
              const pTrimmed = p.trim();
              if (pTrimmed.startsWith('# ')) {
                return (
                  <h3 key={pIdx} className="text-base font-bold text-slate-900 mt-2 mb-1">
                    {renderInline(pTrimmed.replace(/^#\s+/, ''))}
                  </h3>
                );
              }
              if (pTrimmed.startsWith('## ')) {
                return (
                  <h4 key={pIdx} className="text-sm font-bold text-slate-900 mt-2 mb-1">
                    {renderInline(pTrimmed.replace(/^##\s+/, ''))}
                  </h4>
                );
              }
              if (pTrimmed.startsWith('### ')) {
                return (
                  <h5 key={pIdx} className="text-xs font-bold text-slate-800 uppercase tracking-wide mt-2 mb-1">
                    {renderInline(pTrimmed.replace(/^###\s+/, ''))}
                  </h5>
                );
              }
              if (pTrimmed === '---' || pTrimmed === '***') {
                return <hr key={pIdx} className="border-slate-200/90 my-2" />;
              }

              const lines = pTrimmed.split('\n');
              const isBulletList = lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
              if (isBulletList) {
                return (
                  <ul key={pIdx} className="list-disc pl-4 space-y-1 my-1.5 text-xs sm:text-sm text-slate-700">
                    {lines.map((l, lIdx) => (
                      <li key={lIdx}>{renderInline(l.trim().replace(/^[-*]\s+/, ''))}</li>
                    ))}
                  </ul>
                );
              }

              const isNumberedList = lines.every((l) => /^\d+\.\s+/.test(l.trim()));
              if (isNumberedList) {
                return (
                  <ol key={pIdx} className="list-decimal pl-4 space-y-1 my-1.5 text-xs sm:text-sm text-slate-700">
                    {lines.map((l, lIdx) => (
                      <li key={lIdx}>{renderInline(l.trim().replace(/^\d+\.\s+/, ''))}</li>
                    ))}
                  </ol>
                );
              }

              return (
                <p key={pIdx} className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {lines.map((line, lIdx) => (
                    <React.Fragment key={lIdx}>
                      {renderInline(line)}
                      {lIdx < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isUnknown = message.role === 'echo' && message.answer === null;
  const isAi = message.role === 'echo' && (message.ai_provider === 'asi1' || message.is_ai);
  const content = isUser
    ? message.text
    : (message.answer || message.echo_says || message.text);

  return (
    <div className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
      {/* Echo Robot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-[#071126] border border-slate-700/50 text-[#18C6B0] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 transition shadow-xs ${
          isUser
            ? 'bg-[#071126] text-white rounded-tr-xs'
            : isUnknown
            ? 'bg-amber-50/70 border border-amber-200 text-slate-800 rounded-tl-xs'
            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
        }`}
      >
        {/* ASI:One AI Header Badge */}
        {!isUser && isAi && !isUnknown && (
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span>ASI:One AI Engine</span>
              {message.ai_model && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-semibold">
                  {message.ai_model}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Grounded Context</span>
          </div>
        )}

        {/* Unknown Warning Banner */}
        {isUnknown && (
          <div className="flex items-center gap-1.5 text-amber-900 font-bold mb-2.5 pb-2.5 border-b border-amber-200/70 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Honesty Fallback: Insufficient Grounded Evidence</span>
          </div>
        )}

        {/* Formatted Content */}
        <FormattedContent text={content} isUser={isUser} />

        {/* Stale Documentation Warning */}
        {message.stale_warning && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Caution: Referenced documentation has not been touched in 8+ months.</span>
          </div>
        )}

        {/* Citations List */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#0EB8A0]" />
              <span>Grounded Evidence Citations:</span>
            </div>
            <div className="space-y-1.5">
              {message.citations.map((c, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs text-slate-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-[#0EB8A0] shrink-0" />
                    <span className="font-semibold text-slate-900 truncate">{c.source}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold">
                      {c.kind}
                    </span>
                    {c.artifact_id && (
                      <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                        {c.artifact_id}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Contact Referral */}
        {message.suggested_contact && (
          <div className="mt-3 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#0EB8A0] shrink-0" />
              <span>Suggested Domain Expert:</span>
              <span className="font-bold capitalize">{message.suggested_contact}</span>
            </div>
            <span className="text-[10px] text-teal-800 font-semibold">Platform Engineering</span>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-900 font-bold flex items-center justify-center shrink-0 border border-teal-300 mt-0.5 text-xs shadow-2xs">
          U
        </div>
      )}
    </div>
  );
}
