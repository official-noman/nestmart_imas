'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { User, Mail, Lock, ChevronDown, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'Admin', label: 'Admin', description: 'Full system access' },
  { value: 'Accountant', label: 'Accountant', description: 'Financial operations' },
  { value: 'Manager', label: 'Manager', description: 'Reports & oversight' },
  { value: 'Viewer', label: 'Viewer', description: 'Read-only access' },
];

type FieldErrors = {
  username?: string[];
  email?: string[];
  password?: string[];
  role?: string[];
  non_field_errors?: string[];
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setGlobalError(null);
  };

  const validate = () => {
    const errs: FieldErrors = {};
    if (!form.username.trim()) errs.username = ['Username is required.'];
    if (!form.email.trim()) errs.email = ['Email is required.'];
    if (!form.password || form.password.length < 8) errs.password = ['Password must be at least 8 characters.'];
    if (!form.role) errs.role = ['Please select a role.'];
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setGlobalError(null);
    try {
      await axios.post('http://127.0.0.1:8000/api/auth/register/', form);
      setSuccess(true);
      setTimeout(() => router.push('/login?registered=true'), 1800);
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const { non_field_errors, detail, ...fieldErrors } = data;
        if (detail) setGlobalError(detail);
        else if (non_field_errors) setGlobalError(non_field_errors.join(' '));
        else setErrors(fieldErrors as FieldErrors);
      } else {
        setGlobalError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f580_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f580_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 mb-4">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          {success ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-semibold text-zinc-900 text-lg">Account created!</p>
              <p className="text-sm text-zinc-500">Redirecting you to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              {globalError && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-rose-700">{globalError}</p>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${errors.username ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                  />
                </div>
                {errors.username && <p className="text-xs text-rose-600">{errors.username[0]}</p>}
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

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${errors.password ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'}`}
                  />
                </div>
                {errors.password && <p className="text-xs text-rose-600">{errors.password[0]}</p>}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Role</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={`w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-xl border bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${errors.role ? 'border-rose-300 bg-rose-50' : 'border-zinc-200'} ${!form.role ? 'text-zinc-400' : ''}`}
                  >
                    <option value="" disabled>Select a role…</option>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                    ))}
                  </select>
                </div>
                {errors.role && <p className="text-xs text-rose-600">{errors.role[0]}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors duration-150 mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                ) : (
                  <>Create account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          By registering you agree to our{' '}
          <span className="text-zinc-600 cursor-pointer underline underline-offset-2">Terms of Service</span>
        </p>
      </div>
    </div>
  );
}
