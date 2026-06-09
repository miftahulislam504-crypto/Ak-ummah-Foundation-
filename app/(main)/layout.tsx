'use client';

import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/ui/LoadingScreen';
import PageTransition from '@/components/ui/PageTransition';
import BottomNav from '@/components/layout/BottomNav';
import TopBar from '@/components/layout/TopBar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(true);

  if (loading) return <LoadingScreen />;
  if (!user)   return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageTransition />
      <TopBar />
      <main className="flex-1 pb-24 pt-16 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
