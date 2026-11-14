import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles } from 'lucide-react';

export default function DraggableEchoBot({ activeTab, onSelectTab }) {
  const [pos, setPos] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('echo_bot_position');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        }
      } catch {}
      const initX = 24;
      const initY = Math.max(80, window.innerHeight - 84);
      return { x: initX, y: initY };
    }
    return { x: 24, y: 600 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, hasMoved: false });
  const botRef = useRef(null);
  const currentPosRef = useRef(pos);
  currentPosRef.current = pos;

  // Re-clamp on window resize
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        const width = botRef.current?.offsetWidth || 180;
        const height = botRef.current?.offsetHeight || 50;
        const clampedX = Math.max(8, Math.min(window.innerWidth - width - 8, prev.x));
        const clampedY = Math.max(8, Math.min(window.innerHeight - height - 8, prev.y));
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: currentPosRef.current.x,
      origY: currentPosRef.current.y,
      hasMoved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.hasMoved = true;
    const width = botRef.current?.offsetWidth || 180;
    const height = botRef.current?.offsetHeight || 50;
    const newX = Math.max(8, Math.min(window.innerWidth - width - 8, dragRef.current.origX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - height - 8, dragRef.current.origY + dy));
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    try { localStorage.setItem('echo_bot_position', JSON.stringify(currentPosRef.current)); } catch {}
    // Simple click (no drag) → open Ask Echo tab
    if (!dragRef.current.hasMoved) {
      onSelectTab('ask');
    }
  };

  const handlePointerCancel = (e) => {
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  // Hide completely when Ask Echo tab is already open
  if (activeTab === 'ask') return null;

  return (
    <div
      ref={botRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-50 select-none group flex items-center gap-2 px-3 py-2 rounded-2xl border transition-shadow duration-150 cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'scale-105 shadow-2xl ring-2 ring-[#18C6B0] bg-[#071126] border-[#18C6B0] text-white opacity-95'
          : 'bg-[#071126] hover:bg-[#0c1a38] border-slate-700/80 text-white hover:border-[#18C6B0]/80 shadow-xl shadow-slate-950/30'
      }`}
      title="Ask Echo AI Assistant · Drag anywhere · Click to open chat"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectTab('ask');
        }
      }}
    >
      {/* Robot Avatar with live indicator dot */}
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0b1b36] to-[#12284d] border border-slate-700 flex items-center justify-center text-[#18C6B0] shadow-2xs group-hover:border-[#18C6B0]/60 transition">
          <Bot className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
        </div>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#071126]" />
      </div>

      {/* Label */}
      <div className="flex flex-col text-left pr-1">
        <div className="text-xs font-bold leading-none flex items-center gap-1 text-slate-100">
          <span>Ask Echo</span>
          <Sparkles className="w-3 h-3 text-[#18C6B0]" />
        </div>
        <span className="text-[10px] text-teal-300 font-mono leading-none mt-1">AI Assistant</span>
      </div>
    </div>
  );
}
