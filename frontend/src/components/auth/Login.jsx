import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Users,
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

  // Pre-configured benchmark demo personas
  const demoUsers = [
    {
      role: 'Project Lead',
      email: 'lead@echo.dev',
      pass: 'EchoLead#2026',
      badge: 'Admin',
      color: 'border-teal-200 text-teal-800 bg-teal-50',
    },
    {
      role: 'Departing Lead',
      email: 'leaver@echo.dev',
      pass: 'EchoLeaver#2026',
      badge: 'Exit Interview',
      color: 'border-purple-200 text-purple-800 bg-purple-50',
    },
    {
      role: 'Successor',
      email: 'successor@echo.dev',
      pass: 'EchoSuccessor#2026',
      badge: 'Handover & AI',
      color: 'border-emerald-200 text-emerald-800 bg-emerald-50',
    },
    {
      role: 'Reviewer',
      email: 'reviewer@echo.dev',
      pass: 'EchoReviewer#2026',
      badge: 'Verification',
      color: 'border-amber-200 text-amber-800 bg-amber-50',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await echoApi.login(email.trim().toLowerCase(), password, rememberMe);
      if (res && res.token && res.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('echo_token', res.token);
          localStorage.setItem('echo_user', JSON.stringify(res.user));
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.user, res.token);
        }
      } else {
        throw new Error(res.detail || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* ECHO Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-2 mb-4">
            <img src="/echo-icon.png" alt="Echo" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Knowledge-Risk Engine for Seamless Team Handovers
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition shadow-2xs"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgot}
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold transition cursor-pointer"
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
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition shadow-2xs"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
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
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <span className="text-xs text-slate-700 font-medium">Remember this session</span>
              </label>
              <span className="text-[11px] text-slate-400">30-day persistence</span>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#071126] hover:bg-[#0d1d3d] text-white font-semibold rounded-xl py-2.5 px-4 text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sign-in Section */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Quick Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.role}
                  type="button"
                  onClick={() => handleSelectDemoUser(u.email, u.pass)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 transition text-left cursor-pointer flex flex-col group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-700 transition">
                      {u.role}
                    </span>
                    <span className={`text-[9px] font-semibold px-1 py-0.2 rounded border ${u.color}`}>
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
        <p className="text-center text-xs text-slate-500 mt-6">
          Don't have an ECHO account yet?{' '}
          <button
            type="button"
            onClick={onNavigateSignup}
            className="text-teal-700 hover:text-teal-800 hover:underline font-semibold cursor-pointer"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
}
