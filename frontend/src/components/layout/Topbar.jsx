import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ChevronRight,
  GitBranch,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  User,
  ShieldCheck,
  FolderGit2,
  Layers,
  ArrowRightLeft,
  Plus,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  Mic,
  Package,
  UserCheck
} from 'lucide-react';

export default function Topbar({
  activeTab,
  onOpenMobile,
  onResetDemo,
  resetting,
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
      avatar: 'bg-[#18C6B0]/15 text-teal-800 border-teal-300'
    },
    departing_contributor: {
      label: 'Departing Lead',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      dot: 'bg-purple-600',
      avatar: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    incoming_contributor: {
      label: 'Successor',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      avatar: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    reviewer: {
      label: 'Reviewer',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      avatar: 'bg-amber-100 text-amber-800 border-amber-300'
    },
  };

  const activeRoleConfig = roleConfig[currentUser?.role] || roleConfig.incoming_contributor;

  const pageTitles = {
    risk: 'Knowledge Risk Map',
    interview: `Exit Interview (${leaver?.name || 'Departing Lead'})`,
    handover: `Successor Package (${successor?.name || 'Successor'})`,
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
    <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger + Mode Pill + Project Selector + Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenMobile}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Mode Switcher Pill */}
        {projects.length > 1 && (
          <button
            onClick={handleToggleMode}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition shadow-2xs ${
              isLiveMode
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
            }`}
            title="Click to toggle between Live Git Ingestion and Benchmark Rubric Dataset"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-purple-600'
              }`}
            />
            <span>{isLiveMode ? 'Live Git: ECHO' : 'Benchmark Rubric'}</span>
            <ArrowRightLeft className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        )}

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="hidden md:inline text-slate-400">Project:</span>
          
          {/* Project dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={activeProject?.id || ''}
              onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
              className="appearance-none pl-6 pr-6 py-1 text-xs font-semibold rounded-md bg-slate-100/80 text-slate-800 border border-slate-200/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
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
            <FolderGit2 className="w-3.5 h-3.5 text-slate-500 absolute left-1.5 pointer-events-none" />
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold truncate max-w-[140px] sm:max-w-none">
            {pageTitles[activeTab] || 'Overview'}
          </span>
        </nav>
      </div>

      {/* Right: Connect Repo button, Actual Health Status, Reset shortcut, Successor badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Ingest Repo Button */}
        <button
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition shadow-2xs"
          title="Scan and ingest a real Git repository"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ingest Git Repo</span>
        </button>

        {/* Real Backend Connection Badge */}
        <button
          onClick={onRetryConnection}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
              : isChecking
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
          title={isOnline ? 'SQLite persistent database online on port 8000' : 'Backend connection error. Click to retry.'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : isChecking ? 'bg-amber-500 animate-spin' : 'bg-rose-500'
            }`}
          />
          <span className="hidden md:inline font-medium text-[11px]">
            {isOnline ? 'API :8000 (SQLite)' : isChecking ? 'Connecting...' : 'API Offline (Retry)'}
          </span>
        </button>

        {/* Reset Demo button */}
        <button
          onClick={onResetDemo}
          disabled={resetting}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          title="Reset benchmark state to pristine demo run"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-purple-600' : 'text-slate-400'}`} />
          <span>Reset</span>
        </button>

        {/* Interactive Authenticated User Profile Menu */}
        <div className="relative pl-2 border-l border-slate-200/80" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer text-left focus:outline-none"
            aria-label="User profile and session menu"
          >
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold uppercase shadow-2xs ${activeRoleConfig.avatar}`}>
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                {currentUser?.full_name || 'ECHO User'}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${activeRoleConfig.dot}`} />
                <span className="text-[10px] text-slate-500 font-medium leading-none truncate max-w-[100px]">
                  {currentUser?.role_display || activeRoleConfig.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 z-50 p-3 space-y-3 animate-fadeIn">
              {/* User Identity Header */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold uppercase shadow-sm ${activeRoleConfig.avatar}`}>
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${activeRoleConfig.color}`}>
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
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium text-left transition cursor-pointer flex items-center justify-between ${
                          isCur
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-500" />
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
