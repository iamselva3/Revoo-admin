import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animStage, setAnimStage] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Animation timeline sequence requested by user:
  // 1. Initial 1 second: Login panel is centered alone
  // 2. 1 sec later: Login panel moves right
  // 3. Genie symbol emerges and moves left into place
  // 4. "Genie" typography expands next
  // 5. Curved gradient line below Genie expands
  // 6. Subtitles & operational badges smoothly fade in
  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage(1), 1000); // 1.0s: Panel slides right
    const t2 = setTimeout(() => setAnimStage(2), 1300); // 1.3s: Genie symbol moves left
    const t3 = setTimeout(() => setAnimStage(3), 1900); // 1.9s: Genie text expands
    const t4 = setTimeout(() => setAnimStage(4), 2500); // 2.5s: Curve line expands below
    const t5 = setTimeout(() => setAnimStage(5), 2900); // 2.9s: Taglines & badges fade in

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@genie.in',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.post('/auth/admin/login', values);
      const { tokens, admin } = res.data.data;
      login(tokens.accessToken, tokens.refreshToken, admin);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Ambient glowing background blobs matching Genie brand colors */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Animated Stage */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center relative z-10 min-h-[580px] gap-8 lg:gap-12">
        {/* Left Column: Genie Animated Branding */}
        <div
          className={`flex flex-col items-center lg:items-start text-center lg:text-left transition-all duration-700 ease-out ${
            animStage >= 1
              ? 'opacity-100 translate-x-0 scale-100 lg:w-1/2'
              : 'opacity-0 lg:-translate-x-8 scale-95 lg:w-0 overflow-hidden pointer-events-none'
          }`}
        >
          {/* Layered Animated Logo Canvas */}
          <div className="relative w-72 sm:w-88 aspect-[1024/562] mb-3">
            {/* Layer 1: Genie Symbol / Emblem */}
            <img
              src="/genie_splash_emblem.png"
              alt="Genie Symbol"
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out ${
                animStage >= 2
                  ? 'opacity-100 scale-100 translate-x-0'
                  : 'opacity-0 scale-75 translate-x-12'
              }`}
            />

            {/* Layer 2: Genie Typography (Expands next) */}
            <div
              className={`absolute inset-0 overflow-hidden transition-all duration-700 ease-out ${
                animStage >= 3 ? 'w-full opacity-100 scale-100' : 'w-0 opacity-0 scale-90'
              }`}
            >
              <img
                src="/genie_splash_text.png"
                alt="Genie Text"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Layer 3: Smile Curve (Expands underneath Genie next) */}
            <div
              className={`absolute inset-0 overflow-hidden transition-all duration-700 ease-out origin-left ${
                animStage >= 4 ? 'w-full opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <img
                src="/genie_splash_smile.png"
                alt="Genie Curve Line"
                className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(236,72,153,0.6)]"
              />
            </div>
          </div>

          {/* Subtitles & Operational Status (Fade in at stage 5) */}
          <div
            className={`space-y-4 max-w-md transition-all duration-700 ${
              animStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Control Centre • Live Operations</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              Autonomous Circular Device Valuation & Payout Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Real-time multi-variant pricing engine, instant doorstep buyback dispatch, dynamic inspection appraisals, and certified data erasure.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 pt-1 justify-center lg:justify-start">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-semibold">
                ⚡ 60s Dynamic Valuation
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-semibold">
                🔒 Certified Data Wipe
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-semibold">
                💳 Instant UPI Settlement
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Login Card (Smoothly slides right at 1.0 second) */}
        <div
          className={`w-full max-w-md transition-all duration-700 ease-out ${
            animStage >= 1
              ? 'translate-x-0'
              : 'lg:translate-x-0'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            {/* Header with Genie Branding */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-7 text-center text-white relative border-b border-slate-800">
              <div className="w-14 h-14 bg-slate-900/80 rounded-2xl mx-auto mb-3 flex items-center justify-center p-2 shadow-lg border border-purple-500/30 ring-4 ring-purple-500/10">
                <img src="/genie_symbol.png" alt="Genie Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400">
                Genie Control Centre
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enterprise Operations, Multi-Variant Pricing & Valuation
              </p>
            </div>

            {/* Form Body */}
            <div className="p-7">
              {errorMsg && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="admin@genie.in"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      {...register('password')}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:via-pink-700 hover:to-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Credentials */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                  Quick Fill Demo Credentials
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('admin@genie.in', 'RevooAdmin@2026!')}
                    className="p-2.5 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" /> Super Admin
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">admin@genie.in</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('inspector@revoo.com', 'Inspector@2026!')}
                    className="p-2.5 border border-slate-200 rounded-xl hover:border-pink-300 hover:bg-pink-50/50 text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-pink-600" /> Inspector
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">inspector@revoo.com</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-slate-50 px-7 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted TLS Session</span>
              </div>
              <span className="font-mono text-[10px]">Genie v2.4.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
