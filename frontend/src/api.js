/**
 * Echo Centralized API Client & Service Layer
 * Supports production deployments (Render backend + Vercel frontend)
 * and local development seamlessly.
 */

// Determine the backend base URL dynamically:
// 1. Production: import.meta.env.VITE_API_URL configured on Vercel
// 2. Dev server proxy: relative '' when running on dev ports (3000/5173) or backend port (8000)
// 3. Fallback: localhost:8000
export function resolveApiBase() {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Same-origin relative URLs work across dev server (Vite proxy forwards /api to 8000)
  // and production single-container deployments (FastAPI serves API and frontend on same host)
  return '';
}

export const API_BASE = resolveApiBase();

export async function api(path, options = {}) {
  let url;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    url = path;
  } else {
    const cleanBase = API_BASE ? API_BASE.replace(/\/+$/, '') : '';
    const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    url = `${cleanBase}${cleanPath}`;
  }

  // Retrieve auth token from storage if present
  let authToken = null;
  if (typeof window !== 'undefined') {
    try {
      authToken = localStorage.getItem('echo_token');
    } catch {
      // storage unavailable
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  // Do not set Content-Type for FormData payloads (browser sets boundary automatically)
  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  let response;
  try {
    response = await fetch(url, {
      credentials: 'include', // Transmit HTTP-only cookies
      ...options,
      headers,
    });
  } catch (networkErr) {
    const detail = networkErr?.message || 'Network request failed';
    throw new Error(
      `Cannot reach ECHO backend at ${url} (${detail}). If the Render instance is waking from sleep, please wait 30-60 seconds and retry.`
    );
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // fallback to statusText
    }
    throw new Error(errorDetail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

// Service Methods
export const echoApi = {
  // Health & Connectors
  checkHealth: () => api('/api/health'),
  getConnectors: () => api('/api/connectors'),

  // GitHub Integration
  getGitHubStatus: () => api('/api/github/status'),
  connectGitHub: (token, authType = 'token') => api('/api/github/connect', {
    method: 'POST',
    body: JSON.stringify({ token, auth_type: authType }),
  }),
  disconnectGitHub: () => api('/api/github/disconnect', { method: 'POST' }),
  getGitHubRepositories: ({ search = '', visibility = null, sort = 'updated', page = 1, perPage = 30 } = {}) => {
    const q = new URLSearchParams({ sort, page: String(page), per_page: String(perPage) });
    if (search) q.set('search', search);
    if (visibility) q.set('visibility', visibility);
    return api(`/api/github/repositories?${q.toString()}`);
  },
  getGitHubRepository: (owner, repo) => api(`/api/github/repositories/${owner}/${repo}`),
  getGitHubBranches: (owner, repo) => api(`/api/github/repositories/${owner}/${repo}/branches`),
  ingestGitHubRepository: (payload) => api('/api/repositories/github/ingest', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getIngestionStatus: (jobId) => api(`/api/repositories/github/ingest/${jobId}/status`),

  // Projects
  getProjects: () => api('/api/projects'),
  selectProject: (projectId) => api('/api/projects/select', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  }),
  scanGitRepository: (repoPath = null, leaverName = null) => api('/api/projects/scan-git', {
    method: 'POST',
    body: JSON.stringify({ repo_path: repoPath, leaver_name: leaverName }),
  }),
  getRepositories: (projectId) => api(`/api/projects/${projectId}/repositories`),
  getTeamMembers: (projectId = null) => api(`/api/team-members${projectId ? `?project_id=${projectId}` : ''}`),

  // Risk Map & Artifacts
  getRiskMap: (projectId = null) => api(`/api/risk-map${projectId ? `?project_id=${projectId}` : ''}`),
  getArtifacts: (projectId = null) => api(`/api/artifacts${projectId ? `?project_id=${projectId}` : ''}`),
  getArtifactDetails: (artifactId, projectId = null) => api(`/api/artifacts/${artifactId}${projectId ? `?project_id=${projectId}` : ''}`),

  // Interview
  getInterviewQuestions: (limit = 6, projectId = null) =>
    api(`/api/interview/questions?limit=${limit}${projectId ? `&project_id=${projectId}` : ''}`),
  regenerateQuestions: (limit = 6, projectId = null) =>
    api(`/api/interview/questions/generate?limit=${limit}${projectId ? `&project_id=${projectId}` : ''}`, { method: 'POST' }),
  submitInterviewAnswer: (payload) => api('/api/interview/answers', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getInterviewAnswers: (projectId = null) => api(`/api/interview/answers${projectId ? `?project_id=${projectId}` : ''}`),

  // Handover
  getHandoverPackage: (projectId = null) => api(`/api/handover${projectId ? `?project_id=${projectId}` : ''}`),
  approveHandover: (approvedBy = null, projectId = null) => api('/api/handover/approve', {
    method: 'POST',
    body: JSON.stringify({ approved_by: approvedBy, project_id: projectId }),
  }),
  toggleOnboardingTask: (taskId) => api(`/api/handover/task/${taskId}/toggle`, {
    method: 'POST',
  }),

  // Ask Echo & ASI:One AI
  getAiStatus: () => api('/api/ai/status'),
  updateAiConfig: (apiKey, model = 'asi1') => api('/api/ai/config', {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey, model }),
  }),
  getConversations: (projectId = null) => api(`/api/conversations${projectId ? `?project_id=${projectId}` : ''}`),
  askEcho: (question, asker = null, projectId = null) => api('/api/ask', {
    method: 'POST',
    body: JSON.stringify({ question, asker, project_id: projectId }),
  }),

  // Reset Demo
  resetDemoState: () => api('/api/reset', { method: 'POST' }),

  // Authentication & Session
  register: (payload) => api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  login: (email, password, rememberMe = false) => api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
  }),
  logout: () => api('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => api('/api/auth/me'),
  forgotPassword: (email) => api('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  resetPassword: (token, newPassword) => api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  }),
  getDemoUsers: () => api('/api/auth/demo-users'),
  switchRole: (role) => api('/api/auth/switch-role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  }),
};

export function getRiskColor(pct) {
  if (pct >= 50) {
    return {
      bar: 'bg-rose-500',
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      badge: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
      dot: 'bg-rose-500',
    };
  }
  if (pct >= 25) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
      dot: 'bg-amber-500',
    };
  }
  return {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    dot: 'bg-emerald-500',
  };
}
