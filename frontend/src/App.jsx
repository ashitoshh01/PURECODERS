import React, { useState, useEffect, useCallback } from 'react';
import AppShell from './components/layout/AppShell';
import RiskMap from './components/risk/RiskMap';
import ExitInterview from './components/interview/ExitInterview';
import Handover from './components/handover/Handover';
import AskEcho from './components/ask/AskEcho';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import { echoApi } from './api';
import { Sparkles } from 'lucide-react';

function getTabFromPath(pathname) {
  const clean = (pathname || '').toLowerCase().replace(/^\/+|\/+$/g, '');
  if (clean === 'interview') return 'interview';
  if (clean === 'handover') return 'handover';
  if (clean === 'ask' || clean === 'chat' || clean === 'ai') return 'ask';
  if (clean === 'risk' || clean === 'dashboard' || clean === '') return 'risk';
  return 'risk';
}

function getAuthRouteFromPath(pathname) {
  const clean = (pathname || '').toLowerCase().replace(/^\/+|\/+$/g, '');
  if (clean === 'signup' || clean === 'register') return 'signup';
  if (clean === 'forgot' || clean === 'forgot-password') return 'forgot';
  if (clean === 'reset' || clean === 'reset-password') return 'reset';
  return 'login';
}

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('echo_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [authChecking, setAuthChecking] = useState(true);
  const [authView, setAuthView] = useState(() => {
    if (typeof window !== 'undefined') {
      return getAuthRouteFromPath(window.location.pathname);
    }
    return 'login';
  });

  const [resetToken, setResetToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname);
    }
    return 'risk';
  });
  const [focusArtifactId, setFocusArtifactId] = useState(null);
  const [handoverKey, setHandoverKey] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  // Dynamic Project & Team Member State
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // Session verification on mount / refresh
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        const res = await echoApi.getCurrentUser();
        if (isMounted && res && res.authenticated && res.user) {
          setCurrentUser(res.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('echo_user', JSON.stringify(res.user));
            // If currently on an auth route, redirect to workspace
            const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
            if (['login', 'signup', 'register', 'forgot', 'forgot-password', 'reset', 'reset-password'].includes(path)) {
              const defaultTab = res.user.role === 'departing_contributor' ? 'interview' : 'risk';
              setActiveTab(defaultTab);
              window.history.replaceState({ tab: defaultTab }, '', defaultTab === 'risk' ? '/' : `/${defaultTab}`);
            }
          }
        } else if (isMounted) {
          setCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('echo_token');
            localStorage.removeItem('echo_user');
          }
        }
      } catch (err) {
        if (isMounted) {
          setCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('echo_token');
            localStorage.removeItem('echo_user');
          }
        }
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    }

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync route changes with browser history and popstate
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab !== 'interview') setFocusArtifactId(null);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'risk' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  }, []);

  const navigateToAuthView = useCallback((view, token = null) => {
    setAuthView(view);
    if (token) setResetToken(token);
    if (typeof window !== 'undefined') {
      let targetPath = `/${view}`;
      if (view === 'forgot') targetPath = '/forgot-password';
      if (view === 'reset') targetPath = token ? `/reset-password?token=${encodeURIComponent(token)}` : '/reset-password';
      window.history.pushState({ authView: view }, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (['signup', 'register'].includes(path)) {
        setAuthView('signup');
      } else if (['forgot', 'forgot-password'].includes(path)) {
        setAuthView('forgot');
      } else if (['reset', 'reset-password'].includes(path)) {
        setAuthView('reset');
        const params = new URLSearchParams(window.location.search);
        setResetToken(params.get('token') || '');
      } else if (['login'].includes(path)) {
        setAuthView('login');
      } else {
        setActiveTab(getTabFromPath(window.location.pathname));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle successful login
  const handleLoginSuccess = useCallback((user, token) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('echo_user', JSON.stringify(user));
      localStorage.setItem('echo_token', token);
    }
    // Determine optimal workspace tab based on role
    let targetTab = 'risk';
    if (user.role === 'departing_contributor') targetTab = 'interview';
    else if (user.role === 'incoming_contributor') targetTab = 'handover';
    else if (user.role === 'reviewer') targetTab = 'handover';

    setActiveTab(targetTab);
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: targetTab }, '', targetTab === 'risk' ? '/' : `/${targetTab}`);
    }
  }, []);

  // Handle user logout
  const handleLogout = useCallback(async () => {
    try {
      await echoApi.logout();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('echo_token');
      localStorage.removeItem('echo_user');
      window.history.pushState({}, '', '/login');
    }
    setAuthView('login');
  }, []);

  // Handle role switching on the fly
  const handleSwitchRole = useCallback(async (newRole) => {
    try {
      const res = await echoApi.switchRole(newRole);
      if (res && res.user) {
        setCurrentUser(res.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('echo_user', JSON.stringify(res.user));
        }
      }
    } catch (err) {
      alert(`Role switch failed: ${err.message}`);
    }
  }, []);

  // Fetch projects and active project state
  const loadProjectsAndTeam = useCallback(async () => {
    try {
      const healthRes = await echoApi.checkHealth();
      setBackendStatus('online');
      if (healthRes.active_project) {
        setActiveProject(healthRes.active_project);
      } else {
        setActiveProject(null);
      }

      const pRes = await echoApi.getProjects();
      if (pRes && pRes.projects && pRes.projects.length > 0) {
        setProjects(pRes.projects);
        const active = pRes.projects.find((p) => p.is_active) || pRes.projects[0];
        setActiveProject(active || null);
      } else {
        setProjects([]);
        setActiveProject(null);
      }

      const mRes = await echoApi.getTeamMembers();
      if (mRes && mRes.team_members) {
        setTeamMembers(mRes.team_members);
      } else {
        setTeamMembers([]);
      }
    } catch (e) {
      setBackendStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadProjectsAndTeam();
      const interval = setInterval(loadProjectsAndTeam, 12000);
      return () => clearInterval(interval);
    }
  }, [currentUser, loadProjectsAndTeam]);

  // Project selection handler
  const handleSelectProject = async (projectId) => {
    try {
      const res = await echoApi.selectProject(projectId);
      if (res.active_project) {
        setActiveProject(res.active_project);
      }
      const mRes = await echoApi.getTeamMembers(projectId);
      if (mRes && mRes.team_members) {
        setTeamMembers(mRes.team_members);
      }
      setHandoverKey((k) => k + 1);
    } catch (e) {
      alert(`Failed to switch project: ${e.message}`);
    }
  };

  const handleScanLiveGit = async () => {
    await loadProjectsAndTeam();
    setHandoverKey((k) => k + 1);
  };

  const handleNavigateToInterview = (artifactId) => {
    setFocusArtifactId(artifactId);
    handleTabChange('interview');
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database to clean slate? This clears ingested repository data and artifacts, but preserves user accounts and active sessions.')) {
      return;
    }
    setResetting(true);
    try {
      await echoApi.resetDemoState();
      setActiveProject(null);
      setProjects([]);
      setTeamMembers([]);
      setHandoverKey((k) => k + 1);
      await loadProjectsAndTeam();
    } catch (e) {
      alert(`Reset failed: ${e.message}`);
    } finally {
      setTimeout(() => setResetting(false), 300);
    }
  };

  // 1. Initial Session Verification Screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 selection:bg-teal-100 selection:text-teal-900">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 p-2 flex items-center justify-center shadow-xs">
            <img src="/echo-icon.png" alt="Echo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Echo</h2>
            <p className="text-xs text-slate-500 mt-0.5">Verifying workspace session...</p>
          </div>
          <div className="w-28 h-1 bg-slate-200 rounded-full overflow-hidden mt-1">
            <div className="w-full h-full bg-slate-900 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Routes (Login, Signup, Forgot, Reset)
  if (!currentUser) {
    if (authView === 'signup') {
      return (
        <Signup
          onSignupSuccess={handleLoginSuccess}
          onNavigateLogin={() => navigateToAuthView('login')}
        />
      );
    }

    if (authView === 'forgot') {
      return (
        <ForgotPassword
          onNavigateLogin={() => navigateToAuthView('login')}
          onNavigateResetWithToken={(tok) => navigateToAuthView('reset', tok)}
        />
      );
    }

    if (authView === 'reset') {
      return (
        <ResetPassword
          tokenProp={resetToken}
          onNavigateLogin={() => navigateToAuthView('login')}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNavigateSignup={() => navigateToAuthView('signup')}
        onNavigateForgot={() => navigateToAuthView('forgot')}
      />
    );
  }

  // 3. Authenticated Dashboard Routes
  const leaver = teamMembers.find((m) => m.is_leaver) || null;
  const successor = teamMembers.find((m) => m.is_successor) || null;
  const manager = teamMembers.find((m) => m.is_manager) || null;

  return (
    <AppShell
      activeTab={activeTab}
      onSelectTab={handleTabChange}
      onResetDemo={handleResetDemo}
      resetting={resetting}
      backendStatus={backendStatus}
      onRetryConnection={loadProjectsAndTeam}
      projects={projects}
      activeProject={activeProject}
      onSelectProject={handleSelectProject}
      onScanLiveGit={handleScanLiveGit}
      leaver={leaver}
      successor={successor}
      manager={manager}
      currentUser={currentUser}
      onLogout={handleLogout}
      onSwitchRole={handleSwitchRole}
    >
      <div style={{ display: activeTab === 'risk' ? 'block' : 'none' }}>
        <RiskMap
          onNavigateToInterview={handleNavigateToInterview}
          activeProject={activeProject}
          refreshKey={handoverKey}
          currentUser={currentUser}
        />
      </div>

      <div style={{ display: activeTab === 'interview' ? 'block' : 'none' }}>
        <ExitInterview
          key={handoverKey}
          focusArtifactId={focusArtifactId}
          onAnswerSubmitted={() => setHandoverKey((k) => k + 1)}
          activeProject={activeProject}
          refreshKey={handoverKey}
          currentUser={currentUser}
        />
      </div>

      <div style={{ display: activeTab === 'handover' ? 'block' : 'none' }}>
        <Handover
          key={handoverKey}
          active={activeTab === 'handover'}
          onNavigateToInterview={handleNavigateToInterview}
          activeProject={activeProject}
          refreshKey={handoverKey}
          currentUser={currentUser}
        />
      </div>

      <div className={activeTab === 'ask' ? 'flex-1 flex flex-col h-full w-full' : 'hidden'}>
        <AskEcho
          key={handoverKey}
          activeProject={activeProject}
          successor={successor}
          refreshKey={handoverKey}
          currentUser={currentUser}
        />
      </div>
    </AppShell>
  );
}

