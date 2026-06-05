'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notice } from '@/lib/types';
import { getBanglaDate, getRelativeTime } from '@/lib/utils';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      <div>
        <h1 className="text-xl font-bold text-gray-900">নোটিশ বোর্ড</h1>
        <p className="text-sm text-gray-400 mt-0.5">ফাউন্ডেশনের সব নোটিশ</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell size={28} className="text-amber-300" />
          </div>
          <p className="text-gray-400">কোনো নোটিশ নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="card overflow-hidden">
              <button
                onClick={() => setOpen(open === n.id ? null : n.id)}
                className="w-full flex items-start justify-between gap-3 text-left"
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{getRelativeTime(n.createdAt)}</p>
                  </div>
                </div>
                {open === n.id
                  ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-1" />
                  : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-1" />
                }
              </button>

              {open === n.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    প্রকাশিত: {getBanglaDate(new Date(n.createdAt))}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
