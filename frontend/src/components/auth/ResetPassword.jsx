import React, { useState, useMemo, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  KeyRound,
} from 'lucide-react';
import { echoApi } from '../../api';

export default function ResetPassword({
  token: initialToken = '',
  onNavigateLogin,
}) {
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  // Password Strength Evaluation
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
    if (!newPassword) return { text: '', color: 'bg-slate-200', width: 'w-0' };
    if (strengthScore <= 1) return { text: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    if (strengthScore === 2) return { text: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (strengthScore === 3) return { text: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { text: 'Strong', color: 'bg-teal-500', width: 'w-full' };
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* ECHO Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-2 mb-4">
            <img src="/echo-icon.png" alt="Echo" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Set new password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose a strong password to secure your account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Password Updated!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your password has been securely reset. All previous sessions have been invalidated. You can now sign in with your new password.
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full mt-4 bg-[#071126] hover:bg-[#0d1d3d] text-white font-semibold rounded-xl py-2.5 px-4 text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reset Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reset Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste reset token here"
                    required
                    className="w-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition shadow-2xs"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Strength:</span>
                      <span className={`font-semibold ${
                        strengthScore >= 3 ? 'text-teal-700' : strengthScore === 2 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {strengthLabel.text}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div className={`h-full ${strengthLabel.color} ${strengthLabel.width} transition-all duration-300`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#071126] hover:bg-[#0d1d3d] text-white font-semibold rounded-xl py-2.5 px-4 text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition pt-2 flex items-center justify-center gap-1 cursor-pointer font-medium"
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
