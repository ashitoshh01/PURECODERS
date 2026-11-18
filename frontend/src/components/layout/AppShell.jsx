import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import echoIcon from '../../assets/echo-icon.png';
import Sidebar from './Sidebar';
import { SettingsModal } from './SettingsModal';
import ConnectRepoModal from './ConnectRepoModal';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#18C6B0]/20 selection:text-slate-900">
      {/* Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
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
      />

      {/* Main Content Area (permanently offset by docked sidebar on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Mobile Header (Only on small screens < lg, inline non-overlapping flow) */}
        <div className="lg:hidden h-14 px-4 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Open navigation menu"
              title="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={echoIcon} alt="Echo Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold text-slate-900 tracking-tight text-sm">Echo</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-teal-50 text-teal-800 border-teal-200">
            Knowledge-Risk
          </span>
        </div>

        <main className={`flex-1 w-full mx-auto ${activeTab === 'ask' ? 'p-3 sm:p-5 lg:p-6 max-w-7xl flex flex-col' : 'p-4 sm:p-6 lg:p-8 max-w-7xl'}`}>
          {children}
        </main>

        <footer className="py-4 px-6 border-t border-slate-200/90 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Echo Knowledge-Risk Engine · SQLite Persistent Database</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18C6B0]" />
            <span className="font-medium text-slate-600">Deterministic Knowledge Governance</span>
          </span>
        </footer>
      </div>

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
