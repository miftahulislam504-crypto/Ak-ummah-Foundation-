'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, Heart, Moon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'হোম',     icon: Home      },
  { href: '/loans',         label: 'ঋণ',      icon: CreditCard },
  { href: '/donations',     label: 'দান',     icon: Heart      },
  { href: '/islamic',       label: 'ইসলাম',   icon: Moon       },
  { href: '/reports',      label: 'রিপোর্ট',  icon: FileText   },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200',
                active ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all',
                active && 'bg-primary-50'
              )}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={cn(
                'text-xs font-medium',
                active ? 'text-primary-700 font-semibold' : 'text-gray-400'
              )}>
                {label}
              </span>
              {active && (
                <div className="w-1 h-1 bg-primary-600 rounded-full mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
