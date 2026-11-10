import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
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

  // Smooth, non-scrollable centered logo animation sequence:
  // Stage 1 (150ms): Emblem appears centered
  // Stage 2 (600ms): "Genie" typography expands next to emblem
  // Stage 3 (1050ms): Signature smile curve expands below "Genie"
  // Stage 4 (1350ms): Login card smoothly glides up directly below the logo
  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage(1), 150);
    const t2 = setTimeout(() => setAnimStage(2), 600);
    const t3 = setTimeout(() => setAnimStage(3), 1050);
    const t4 = setTimeout(() => setAnimStage(4), 1350);

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090E] text-white flex flex-col items-center justify-center p-3 sm:p-4 relative select-none">
      {/* Ambient glowing background blobs matching Genie brand colors */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[340px] h-[260px] bg-pink-600/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Main Centered Container - Compact & Pulled Up */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center relative z-10 space-y-2.5">
        
        {/* Centered Animated Genie Logo (No extra wording below) */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-52 sm:w-60 aspect-[1024/562]">
            {/* Layer 1: Genie Symbol / Emblem */}
            <img
              src="/genie_splash_emblem.png"
              alt="Genie Symbol"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className={`absolute inset-0 w-full h-full object-contain select-none pointer-events-none transition-all duration-700 ease-out ${
                animStage >= 1
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
              }`}
            />

            {/* Layer 2: Genie Typography */}
            <div
              className={`absolute inset-0 overflow-hidden transition-all duration-700 ease-out ${
                animStage >= 2 ? 'w-full opacity-100 scale-100' : 'w-0 opacity-0 scale-95'
              }`}
            >
              <img
                src="/genie_splash_text.png"
                alt="Genie Text"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            </div>

            {/* Layer 3: Smile Curve below Genie */}
            <div
              className={`absolute inset-0 overflow-hidden transition-all duration-700 ease-out origin-left ${
                animStage >= 3 ? 'w-full opacity-100' : 'w-0 opacity-0'
              }`}
            >
              <img
                src="/genie_splash_smile.png"
                alt="Genie Curve Line"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-contain drop-shadow-[0_0_16px_rgba(236,72,153,0.6)] select-none pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Centered Login Card - Always in Premium OLED Dark Mode */}
        <div
          className={`w-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
            animStage >= 4
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-5 pointer-events-none'
          }`}
        >
          <div className="bg-[#0b0d14] rounded-2xl shadow-2xl border border-neutral-800/90 overflow-hidden text-white">
            {/* Form Body */}
            <div className="p-5 sm:p-6">
              {errorMsg && (
                <div className="mb-3.5 p-2.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Staff Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="admin@revoo.com"
                      className="w-full pl-9 pr-3 py-2 bg-[#12141e] border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-[#161926] focus:border-purple-500 transition-all font-medium"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-red-400 mt-0.5 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      {...register('password')}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-[#12141e] border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-[#161926] focus:border-purple-500 transition-all font-medium"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-red-400 mt-0.5 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-700 hover:via-pink-700 hover:to-rose-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
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
            </div>

            {/* Card Footer */}
            <div className="bg-[#07090e] px-5 py-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-400 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encrypted TLS Session</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-400">Genie Operations Hub</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
