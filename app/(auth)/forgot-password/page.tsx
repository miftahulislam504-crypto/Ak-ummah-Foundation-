'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error('ইমেইল দিন'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        toast.error('এই ইমেইলে কোনো অ্যাকাউন্ট নেই');
      } else {
        toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">

      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="AK Ummah Foundation"
              width={140}
              height={140}
              className="drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">

          {!sent ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Mail size={20} className="text-primary-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">পাসওয়ার্ড রিসেট</h2>
                  <p className="text-sm text-gray-500">ইমেইলে লিংক পাঠানো হবে</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ইমেইল ঠিকানা
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="input-field"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'রিসেট লিংক পাঠান'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">ইমেইল পাঠানো হয়েছে!</h2>
              <p className="text-gray-500 text-sm mb-2">
                <span className="font-medium text-gray-700">{email}</span> এ রিসেট লিংক পাঠানো হয়েছে।
              </p>
              <p className="text-gray-400 text-xs mb-6">
                ইমেইল না পেলে স্প্যাম ফোল্ডার চেক করুন।
              </p>
            </div>
          )}

          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-primary-700 hover:underline mt-4">
            <ArrowLeft size={16} />
            লগইন পেজে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
