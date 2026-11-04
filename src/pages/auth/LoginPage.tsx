import React, { useState } from 'react';
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
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-revoo-accent selection:text-black">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center p-2 shadow-md">
            <img src="/revoo-logo.png" alt="REVOO Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">REVOO Control Centre</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Buyback Operations, Valuation & Returns
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@revoo.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-revoo-700 focus:bg-white transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-revoo-700 focus:bg-white transition-all"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-revoo-700 hover:bg-revoo-800 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
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

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Fill Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@revoo.com', 'RevooAdmin@2026!')}
                className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-left font-medium text-slate-700 transition"
              >
                <div className="font-bold text-slate-900">Super Admin</div>
                <div className="text-[10px] text-slate-500">admin@revoo.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('inspector@revoo.com', 'Inspector@2026!')}
                className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-left font-medium text-slate-700 transition"
              >
                <div className="font-bold text-slate-900">Inspector</div>
                <div className="text-[10px] text-slate-500">inspector@revoo.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-revoo-600" />
            <span>Encrypted Session</span>
          </div>
          <span>v1.0.0 Production</span>
        </div>
      </div>
    </div>
  );
};

