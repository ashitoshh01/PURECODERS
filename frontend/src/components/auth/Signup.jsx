import React, { useState, useMemo } from 'react';
import {
  Sparkles,
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
  Mic,
  Package,
  UserCheck,
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Role choices matching prompt requirements
  const roles = [
    {
      id: 'project_lead',
      name: 'Project Lead / Manager',
      desc: 'Manages repository workspaces, permissions & contributor handover status.',
      icon: Briefcase,
      badge: 'Lead',
    },
    {
      id: 'departing_contributor',
      name: 'Departing Contributor',
      desc: 'Participates in grounded exit interviews to capture tacit architecture decisions.',
      icon: Mic,
      badge: 'Leaver',
    },
    {
      id: 'incoming_contributor',
      name: 'Incoming Contributor',
      desc: 'Accesses approved handover packages, onboarding paths & honest Ask Echo AI.',
      icon: Package,
      badge: 'Successor',
    },
    {
      id: 'reviewer',
      name: 'Reviewer',
      desc: 'Verifies knowledge accuracy, validates decisions & approves final handover packages.',
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
    if (!password) return { text: '', color: 'bg-slate-700', width: 'w-0' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    if (strengthScore === 2) return { text: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (strengthScore === 3) return { text: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { text: 'Strong', color: 'bg-[#18C6B0]', width: 'w-full' };
  }, [password, strengthScore]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please provide your full name (minimum 2 characters).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid corporate or team email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (!termsAccepted) {
      setError('Please agree to the Terms of Service and Privacy Policy to proceed.');
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
        throw new Error('Registration succeeded but received unexpected server response.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071126] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans selection:bg-[#18C6B0]/30 selection:text-white">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#18C6B0]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg relative z-10 fade-in">
        {/* ECHO Branding & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0d1d3d] border border-[#1b345f] shadow-lg mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#18C6B0] to-teal-400 flex items-center justify-center text-[#071126] shadow-sm font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">ECHO Core</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#18C6B0] animate-pulse" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create your ECHO Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Intelligent Project Knowledge Continuity &amp; Handover Platform
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-[#0b162c]/90 backdrop-blur-xl border border-[#19325c] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  required
                  className="w-full bg-[#081224] border border-[#1a345c] text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0] transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                          ? 'bg-[#18C6B0]/10 border-[#18C6B0] text-white shadow-2xs'
                          : 'bg-[#081224] border-[#1a345c] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#18C6B0]' : 'text-slate-400'}`} />
                          <span className={isSelected ? 'text-[#18C6B0]' : ''}>{r.name}</span>
                        </div>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#18C6B0]" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {r.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Password strength:</span>
                    <span className={`font-bold ${
                      strengthScore >= 3 ? 'text-[#18C6B0]' : strengthScore === 2 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {strengthLabel.text}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#081224] rounded-full overflow-hidden border border-[#1a345c]">
                    <div className={`h-full ${strengthLabel.color} ${strengthLabel.width} transition-all duration-300`} />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1 font-medium">
                    <span className={passwordCriteria.length ? 'text-[#18C6B0]' : ''}>
                      {passwordCriteria.length ? '✓' : '•'} 8+ characters
                    </span>
                    <span className={passwordCriteria.hasUpper ? 'text-[#18C6B0]' : ''}>
                      {passwordCriteria.hasUpper ? '✓' : '•'} Uppercase letter
                    </span>
                    <span className={passwordCriteria.hasLower ? 'text-[#18C6B0]' : ''}>
                      {passwordCriteria.hasLower ? '✓' : '•'} Lowercase letter
                    </span>
                    <span className={passwordCriteria.hasNumberOrSpecial ? 'text-[#18C6B0]' : ''}>
                      {passwordCriteria.hasNumberOrSpecial ? '✓' : '•'} Number or symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className={`w-full bg-[#081224] border text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none transition ${
                    passwordsMatch === false
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : passwordsMatch === true
                      ? 'border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0]'
                      : 'border-[#1a345c] focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0]'
                  }`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMatch === false && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
                  <XCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
              {passwordsMatch === true && (
                <p className="text-[11px] text-[#18C6B0] mt-1 flex items-center gap-1 font-medium">
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
                  className="w-4 h-4 mt-0.5 rounded bg-[#081224] border-[#1a345c] text-[#18C6B0] focus:ring-[#18C6B0] focus:ring-offset-0 focus:ring-1 cursor-pointer accent-[#18C6B0]"
                />
                <span className="text-xs text-slate-300 leading-normal">
                  I agree to the{' '}
                  <span className="text-[#18C6B0] hover:underline font-semibold">ECHO Terms of Service</span> and{' '}
                  <span className="text-[#18C6B0] hover:underline font-semibold">Knowledge Governance Policy</span>.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18C6B0] hover:bg-[#0EB8A0] text-[#071126] font-bold rounded-xl py-2.5 px-4 text-sm shadow-lg shadow-[#18C6B0]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#071126] border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account &amp; Enter ECHO</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Link to Login */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-[#18C6B0] hover:text-[#0EB8A0] hover:underline font-bold cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
