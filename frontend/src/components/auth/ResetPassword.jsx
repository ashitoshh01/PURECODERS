import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { echoApi } from '../../api';

export default function ResetPassword({
  tokenProp = '',
  onNavigateLogin,
}) {
  const [token, setToken] = useState(() => {
    if (tokenProp) return tokenProp;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenProp) {
      setToken(tokenProp);
    }
  }, [tokenProp]);

  // Password Strength
  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
    };
  }, [newPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.length) score += 1;
    if (passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasNumberOrSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return { text: '', color: 'bg-slate-700', width: 'w-0' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    if (strengthScore === 2) return { text: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (strengthScore === 3) return { text: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { text: 'Strong', color: 'bg-[#18C6B0]', width: 'w-full' };
  }, [newPassword, strengthScore]);

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Please provide a valid password reset token.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await echoApi.resetPassword(token.trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The token may be expired or already used.');
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
      <div className="w-full max-w-md relative z-10">
        {/* ECHO Branding & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0d1d3d] border border-[#1b345f] shadow-lg mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#18C6B0] to-indigo-500 flex items-center justify-center text-[#071126] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">ECHO Security</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Set New Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose a strong password to secure your account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0b162c]/90 backdrop-blur-xl border border-[#19325c] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {success ? (
            <div className="space-y-4 animate-fadeIn text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Password Updated!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your password has been securely reset using bcrypt hashing. All existing sessions have been invalidated for security. You can now log in with your new password.
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full mt-4 bg-[#18C6B0] hover:bg-[#15b29e] text-[#071126] font-semibold rounded-xl py-2.5 px-4 text-sm shadow-lg shadow-[#18C6B0]/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reset Token */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Reset Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste reset token here"
                    required
                    className="w-full bg-[#081224] border border-[#1a345c] text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#18C6B0] focus:ring-1 focus:ring-[#18C6B0] transition"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-semibold ${
                        strengthScore >= 3 ? 'text-[#18C6B0]' : strengthScore === 2 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {strengthLabel.text}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#081224] rounded-full overflow-hidden border border-[#1a345c]">
                      <div className={`h-full ${strengthLabel.color} ${strengthLabel.width} transition-all duration-300`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
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
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
                {passwordsMatch === true && (
                  <p className="text-[11px] text-[#18C6B0] mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#18C6B0] hover:bg-[#15b29e] text-[#071126] font-semibold rounded-xl py-2.5 px-4 text-sm shadow-lg shadow-[#18C6B0]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#071126] border-t-transparent rounded-full animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition pt-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to sign in</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

