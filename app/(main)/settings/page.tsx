'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import {
  User, Lock, Bell, HelpCircle,
  ChevronRight, LogOut, Shield,
  PiggyBank, Wallet, FileText,
  Users, Calendar, MessageSquare, Info
} from 'lucide-react';

const MENU_ITEMS = [
  {
    group: 'অ্যাকাউন্ট',
    items: [
      { href: '/profile',           icon: User,          label: 'প্রোফাইল দেখুন'       },
      { href: '/settings/password', icon: Lock,          label: 'পাসওয়ার্ড পরিবর্তন'  },
      { href: '/notifications',     icon: Bell,          label: 'নোটিফিকেশন'            },
    ],
  },
  {
    group: 'আর্থিক',
    items: [
      { href: '/savings',  icon: PiggyBank, label: 'আমার সঞ্চয়'          },
      { href: '/finance',  icon: Wallet,    label: 'আর্থিক সারসংক্ষেপ'   },
      { href: '/reports',  icon: FileText,  label: 'রিপোর্ট ও এক্সপোর্ট' },
    ],
  },
  {
    group: 'সংগঠন',
    items: [
      { href: '/about',      icon: Info,          label: 'আমাদের সম্পর্কে' },
      { href: '/team',       icon: Users,         label: 'আমাদের টিম'      },
      { href: '/activities', icon: Calendar,      label: 'কার্যক্রম'        },
      { href: '/contact',    icon: MessageSquare, label: 'যোগাযোগ করুন'    },
    ],
  },
  {
    group: 'অন্যান্য',
    items: [
      { href: '/settings/privacy', icon: Shield,     label: 'গোপনীয়তা নীতি'     },
      { href: '/settings/help',    icon: HelpCircle, label: 'সাহায্য'             },
    ],
  },
];

export default function SettingsPage() {
  const { user, logout } = useAuth(true);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">সেটিং</h1>
        <p className="text-sm text-gray-400 mt-0.5">অ্যাকাউন্ট ও অ্যাপ পরিচালনা করুন</p>
      </div>

      {/* User info mini */}
      <Link href="/profile">
        <div className="card flex items-center gap-3 active:scale-98">
          <div className="w-12 h-12 bg-primary-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'ম'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
      </Link>

      {/* Menu groups */}
      {MENU_ITEMS.map(({ group, items }) => (
        <div key={group}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">{group}</p>
          <div className="card p-0 overflow-hidden divide-y divide-gray-50">
            {items.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
      >
        <LogOut size={18} />
        লগআউট করুন
      </button>

      <p className="text-center text-xs text-gray-300 pb-2">
        এক উম্মাহ ফাউন্ডেশন — সংস্করণ ২.০
      </p>
    </div>
  );
}
