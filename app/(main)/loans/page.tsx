'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Loan } from '@/lib/types';
import { formatTaka, getRelativeTime } from '@/lib/utils';
import { CreditCard, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { key: 'all',      label: 'সব'         },
  { key: 'pending',  label: 'অপেক্ষারত' },
  { key: 'approved', label: 'অনুমোদিত'  },
  { key: 'rejected', label: 'বাতিল'     },
  { key: 'repaid',   label: 'পরিশোধিত'  },
];

const statusStyle: Record<string, string> = {
  pending:  'badge-pending',
  approved: 'badge-active',
  rejected: 'badge-rejected',
  repaid:   'badge-active',
};

const statusLabel: Record<string, string> = {
  pending:  'অপেক্ষারত',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
  repaid:   'পরিশোধিত',
};

const purposeIcon: Record<string, string> = {
  চিকিৎসা: '🏥', ব্যবসা: '🏪', শিক্ষা: '📚',
  কৃষি: '🌾',   'জরুরি প্রয়োজন': '🚨', অন্যান্য: '📋',
};

export default function LoansPage() {
  const { user }   = useAuthStore();
  const [loans,    setLoans]   = useState<Loan[]>([]);
  const [filter,   setFilter]  = useState('all');
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'loans'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filtered      = filter === 'all' ? loans : loans.filter(l => l.status === filter);
  const activeAmount  = loans.filter(l => l.status === 'approved').reduce((s, l) => s + l.amount, 0);
  const hasActiveLoan = loans.some(l => l.status === 'approved');
  const hasPending    = loans.some(l => l.status === 'pending');

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ঋণের ইতিহাস</h1>
          {activeAmount > 0 && (
            <p className="text-sm text-blue-600 font-medium mt-0.5">সক্রিয়: {formatTaka(activeAmount)}</p>
          )}
        </div>
        {!hasActiveLoan && !hasPending && (
          <Link href="/loans/apply">
            <button className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm">
              <Plus size={16} /> ঋণ আবেদন
            </button>
          </Link>
        )}
      </div>

      {/* Active loan warning */}
      {(hasActiveLoan || hasPending) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-800">
            {hasActiveLoan
              ? '⚠️ আপনার একটি সক্রিয় ঋণ আছে। পরিশোধের আগে নতুন আবেদন করা যাবে না।'
              : '⏳ আপনার একটি ঋণ আবেদন অনুমোদনের অপেক্ষায় আছে।'}
          </p>
        </div>
      )}

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
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CreditCard size={28} className="text-blue-300" />
          </div>
          <p className="text-gray-400 font-medium">কোনো ঋণ আবেদন নেই</p>
          {!hasActiveLoan && !hasPending && (
            <Link href="/loans/apply">
              <button className="mt-4 btn-primary text-sm px-6 py-2.5">আবেদন করুন</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <Link key={l.id} href={`/loans/${l.id}`}>
              <div className="card hover:shadow-md transition-shadow active:scale-98">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-xl">
                    {purposeIcon[l.purpose] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{l.purpose}</p>
                      <p className="text-base font-bold text-blue-700">{formatTaka(l.amount)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusStyle[l.status])}>
                        {statusLabel[l.status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{getRelativeTime(l.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
