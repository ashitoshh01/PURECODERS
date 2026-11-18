import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
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
      />

      {/* Main Content Area (offset by sidebar on desktop when open) */}
      <div className={`${desktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'} flex flex-col flex-1 min-w-0 transition-all duration-200 ease-in-out`}>
        <Topbar
          activeTab={activeTab}
          onOpenMobile={() => {
            setMobileOpen(true);
            setDesktopSidebarOpen(true);
          }}
          desktopSidebarOpen={desktopSidebarOpen}
          onToggleSidebar={() => {
            setDesktopSidebarOpen((prev) => !prev);
            setMobileOpen((prev) => !prev);
          }}
          successor={successor}
          leaver={leaver}
          currentUser={currentUser}
          onLogout={onLogout}
          onSwitchRole={onSwitchRole}
        />

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
