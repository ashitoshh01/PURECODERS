import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronRight,
  FolderGit2,
  ArrowRightLeft,
  Plus,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export default function Topbar({
  activeTab,
  onOpenMobile,
  desktopSidebarOpen = true,
  onToggleSidebar,
  backendStatus = 'online', // 'checking' | 'online' | 'offline'
  onRetryConnection,
  projects = [],
  activeProject,
  onSelectProject,
  onOpenConnectModal,
  successor,
  leaver,
  currentUser,
  onLogout,
  onSwitchRole,
}) {
  const isLiveMode = activeProject?.mode === 'live';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userMenuOpen]);

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

  const pageTitles = {
    risk: 'Knowledge Risk Map',
    interview: `Exit Interview (${leaver?.name || 'Departing Lead'})`,
    handover: `Handover Package (${successor?.name || 'Successor'})`,
    ask: 'Ask Echo AI Assistant',
  };

  const isOnline = backendStatus === 'online';
  const isChecking = backendStatus === 'checking';

  // Toggle between demo and live mode
  const handleToggleMode = () => {
    if (!onSelectProject || projects.length < 2) return;
    const targetProject = projects.find((p) =>
      isLiveMode ? p.mode === 'demo' : p.mode === 'live'
    );
    if (targetProject) {
      onSelectProject(targetProject.id);
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile/Desktop toggle hamburger + Vercel-style Project Switcher + Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar || onOpenMobile}
          className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer ${
            desktopSidebarOpen ? 'lg:hidden' : 'flex'
          }`}
          aria-label="Open navigation sidebar"
          title="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Switcher Pill */}
        <div className="relative inline-flex items-center">
          <div className="flex items-center gap-1.5 pl-2.5 pr-7 py-1 text-xs font-semibold rounded-lg bg-slate-100/90 text-slate-800 border border-slate-200/80 hover:bg-slate-100 transition shadow-2xs font-mono">
            <FolderGit2 className="w-3.5 h-3.5 text-slate-500 shrink-0 pointer-events-none" />
            <select
              value={activeProject?.id || ''}
              onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
              className="appearance-none bg-transparent border-0 text-slate-800 font-semibold focus:ring-0 cursor-pointer pr-1 py-0.5 max-w-[130px] sm:max-w-[200px] truncate"
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
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Mode Switcher Pill */}
        {projects.length > 1 && (
          <button
            onClick={handleToggleMode}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition shadow-2xs cursor-pointer ${
              isLiveMode
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
            }`}
            title="Click to toggle between Live Git Ingestion and Benchmark Rubric Dataset"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-[#18C6B0]'
              }`}
            />
            <span>{isLiveMode ? 'Live Git: ECHO' : 'Benchmark Rubric'}</span>
            <ArrowRightLeft className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        )}

        {/* Breadcrumb Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium min-w-0">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-900 font-semibold truncate">
            {pageTitles[activeTab] || 'Overview'}
          </span>
        </nav>
      </div>

      {/* Right Controls: Ingest Repository + Subtle Connection Status + User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Primary Ingest Repository Action Button */}
        <button
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#071126] bg-[#18C6B0] hover:bg-[#0EB8A0] rounded-xl shadow-xs transition cursor-pointer"
          title="Scan and ingest a Git repository"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Ingest Repository</span>
        </button>

        {/* Subtle, Non-Intrusive Connection Status */}
        <button
          onClick={onRetryConnection}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
            isOnline
              ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              : isChecking
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
          }`}
          title={
            isOnline
              ? 'Engine connected & synchronized on port 8000 (SQLite)'
              : 'Connection interrupted. Click to retry.'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline
                ? 'bg-emerald-500 animate-pulse'
                : isChecking
                ? 'bg-amber-500 animate-spin'
                : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline font-semibold text-[11px]">
            {isOnline ? 'Connected' : isChecking ? 'Connecting...' : 'Offline (Retry)'}
          </span>
        </button>

        {/* Authenticated User Profile Menu (Unclipped & Spacious) */}
        <div className="relative pl-1 border-l border-slate-200/90" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 px-2 py-1 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left focus:outline-none"
            aria-label="User profile and session menu"
          >
            <div
              className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold uppercase shadow-2xs ${activeRoleConfig.avatar}`}
            >
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.full_name || 'ECHO User'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activeRoleConfig.dot}`} />
                <span className="text-[10px] text-slate-500 font-medium leading-none">
                  {currentUser?.role_display || activeRoleConfig.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 z-50 p-3 space-y-3 fade-in">
              {/* User Identity Header */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold uppercase shadow-2xs ${activeRoleConfig.avatar}`}
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
    </header>
  );
}
