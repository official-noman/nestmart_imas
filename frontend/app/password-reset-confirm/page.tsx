'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getApiErrorData } from '@/lib/api';
import { Mail, Lock, KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle, ChevronLeft, Eye, EyeOff } from 'lucide-react';

type FieldErrors = { email?: string[]; token?: string[]; new_password?: string[] };

export default function PasswordResetConfirmPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', token: '', new_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setGlobalError(null);
  };

  const validate = () => {
    const errs: FieldErrors = {};
    if (!form.email.trim()) errs.email = ['Email is required.'];
    if (!form.token.trim()) errs.token = ['Reset token is required.'];
    if (!form.new_password || form.new_password.length < 8) errs.new_password = ['Password must be at least 8 characters.'];
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    setGlobalError(null);
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/password-reset-confirm/', form);
      setSuccess(true);
      setTimeout(() => router.push('/login?reset=true'), 2000);
    } catch (err) {
      const data = getApiErrorData(err);
      if (data && typeof data === 'object') {
        const { detail, non_field_errors, ...fieldErrors } = data;
        if (detail) setGlobalError(detail);
        else if (non_field_errors) setGlobalError(non_field_errors.join(' '));
        else setErrors(fieldErrors as FieldErrors);
      } else {
        setGlobalError('Reset failed. Please check your token and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f580_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f580_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Link href="/password-reset" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 mb-4">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reset your password</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Enter the token from your backend console and your new password.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          {success ? (
            <div className="flex flex-col items-center text-center py-16 px-8 gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 text-lg">Password reset!</p>
                <p className="mt-1.5 text-sm text-zinc-500">Redirecting you to login…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              {globalError && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-rose-700">{globalError}</p>
                </div>
              )}

              {/* Token info banner */}
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <KeyRound className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Find your reset token in the Django server console and paste it below.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${errors.email ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-600">{errors.email[0]}</p>}
              </div>

              {/* Token */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Reset Token</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    name="token"
                    value={form.token}
                    onChange={handleChange}
                    placeholder="Paste token from console"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm font-mono rounded-xl border bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${errors.token ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                  />
                </div>
                {errors.token && <p className="text-xs text-rose-600">{errors.token[0]}</p>}
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    name="new_password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.new_password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${errors.new_password ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.new_password && <p className="text-xs text-rose-600">{errors.new_password[0]}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors duration-150"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
                ) : (
                  <>Reset password <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
