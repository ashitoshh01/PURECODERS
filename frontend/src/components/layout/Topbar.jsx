import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import echoIcon from '../../assets/echo-icon.png';

export default function Topbar({
  activeTab,
  onOpenMobile,
  desktopSidebarOpen = true,
  onToggleSidebar,
  successor,
  leaver,
  currentUser,
  onLogout,
  onSwitchRole,
}) {
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

  return (
    <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile/Desktop toggle hamburger + Echo Logo when sidebar is closed */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar || onOpenMobile}
          className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition ${
            desktopSidebarOpen ? 'lg:hidden' : 'flex'
          }`}
          aria-label="Open navigation sidebar"
          title="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* When sidebar is closed on desktop or on mobile, show the Echo brand logo at the title place */}
        <div className={`items-center gap-2.5 min-w-0 ${desktopSidebarOpen ? 'flex lg:hidden' : 'flex'}`}>
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src={echoIcon}
              alt="Echo Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 tracking-tight text-base leading-none">Echo</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md border bg-teal-50 text-teal-800 border-teal-200 hidden sm:inline-block">
              Knowledge-Risk Engine
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Single Circular Profile Avatar Icon */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="p-1 rounded-full hover:bg-slate-100 transition cursor-pointer focus:outline-none"
            aria-label="User profile and session menu"
            title={currentUser?.full_name || 'User Profile'}
          >
            <div
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold uppercase shadow-2xs transition hover:scale-105 ${activeRoleConfig.avatar}`}
            >
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'U'}
            </div>
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
