'use client';

import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-primary-800 shadow-md">
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center shadow">
            <span className="text-base font-bold text-white font-arabic">ع</span>
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm">এক উম্মাহ ফাউন্ডেশন</p>
            <p className="text-primary-300 text-xs">সুদমুক্ত সহায়তা</p>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-primary-700 hover:bg-primary-600 transition-colors"
          >
            <Bell size={20} className="text-white" />
            {/* Badge — will be dynamic later */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-400 rounded-full" />
          </Link>

          <Link href="/profile">
            <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center shadow">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'ম'}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
