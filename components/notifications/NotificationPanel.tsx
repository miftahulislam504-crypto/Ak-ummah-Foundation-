'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { getRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { X, CheckCheck, Bell, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const iconMap = {
  info:    { icon: Info,          cls: 'bg-blue-100  text-blue-600'  },
  success: { icon: CheckCircle,   cls: 'bg-green-100 text-green-600' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-100 text-amber-600' },
  error:   { icon: XCircle,       cls: 'bg-red-100   text-red-600'   },
};

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: Props) {
  const { notifs, unreadCount, loading, markRead, markAllRead } = useNotifications();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={cn(
        'fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-primary-800">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-white" />
            <h2 className="font-bold text-white">নোটিফিকেশন</h2>
            {unreadCount > 0 && (
              <span className="bg-gold-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary-200 hover:text-white transition-colors"
              >
                <CheckCheck size={14} />
                সব পড়া হয়েছে
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-primary-700 hover:bg-primary-600 rounded-xl flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Bell size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm">কোনো নোটিফিকেশন নেই</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifs.map((n) => {
                const { icon: Icon, cls } = iconMap[n.type] || iconMap.info;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={cn(
                      'flex gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50',
                      !n.read && 'bg-primary-50/40 border-l-4 border-l-primary-500'
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cls)}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm text-gray-800',
                        !n.read ? 'font-semibold' : 'font-medium'
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{getRelativeTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
