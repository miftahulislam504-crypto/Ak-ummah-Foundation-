'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPanel from './NotificationPanel';
import { toBn } from '@/lib/utils';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount }  = useNotifications();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-primary-700 hover:bg-primary-600 transition-colors"
        aria-label="নোটিফিকেশন"
      >
        <Bell size={20} className="text-white" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow">
            {unreadCount > 99 ? '৯৯+' : toBn(unreadCount)}
          </span>
        )}
      </button>

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
