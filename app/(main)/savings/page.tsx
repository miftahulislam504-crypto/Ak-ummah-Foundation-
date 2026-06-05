'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Saving } from '@/lib/types';
import { formatTaka, getRelativeTime, toBn } from '@/lib/utils';
import { PiggyBank, TrendingUp } from 'lucide-react';

export default function SavingsPage() {
  const { user }    = useAuthStore();
  const [savings,   setSavings]  = useState<Saving[]>([]);
  const [loading,   setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'savings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Saving)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const totalSavings = savings.reduce((s, item) => s + item.amount, 0);
  const thisMonth    = savings.filter(s => {
    const d = new Date(s.createdAt);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).reduce((s, item) => s + item.amount, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">আমার সঞ্চয়</h1>
        <p className="text-sm text-gray-400 mt-0.5">অ্যাডমিন কর্তৃক পরিচালিত</p>
      </div>

      {/* Balance card */}
      <div className="card-green">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm">মোট সঞ্চয়</p>
            <p className="text-white text-3xl font-bold mt-1">{formatTaka(totalSavings)}</p>
            <p className="text-primary-300 text-sm mt-2 flex items-center gap-1">
              <TrendingUp size={14} />
              এই মাসে: {formatTaka(thisMonth)}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <PiggyBank size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-sm text-amber-800">
          💡 সঞ্চয় যোগ বা উত্তোলনের জন্য ফাউন্ডেশনের অ্যাডমিনের সাথে যোগাযোগ করুন।
        </p>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : savings.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <PiggyBank size={28} className="text-primary-300" />
          </div>
          <p className="text-gray-400">এখনো কোনো সঞ্চয় নেই</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h3 className="font-semibold text-gray-800">লেনদেনের ইতিহাস ({toBn(savings.length)}টি)</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {savings.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                  <PiggyBank size={16} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.note || 'সঞ্চয় জমা'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{getRelativeTime(s.createdAt)}</p>
                </div>
                <p className="text-sm font-bold text-primary-700 shrink-0">+{formatTaka(s.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
