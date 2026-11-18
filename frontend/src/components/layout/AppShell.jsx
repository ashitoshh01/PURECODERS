import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import Sidebar from './Sidebar';
import { SettingsModal } from './SettingsModal';
import ConnectRepoModal from './ConnectRepoModal';
import { startEchoTour } from '../../utils/tour';

export default function AppShell({
  activeTab,
  onSelectTab,
  onResetDemo,
  resetting,
  backendStatus,
  onRetryConnection,
  projects,
  activeProject,
  onSelectProject,
  onScanLiveGit,
  leaver,
  successor,
  manager,
  currentUser,
  onLogout,
  onSwitchRole,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [showTourPopup, setShowTourPopup] = useState(false);

  // Show the tour popup every time any user gets in / logs in
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        setShowTourPopup(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.id, currentUser?.email]);

  const handleStartTour = () => {
    setShowTourPopup(false);
    setDesktopSidebarOpen(true);
    setMobileOpen(true);
    setTimeout(() => {
      startEchoTour({
        onSelectTab,
        onOpenSidebar: (open) => {
          setDesktopSidebarOpen(open);
          setMobileOpen(open);
        },
      });
    }, 120);
  };

  return (
    <div
      className={`min-h-screen ${
        activeTab === 'ask' ? 'h-screen overflow-hidden bg-white' : 'bg-slate-50'
      } flex flex-col font-sans text-slate-900 selection:bg-[#18C6B0]/20 selection:text-slate-900`}
    >
      {/* Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        desktopSidebarOpen={desktopSidebarOpen}
        onToggleSidebar={() => setDesktopSidebarOpen((prev) => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenConnectModal={() => setConnectModalOpen(true)}
        onResetDemo={onResetDemo}
        resetting={resetting}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={onSelectProject}
        leaver={leaver}
        successor={successor}
        manager={manager}
        currentUser={currentUser}
        onLogout={onLogout}
        onSwitchRole={onSwitchRole}
        onStartTour={handleStartTour}
      />

      {/* Arrow button in the vertical middle of the sidebar edge to reopen sidebar when closed */}
      {(!desktopSidebarOpen || !mobileOpen) && (
        <button
          onClick={() => {
            setDesktopSidebarOpen(true);
            setMobileOpen(true);
          }}
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-7 h-14 bg-white hover:bg-slate-50 border border-l-0 border-slate-200/90 rounded-r-xl shadow-lg text-slate-600 hover:text-teal-600 transition cursor-pointer group ${
            desktopSidebarOpen ? 'lg:hidden flex' : 'flex'
          }`}
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* Main Content Area (offset by sidebar on desktop when open) */}
      <div
        className={`${
          desktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        } ${
          activeTab === 'ask'
            ? 'pl-0 h-screen overflow-hidden bg-white'
            : 'pl-8 sm:pl-10 lg:pl-0'
        } flex flex-col flex-1 min-w-0 transition-all duration-200 ease-in-out`}
      >
        <main
          className={`flex-1 w-full ${
            activeTab === 'ask'
              ? 'p-0 h-full overflow-hidden flex flex-col bg-white'
              : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'
          }`}
        >
          {children}
        </main>

        {activeTab !== 'ask' && (
          <footer className="py-4 px-6 border-t border-slate-200/90 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Echo Knowledge-Risk Engine · SQLite Persistent Database</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartTour}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>How It Works</span>
              </button>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#18C6B0]" />
                <span className="font-medium text-slate-600">Deterministic Knowledge Governance</span>
              </span>
            </div>
          </footer>
        )}
      </div>

      {/* Welcome & Tour Starter Modal (Appears every time user gets in) */}
      {showTourPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowTourPopup(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 pr-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Welcome to Echo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Take a quick 1-minute tour to see how it works?
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTourPopup(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleStartTour}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#18C6B0] hover:bg-[#0EB8A0] text-slate-950 transition cursor-pointer shadow-xs hover:shadow-sm flex items-center gap-1.5 group"
              >
                <span>Start Tour</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onScanLiveGit={onScanLiveGit}
      />
      <ConnectRepoModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onRepoScanned={onScanLiveGit}
      />
    </div>
  );
}
