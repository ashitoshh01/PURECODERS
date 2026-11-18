import React, { useState, useRef, useEffect } from 'react';
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
  ChevronUp,
  Sparkles,
  RotateCcw,
  Plus,
  Check,
  LogOut,
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
  currentUser,
  onLogout,
  onSwitchRole,
}) {
  const isLiveMode = activeProject?.mode === 'live';
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setProjectDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProjectDropdownOpen(false);
        setUserMenuOpen(false);
      }
    };
    if (projectDropdownOpen || userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [projectDropdownOpen, userMenuOpen]);

  // Role visual configuration
  const roleConfig = {
    project_lead: {
      label: 'Project Lead',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      dot: 'bg-[#18C6B0]',
      avatar: 'bg-teal-50 text-teal-800 border-teal-300',
    },
    departing_contributor: {
      label: 'Departing Lead',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      dot: 'bg-purple-600',
      avatar: 'bg-purple-50 text-purple-800 border-purple-300',
    },
    incoming_contributor: {
      label: 'Successor',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      avatar: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    reviewer: {
      label: 'Reviewer',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      avatar: 'bg-amber-50 text-amber-800 border-amber-300',
    },
  };

  const activeRoleConfig = roleConfig[currentUser?.role] || roleConfig.incoming_contributor;

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

            <div className="relative" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs hover:border-teal-500/80 hover:bg-slate-50 transition cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                aria-expanded={projectDropdownOpen}
                aria-label="Select active project workspace"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderGit2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="font-bold text-slate-900 truncate font-mono text-xs">
                    {activeProject ? activeProject.name.split('—')[0].trim() : 'Select Project'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                      isLiveMode
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-teal-50 text-teal-800 border-teal-200'
                    }`}
                  >
                    {isLiveMode ? 'Live Git' : 'Demo'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      projectDropdownOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Custom Styled Dropdown Menu */}
              {projectDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Workspaces ({projects.length})</span>
                    <span>Switch Repo</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {projects.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">No workspaces available</div>
                    ) : (
                      projects.map((p) => {
                        const isSelected = p.id === activeProject?.id;
                        const pIsLive = p.mode === 'live';
                        const pName = p.name.split('—')[0].trim();
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (onSelectProject) onSelectProject(p.id);
                              setProjectDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left cursor-pointer transition ${
                              isSelected
                                ? 'bg-teal-50/70 text-teal-950 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FolderGit2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                              <span className="truncate font-mono text-xs">{pName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md border ${
                                  pIsLive
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-teal-50 text-teal-800 border-teal-200'
                                }`}
                              >
                                {pIsLive ? 'Live Git' : 'Demo'}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
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

        {/* Sidebar Footer Controls & Account Profile */}
        <div className="p-3 border-t border-slate-200/90 space-y-2 bg-white relative">
          <div className="space-y-1">
            <button
              onClick={onResetDemo}
              disabled={resetting}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
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
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Engine &amp; Connectors</span>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </button>
          </div>

          {/* User Account Profile */}
          <div className="pt-2 border-t border-slate-100 relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition cursor-pointer text-left group bg-white shadow-2xs"
              aria-label="User profile and session menu"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold uppercase shadow-2xs transition group-hover:scale-105 shrink-0 ${activeRoleConfig.avatar}`}
                >
                  {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentUser?.full_name || 'ECHO User'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeRoleConfig.dot}`} />
                    <span>{currentUser?.role_display || activeRoleConfig.label}</span>
                  </div>
                </div>
              </div>
              <ChevronUp
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
                  userMenuOpen ? 'rotate-180 text-teal-600' : 'group-hover:text-slate-600'
                }`}
              />
            </button>

            {/* Profile Popover Menu (Opens Above the Profile Bar) */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 z-50 p-3 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                {/* User Identity Header */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold uppercase shadow-2xs shrink-0 ${activeRoleConfig.avatar}`}
                    >
                      {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {currentUser?.full_name || 'ECHO User'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {currentUser?.email || 'user@echo.dev'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Active Role
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${activeRoleConfig.color}`}
                    >
                      {currentUser?.role_display || activeRoleConfig.label}
                    </span>
                  </div>
                </div>

                {/* Role Perspective Switcher */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                    Switch Role Perspective
                  </span>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {[
                      { id: 'project_lead', label: 'Lead' },
                      { id: 'departing_contributor', label: 'Departing' },
                      { id: 'incoming_contributor', label: 'Successor' },
                      { id: 'reviewer', label: 'Reviewer' },
                    ].map((r) => {
                      const isCur = currentUser?.role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            if (onSwitchRole && !isCur) {
                              onSwitchRole(r.id);
                            }
                            setUserMenuOpen(false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition cursor-pointer flex items-center justify-between ${
                            isCur
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{r.label}</span>
                          {isCur && <span className="w-1.5 h-1.5 rounded-full bg-[#18C6B0]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sign Out Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out of ECHO</span>
                    </div>
                    <span className="text-[10px] text-slate-400">end session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
