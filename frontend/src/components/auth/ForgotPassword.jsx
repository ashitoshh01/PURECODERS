import React, { useState } from 'react';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { echoApi } from '../../api';

export default function ForgotPassword({
  onNavigateLogin,
  onNavigateResetWithToken,
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid registered email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      const res = await echoApi.forgotPassword(email.trim().toLowerCase());
      setSuccessData(res);
    } catch (err) {
      setError(err.message || 'Failed to submit password recovery request.');
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
            Reset your password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enter your email to receive recovery instructions.
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

          {successData ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                <div className="leading-relaxed">
                  <span className="font-bold block text-sm mb-1 text-emerald-950">
                    Request Received
                  </span>
                  {successData.message}
                </div>
              </div>

              {/* Development Mode Direct Reset Helper */}
              {successData.dev_reset_token && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                    <Terminal className="w-4 h-4 text-teal-600" />
                    <span>Development Direct Reset</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Live SMTP email delivery is unconfigured in this environment. For local testing, click below to open the reset password screen with your recovery token:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateResetWithToken) {
                        onNavigateResetWithToken(successData.dev_reset_token);
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Proceed to Reset Password</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-2 rounded-lg bg-slate-100 text-[10px] font-mono text-slate-600 truncate border border-slate-200">
                    Token: {successData.dev_reset_token}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#071126] hover:bg-[#0d1d3d] text-white font-semibold rounded-xl py-2.5 px-4 text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating token...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
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
                <span>Back to sign in</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
