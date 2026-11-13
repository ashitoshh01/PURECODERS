import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Users
} from 'lucide-react';
import { echoApi } from '../../api';

export default function Login({
  onLoginSuccess,
  onNavigateSignup,
  onNavigateForgot,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [oauthNotice, setOauthNotice] = useState(null);

  // Pre-configured benchmark demo personas
  const demoUsers = [
    {
      role: 'Project Lead',
      email: 'lead@echo.dev',
      pass: 'EchoLead#2026',
      badge: 'Admin',
      color: 'border-teal-500/40 text-teal-300 bg-teal-500/10'
    },
    {
      role: 'Departing Lead',
      email: 'leaver@echo.dev',
      pass: 'EchoLeaver#2026',
      badge: 'Exit Interview',
      color: 'border-purple-500/40 text-purple-300 bg-purple-500/10'
    },
    {
      role: 'Successor',
      email: 'successor@echo.dev',
      pass: 'EchoSuccessor#2026',
      badge: 'Handover & AI',
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
    },
    {
      role: 'Reviewer',
      email: 'reviewer@echo.dev',
      pass: 'EchoReviewer#2026',
      badge: 'Verification',
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10'
    },
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setOauthNotice(null);

    try {
      const res = await echoApi.login(email.trim(), password, rememberMe);
      if (res && res.token && res.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('echo_token', res.token);
          localStorage.setItem('echo_user', JSON.stringify(res.user));
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.user, res.token);
        }
      } else {
        throw new Error('Invalid response structure received from authentication server.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleOAuthClick = (provider) => {
    setOauthNotice(
      `${provider} OAuth is not currently connected in environment variables (requires ${provider.toUpperCase()}_CLIENT_ID & ${provider.toUpperCase()}_CLIENT_SECRET in .env). Please sign in using password or one-click demo credentials below.`
    );
  };

  return (
    <div className="min-h-screen bg-[#071126] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans selection:bg-[#18C6B0]/30 selection:text-white">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-[#18C6B0]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* ECHO Branding & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0d1d3d] border border-[#1b345f] shadow-lg mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#18C6B0] to-indigo-500 flex items-center justify-center text-[#071126] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">ECHO Core</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#18C6B0] animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Continue where your team left off.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0b162c]/90 backdrop-blur-xl border border-[#19325c] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* OAuth Notice */}
          {oauthNotice && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1 leading-relaxed">{oauthNotice}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#081224] border border-[#1a345c] text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0] transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgot}
                  className="text-xs text-[#18C6B0] hover:text-[#18C6B0]/80 font-medium transition cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#081224] border border-[#1a345c] text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0] transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#081224] border-[#1a345c] text-[#18C6B0] focus:ring-[#18C6B0] focus:ring-offset-0 focus:ring-1 cursor-pointer accent-[#18C6B0]"
                />
                <span className="text-xs text-slate-300 font-medium">Remember this session</span>
              </label>
              <span className="text-[11px] text-slate-400">30-day token persistence</span>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18C6B0] hover:bg-[#15b29e] text-[#071126] font-semibold rounded-xl py-2.5 px-4 text-sm shadow-lg shadow-[#18C6B0]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#071126] border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to ECHO</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1b345f]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0b162c] px-2 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Social / OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthClick('GitHub')}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#081224] hover:bg-[#0e1c36] border border-[#1a345c] text-xs font-medium text-slate-300 transition cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuthClick('Google')}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#081224] hover:bg-[#0e1c36] border border-[#1a345c] text-xs font-medium text-slate-300 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>
          </div>

          {/* Quick Demo Sign-in Section */}
          <div className="mt-6 pt-5 border-t border-[#1b345f]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#18C6B0]" />
                <span>Quick Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Auto Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.role}
                  type="button"
                  onClick={() => handleSelectDemoUser(u.email, u.pass)}
                  className="p-2 rounded-lg bg-[#081224] hover:bg-[#0e1d38] border border-[#1b3560] hover:border-[#18C6B0]/50 transition text-left cursor-pointer flex flex-col group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-[#18C6B0] transition">
                      {u.role}
                    </span>
                    <span className={`text-[9px] px-1 py-0.2 rounded border ${u.color}`}>
                      {u.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                    {u.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Link to Signup */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an ECHO account yet?{' '}
          <button
            type="button"
            onClick={onNavigateSignup}
            className="text-[#18C6B0] hover:underline font-semibold cursor-pointer"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
}
