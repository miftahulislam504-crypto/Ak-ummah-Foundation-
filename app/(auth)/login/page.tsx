'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('ইমেইল ও পাসওয়ার্ড দিন');
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));

      if (!snap.exists()) {
        toast.error('অ্যাকাউন্ট পাওয়া যায়নি');
        setLoading(false);
        return;
      }

      const userData = { uid: cred.user.uid, ...snap.data() } as any;

      if (userData.status === 'pending') {
        toast.warning('আপনার অ্যাকাউন্ট অনুমোদনের অপেক্ষায় আছে');
        await auth.signOut();
        setLoading(false);
        return;
      }

      if (userData.status === 'suspended') {
        toast.error('আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে');
        await auth.signOut();
        setLoading(false);
        return;
      }

      setUser(userData);
      toast.success('স্বাগতম! লগইন সফল হয়েছে');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = getFirebaseError(err.code);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function getFirebaseError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':    return 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই';
      case 'auth/wrong-password':    return 'পাসওয়ার্ড ভুল হয়েছে';
      case 'auth/invalid-email':     return 'ইমেইল ঠিকানা সঠিক নয়';
      case 'auth/too-many-requests': return 'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন';
      case 'auth/invalid-credential':return 'ইমেইল বা পাসওয়ার্ড ভুল হয়েছে';
      default:                       return 'লগইন করতে সমস্যা হয়েছে';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-400 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-500 rounded-2xl mb-4 shadow-2xl">
            <span className="text-3xl font-bold text-white font-arabic">ع</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">এক উম্মাহ ফাউন্ডেশন</h1>
          <p className="text-primary-300 text-sm">সুদমুক্ত সহায়তা, বিশ্বাসের বন্ধন</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">সদস্য লগইন</h2>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
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
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড দিন"
                  className="input-field pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-primary-700 hover:underline">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  লগইন করুন
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            অ্যাকাউন্ট নেই?{' '}
            <Link href="/register" className="text-primary-700 font-semibold hover:underline">
              নিবন্ধন করুন
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-400 text-xs mt-6">
          © ২০২৪ এক উম্মাহ ফাউন্ডেশন
        </p>
      </div>
    </div>
  );
}
