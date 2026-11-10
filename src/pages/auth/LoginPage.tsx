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

  // Smooth, centered logo animation sequence:
  // Stage 1 (0ms - 200ms): Logo emblem appears centered
  // Stage 2 (600ms): "Genie" typography expands next to emblem
  // Stage 3 (1100ms): Gradient curved line expands below "Genie"
  // Stage 4 (1500ms): Login panel smoothly slides up into place right below the centered logo
  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage(1), 200); // 0.2s: Emblem in center
    const t2 = setTimeout(() => setAnimStage(2), 700); // 0.7s: Genie text expands
    const t3 = setTimeout(() => setAnimStage(3), 1200); // 1.2s: Smile curve expands
    const t4 = setTimeout(() => setAnimStage(4), 1600); // 1.6s: Login card reveals smoothly

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
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
      email: 'admin@revoo.com',
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
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient glowing background blobs matching Genie brand colors */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Centered Container */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center relative z-10 space-y-6">
        
        {/* Centered Animated Genie Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-64 sm:w-72 aspect-[1024/562]">
            {/* Layer 1: Genie Symbol / Emblem */}
            <img
              src="/genie_splash_emblem.png"
              alt="Genie Symbol"
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ease-out ${
                animStage >= 1
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
              }`}
            />

            {/* Layer 2: Genie Typography (Expands next) */}
            <div
              className={`absolute inset-0 overflow-hidden transition-all duration-700 ease-out ${
                animStage >= 2 ? 'w-full opacity-100 scale-100' : 'w-0 opacity-0 scale-95'
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
                animStage >= 3 ? 'w-full opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <img
                src="/genie_splash_smile.png"
                alt="Genie Curve Line"
                className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(236,72,153,0.6)]"
              />
            </div>
          </div>

          {/* Clean Centered Header Text */}
          <div
            className={`transition-all duration-700 mt-1 ${
              animStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400">
              Genie Control Centre
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise Buyback Operations, Valuation & Returns
            </p>
          </div>
        </div>

        {/* Centered Login Card (Smoothly slides up & fades in right below logo) */}
        <div
          className={`w-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
            animStage >= 4
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6 pointer-events-none'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            {/* Form Body */}
            <div className="p-6 sm:p-7">
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
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
                      placeholder="admin@revoo.com"
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

              {/* Quick Fill Credentials */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                  Quick Fill Credentials
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('admin@revoo.com', 'RevooAdmin@2026!')}
                    className="p-2.5 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 text-left transition cursor-pointer"
                  >
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" /> Super Admin
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">admin@revoo.com</div>
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
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted TLS Session</span>
              </div>
              <span className="font-mono text-[10px]">Genie Operations Hub</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
