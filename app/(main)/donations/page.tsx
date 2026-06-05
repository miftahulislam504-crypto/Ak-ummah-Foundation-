'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Donation } from '@/lib/types';
import { formatTaka, getRelativeTime } from '@/lib/utils';
import { Heart, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { key: 'all',       label: 'সব'         },
  { key: 'pending',   label: 'অপেক্ষারত' },
  { key: 'confirmed', label: 'নিশ্চিত'   },
  { key: 'rejected',  label: 'বাতিল'     },
];

const statusStyle: Record<string, string> = {
  pending:   'badge-pending',
  confirmed: 'badge-active',
  rejected:  'badge-rejected',
};

const statusLabel: Record<string, string> = {
  pending:   'অপেক্ষারত',
  confirmed: 'নিশ্চিত',
  rejected:  'বাতিল',
};

const methodLabel: Record<string, string> = {
  bkash:      'বিকাশ',
  nagad:      'নগদ',
  rocket:     'রকেট',
  dbbl:       'ডাচ-বাংলা',
  sslcommerz: 'অনলাইন',
  direct:     'সরাসরি',
};

export default function DonationsPage() {
  const { user }  = useAuthStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'donations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered = filter === 'all' ? donations : donations.filter(d => d.status === filter);
  const totalConfirmed = donations.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">দানের ইতিহাস</h1>
          <p className="text-sm text-gray-400 mt-0.5">মোট নিশ্চিত: {formatTaka(totalConfirmed)}</p>
        </div>
        <Link href="/donations/new">
          <button className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm">
            <Plus size={16} /> নতুন দান
          </button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              filter === key
                ? 'bg-primary-700 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="w-16 h-5 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Heart size={28} className="text-red-300" />
          </div>
          <p className="text-gray-400 font-medium">কোনো দান নেই</p>
          <p className="text-gray-300 text-sm mt-1">নতুন দান করতে উপরের বাটন চাপুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <div key={d.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <Heart size={18} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">{d.type}</p>
                    <p className="text-base font-bold text-primary-700">{formatTaka(d.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusStyle[d.status])}>
                      {statusLabel[d.status]}
                    </span>
                    <span className="text-xs text-gray-400">{methodLabel[d.method] || d.method}</span>
                    {d.transactionId && (
                      <span className="text-xs text-gray-300 font-mono">#{d.transactionId.slice(-6)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{getRelativeTime(d.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
