import React from 'react';
import echoIcon from '../../assets/echo-icon.png';
import {
  Compass,
  Mic,
  Package,
  Bot,
  Menu,
  FolderGit2,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  RotateCcw,
  Plus,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  desktopSidebarOpen = true,
  onToggleSidebar,
  onOpenSettings,
  onOpenConnectModal,
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
    {
      id: 'ask',
      label: 'AI Assistant',
      icon: Bot,
      badge: 'AI',
      description: 'Grounded successor copilot',
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out ${
          desktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'
        } ${mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        {/* Brand / Logo Header */}
        <div className="h-16 px-4 border-b border-slate-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src={echoIcon}
                alt="Echo Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base leading-none">Echo</span>
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
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1 truncate">
                Knowledge-Risk Engine
              </p>
            </div>
          </div>
          {/* Hamburger toggle button */}
          <button
            onClick={() => {
              if (onToggleSidebar) onToggleSidebar();
              if (onCloseMobile) onCloseMobile();
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle navigation sidebar"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Project Workspace Selector & Ingest Repo Action */}
        <div className="p-3 border-b border-slate-200/80 bg-slate-50/60 space-y-2.5">
          {/* Project Workspace Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1 px-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Workspace
              </span>
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

            <div className="relative">
              <div className="flex items-center gap-2 pl-2.5 pr-7 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 transition">
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
                <select
                  value={activeProject?.id || ''}
                  onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
                  className="w-full appearance-none bg-transparent border-0 text-slate-900 font-bold focus:ring-0 cursor-pointer pr-3 py-0 text-xs truncate font-mono"
                  aria-label="Select active project workspace"
                >
                  {projects.length === 0 ? (
                    <option value="">No projects</option>
                  ) : (
                    projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name.split('—')[0].trim()} ({p.mode === 'live' ? 'Live Git' : 'Demo'})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Ingest Repository Action Button */}
          <button
            onClick={() => {
              if (onOpenConnectModal) onOpenConnectModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#071126] bg-[#18C6B0] hover:bg-[#0EB8A0] transition shadow-xs cursor-pointer"
            title="Scan & ingest Git repository, Slack, or Jira"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Ingest Repository</span>
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

          {/* Tracked Projects / Repositories Section removed to avoid duplication with Topbar */}

          {/* Leaver Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Handover Parties
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isLiveMode ? 'Live Git' : 'Benchmark'}
              </span>
            </div>
            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Departing:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {leaver ? `${leaver.name}` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Successor:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {successor ? `${successor.name}` : 'None'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Manager:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">
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
        </div>
      </aside>
    </>
  );
}
