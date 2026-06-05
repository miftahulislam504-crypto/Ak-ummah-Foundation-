'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/lib/types';
import { getRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  info:    { icon: Info,          cls: 'bg-blue-100  text-blue-600'  },
  success: { icon: CheckCircle,   cls: 'bg-green-100 text-green-600' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-100 text-amber-600' },
  error:   { icon: XCircle,       cls: 'bg-red-100   text-red-600'   },
};

export default function NotificationsPage() {
  const { user }  = useAuthStore();
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function markRead(id: string) {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  }

  async function markAllRead() {
    const batch = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  }

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">নোটিফিকেশন</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{unreadCount}টি অপঠিত</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-primary-700 font-medium bg-primary-50 px-3 py-1.5 rounded-full">
            <CheckCheck size={14} />
            সব পড়া হয়েছে
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400">কোনো নোটিফিকেশন নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => {
            const { icon: Icon, cls } = iconMap[n.type] || iconMap.info;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={cn(
                  'card flex gap-3 cursor-pointer transition-all active:scale-98',
                  !n.read && 'border-l-4 border-l-primary-500 bg-primary-50/30'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cls)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium text-gray-800', !n.read && 'font-semibold')}>
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
  );
}
