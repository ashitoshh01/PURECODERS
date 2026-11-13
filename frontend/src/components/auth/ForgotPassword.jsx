import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Terminal,
  ExternalLink
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
    <div className="min-h-screen bg-[#071126] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans selection:bg-[#18C6B0]/30 selection:text-white">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#18C6B0]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

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
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enter your email to receive recovery instructions.
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

          {successData ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                <div className="leading-relaxed">
                  <span className="font-semibold block text-sm mb-1 text-emerald-200">
                    Request Received
                  </span>
                  {successData.message}
                </div>
              </div>

              {/* Development Mode Direct Reset Helper */}
              {successData.dev_reset_token && (
                <div className="p-4 rounded-xl bg-[#081224] border border-[#1a345c] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#18C6B0]">
                    <Terminal className="w-4 h-4" />
                    <span>Development Safe Reset Flow</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Live SMTP email delivery is not configured in this environment. For seamless local testing, click below to immediately open the password reset interface with your token:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateResetWithToken) {
                        onNavigateResetWithToken(successData.dev_reset_token);
                      }
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#18C6B0]/15 hover:bg-[#18C6B0]/25 text-[#18C6B0] border border-[#18C6B0]/30 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Proceed to Reset Password</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-2 rounded bg-black/40 text-[10px] font-mono text-slate-400 truncate">
                    Token: {successData.dev_reset_token}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#081224] hover:bg-[#0e1d38] border border-[#1b345f] text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#18C6B0] hover:bg-[#15b29e] text-[#071126] font-semibold rounded-xl py-2.5 px-4 text-sm shadow-lg shadow-[#18C6B0]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#071126] border-t-transparent rounded-full animate-spin" />
                    <span>Generating token...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
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
                <span>Back to login</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

