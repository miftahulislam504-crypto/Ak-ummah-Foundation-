'use client';

import Link from 'next/link';
import { CreditCard, Heart, User, FileText } from 'lucide-react';

const ACTIONS = [
  { href: '/loans/apply',  label: 'ঋণ আবেদন',   icon: CreditCard, color: 'bg-blue-50   text-blue-700   border-blue-100'   },
  { href: '/donations/new',label: 'দান করুন',    icon: Heart,      color: 'bg-red-50    text-red-700    border-red-100'    },
  { href: '/profile',      label: 'প্রোফাইল',    icon: User,       color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { href: '/reports',      label: 'রিপোর্ট',     icon: FileText,   color: 'bg-amber-50  text-amber-700  border-amber-100'  },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 mb-3">দ্রুত কাজ করুন</h3>
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div className={`border rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${color}`}>
              <Icon size={22} strokeWidth={1.8} />
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
