'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Menu, X, Home, Activity, Phone, PlayCircle, Settings, Download, LogOut } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

const MENU_ITEMS = [
  { href: '/dashboard',    label: 'হোম',               icon: Home        },
  { href: '/activity',     label: 'কার্যক্রমসমূহ',     icon: Activity    },
  { href: '/contact',      label: 'যোগাযোগ',           icon: Phone       },
  { href: '/about',        label: 'আপনাদের সহযোগিতায়', icon: PlayCircle  },
  { href: '/settings',     label: 'সেটিং',             icon: Settings    },
];

export default function TopBar() {
  const { user, clearUser } = useAuthStore();
  const router  = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await signOut(auth);
    clearUser();
    router.push('/login');
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-primary-800 shadow-md">
        <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow">
              <Image
                src="/logo.png"
                alt="এক উম্মাহ"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <p className="text-white font-bold text-sm">এক উম্মাহ ফাউন্ডেশন</p>
              <p className="text-primary-300 text-xs">সুদমুক্ত সহায়তা</p>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Profile avatar */}
            <Link href="/profile">
              <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center shadow">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'ম'}
                </span>
              </div>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center shadow"
            >
              <Menu size={20} className="text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-primary-800 px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md">
              <Image
                src="/logo.png"
                alt="এক উম্মাহ"
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white font-bold text-base">এক উম্মাহ</p>
              <p className="text-primary-300 text-xs">ফাউন্ডেশন</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {MENU_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 px-5 py-3.5 text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
              <Icon size={20} className="text-primary-600 flex-shrink-0" />
              <span className="font-medium text-base">{label}</span>
            </Link>
          ))}

          {/* Install PWA */}
          <div className="mx-4 mt-2 rounded-2xl bg-amber-50 border border-amber-100">
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 px-4 py-3.5 w-full text-amber-700"
            >
              <Download size={20} className="text-amber-600 flex-shrink-0" />
              <span className="font-semibold text-base">এপস ইন্সটল</span>
            </button>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-semibold"
          >
            <LogOut size={18} />
            লগআউট
          </button>
        </div>
      </div>
    </>
  );
}
