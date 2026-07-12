'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL, getApiErrorData } from '@/lib/api';
import { Mail, ArrowRight, Loader2, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/password-reset/`, { email });
      setSubmitted(true);
    } catch (err) {
      const data = getApiErrorData(err);
      setError(data?.detail || data?.email?.[0] || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f580_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f580_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Back */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to login
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 mb-4">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Enter your registered email and we&apos;ll send you a reset token.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-16 px-8 gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 text-lg">Check your console</p>
                <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed max-w-xs">
                  A password reset token has been printed in your backend console log. Copy it and proceed below.
                </p>
              </div>
              <button
                onClick={() => router.push('/password-reset-confirm')}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors"
              >
                Enter reset token <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-7 space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="john@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors duration-150"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <>Send reset token <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
