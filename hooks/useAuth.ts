'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

export function useAuth(requireAuth = true) {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.replace('/login');
    }
  }, [user, loading, requireAuth, router]);

  async function logout() {
    try {
      await signOut(auth);
      useAuthStore.getState().clearUser();
      router.replace('/login');
      toast.success('লগআউট সফল হয়েছে');
    } catch {
      toast.error('লগআউট করতে সমস্যা হয়েছে');
    }
  }

  return { user, loading, logout };
}
