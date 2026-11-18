import React, { useState, useMemo } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Briefcase,
  Compass,
  Package,
  UserCheck,
  Check,
} from 'lucide-react';
import { echoApi } from '../../api';

export default function Signup({
  onSignupSuccess,
  onNavigateLogin,
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('incoming_contributor');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available roles with human-friendly descriptions
  const roles = [
    {
      id: 'project_lead',
      name: 'Project Lead',
      desc: 'Connects repos, monitors knowledge risk & administers team handovers.',
      icon: Compass,
      badge: 'Admin',
    },
    {
      id: 'departing_contributor',
      name: 'Departing Lead',
      desc: 'Conducts prioritized exit interviews to capture tacit architecture insights.',
      icon: Briefcase,
      badge: 'Leaver',
    },
    {
      id: 'incoming_contributor',
      name: 'Incoming Contributor',
      desc: 'Accesses approved handover packages, onboarding paths & Ask Echo AI.',
      icon: Package,
      badge: 'Successor',
    },
    {
      id: 'reviewer',
      name: 'Reviewer',
      desc: 'Verifies knowledge accuracy, validates decisions & approves final handovers.',
      icon: UserCheck,
      badge: 'Reviewer',
    },
  ];

  // Dynamic Password Strength Evaluation
  const passwordCriteria = useMemo(() => {
    return {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 1;
    if (passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasNumberOrSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (!password) return { text: '', color: 'bg-slate-200', width: 'w-0' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    if (strengthScore === 2) return { text: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (strengthScore === 3) return { text: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { text: 'Strong', color: 'bg-teal-500', width: 'w-full' };
  }, [password, strengthScore]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid work email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms of Service to create an account.');
      return;
    }

    setLoading(true);
    try {
      const res = await echoApi.register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (res && res.token && res.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('echo_token', res.token);
          localStorage.setItem('echo_user', JSON.stringify(res.user));
        }
        if (onSignupSuccess) {
          onSignupSuccess(res.user, res.token);
        }
      } else {
        throw new Error(res.detail || 'Failed to complete registration.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Main Container */}
      <div className="w-full max-w-lg">
        {/* ECHO Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-2 mb-4">
            <img src="/echo-icon.png" alt="Echo" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Intelligent project knowledge continuity &amp; handover platform
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  required
                  className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition shadow-2xs"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

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

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Primary Project Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-500 text-teal-950 shadow-2xs'
                          : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                          <span className={isSelected ? 'text-teal-800 font-semibold' : 'text-slate-700 font-medium'}>{r.name}</span>
                        </div>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {r.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Password strength:</span>
                    <span className={`font-semibold ${
                      strengthScore >= 3 ? 'text-teal-700' : strengthScore === 2 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {strengthLabel.text}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className={`h-full ${strengthLabel.color} ${strengthLabel.width} transition-all duration-300`} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1 font-medium">
                    <span className={`inline-flex items-center gap-1 ${passwordCriteria.length ? 'text-teal-700 font-semibold' : ''}`}>
                      {passwordCriteria.length ? <Check className="w-3 h-3 text-teal-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-0.5 mr-1 inline-block" />}
                      <span>8+ characters</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 ${passwordCriteria.hasUpper ? 'text-teal-700 font-semibold' : ''}`}>
                      {passwordCriteria.hasUpper ? <Check className="w-3 h-3 text-teal-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-0.5 mr-1 inline-block" />}
                      <span>Uppercase letter</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 ${passwordCriteria.hasLower ? 'text-teal-700 font-semibold' : ''}`}>
                      {passwordCriteria.hasLower ? <Check className="w-3 h-3 text-teal-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-0.5 mr-1 inline-block" />}
                      <span>Lowercase letter</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 ${passwordCriteria.hasNumberOrSpecial ? 'text-teal-700 font-semibold' : ''}`}>
                      {passwordCriteria.hasNumberOrSpecial ? <Check className="w-3 h-3 text-teal-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-0.5 mr-1 inline-block" />}
                      <span>Number or symbol</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className={`w-full bg-white border text-slate-900 placeholder:text-slate-400 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none transition shadow-2xs ${
                    passwordsMatch === false
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/10'
                      : passwordsMatch === true
                      ? 'border-teal-500 focus:ring-2 focus:ring-teal-500/10'
                      : 'border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10'
                  }`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMatch === false && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <XCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {passwordsMatch === true && (
                <p className="text-[11px] text-teal-700 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  I agree to the{' '}
                  <span className="text-teal-700 hover:underline font-semibold">Terms of Service</span> and{' '}
                  <span className="text-teal-700 hover:underline font-semibold">Knowledge Governance Policy</span>.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#071126] hover:bg-[#0d1d3d] text-white font-semibold rounded-xl py-2.5 px-4 text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link to Login */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-teal-700 hover:text-teal-800 hover:underline font-semibold cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
