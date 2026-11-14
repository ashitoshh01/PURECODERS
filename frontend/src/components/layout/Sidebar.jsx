import React from 'react';
import {
  Compass,
  Mic,
  Package,
  FolderGit2,
  Settings,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Sparkles,
  RotateCcw,
  X,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenHelp,
  onResetDemo,
  resetting,
  projects = [],
  activeProject,
  onSelectProject,
  leaver,
  successor,
  manager,
}) {
  const isLiveMode = activeProject?.mode === 'live';

  const navItems = [
    {
      id: 'risk',
      label: 'Risk Map',
      icon: Compass,
      badge: 'Live',
      description: 'Deterministic risk engine',
    },
    {
      id: 'interview',
      label: 'Exit Interview',
      icon: Mic,
      badge: '15m',
      description: 'Grounded AI extraction',
    },
    {
      id: 'handover',
      label: 'Handover Package',
      icon: Package,
      badge: null,
      description: 'Personalized successor plan',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {/* Brand / Logo Header */}
        <div className="h-16 px-5 border-b border-slate-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#071126] border border-slate-700/50 flex items-center justify-center text-[#18C6B0] shadow-sm">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base">Echo</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md border ${
                    isLiveMode
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}
                >
                  {isLiveMode ? 'Live Git' : 'Benchmark'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                Knowledge-Risk Engine
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Close navigation sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation Views */}
          <div>
            <div className="px-2 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspace Views
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-teal-50/80 text-teal-900 border border-teal-200/80 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition ${
                          isActive ? 'text-[#0EB8A0]' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tracked Projects / Repositories Section (Clean, browsing only) */}
          <div>
            <div className="px-2 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tracked Projects
            </div>
            <div className="space-y-1">
              {projects.length === 0 ? (
                <div className="p-3 text-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No projects tracked
                </div>
              ) : (
                projects.map((proj) => {
                  const isSelected = activeProject?.id === proj.id;
                  const isLive = proj.mode === 'live';
                  return (
                    <button
                      key={proj.id}
                      onClick={() => onSelectProject && onSelectProject(proj.id)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                        isSelected
                          ? isLive
                            ? 'bg-emerald-50 text-emerald-900 font-medium border border-emerald-200/80 shadow-2xs'
                            : 'bg-teal-50 text-teal-900 font-medium border border-teal-200/80 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FolderGit2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected
                              ? isLive
                                ? 'text-emerald-600'
                                : 'text-[#0EB8A0]'
                              : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{proj.name.split('—')[0].trim()}</span>
                      </div>
                      {isSelected && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isLive ? 'bg-emerald-500' : 'bg-[#18C6B0]'
                          }`}
                          title="Active Project"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Leaver Context Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Leaver Context
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {isLiveMode ? 'Git attribution' : activeProject ? 'Benchmark rubric' : 'Clean state'}
              </span>
            </div>
            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Departing:</span>
                <span className="font-semibold text-slate-800">
                  {leaver ? `${leaver.name}` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Successor:</span>
                <span className="font-semibold text-slate-800">
                  {successor ? `${successor.name}` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Manager:</span>
                <span className="font-semibold text-slate-800">
                  {manager ? `${manager.name}` : 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-slate-200/90 space-y-1 bg-white">
          <button
            onClick={onResetDemo}
            disabled={resetting}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
            title="Reset benchmark state: clears answers and decision logs"
          >
            <div className="flex items-center gap-2">
              <RotateCcw
                className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-rose-500' : 'text-slate-400'}`}
              />
              <span>Reset Benchmark State</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">clean</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Engine &amp; Connectors</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </button>

          <button
            onClick={onOpenHelp}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Demo Guide &amp; Rubric</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-300" />
          </button>
        </div>
      </aside>
    </>
  );
}
