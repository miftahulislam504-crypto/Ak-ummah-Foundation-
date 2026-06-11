'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Saving, SavingRequest } from '@/lib/types';
import { formatTaka, getRelativeTime, toBn } from '@/lib/utils';
import { Wallet, TrendingUp, Plus, Clock, Check, X } from 'lucide-react';
import Link from 'next/link';

const statusConfig = {
  pending:  { label: 'অপেক্ষায়',  cls: 'bg-amber-100 text-amber-700',  icon: Clock  },
  approved: { label: 'অনুমোদিত',   cls: 'bg-green-100 text-green-700',  icon: Check  },
  rejected: { label: 'বাতিল',       cls: 'bg-red-100   text-red-700',    icon: X      },
};

export default function SavingsPage() {
  const { user }     = useAuthStore();
  const [savings,    setSavings]    = useState<Saving[]>([]);
  const [requests,   setRequests]   = useState<SavingRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState<'history' | 'requests'>('history');

  useEffect(() => {
    if (!user) return;

    // অনুমোদিত সঞ্চয় ইতিহাস
    const q1 = query(collection(db, 'savings'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub1 = onSnapshot(q1, (snap) => {
      setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Saving)));
      setLoading(false);
    });

    // সঞ্চয় আবেদনসমূহ
    const q2 = query(collection(db, 'saving_requests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub2 = onSnapshot(q2, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingRequest)));
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const totalSavings = savings.reduce((s, item) => s + item.amount, 0);
  const thisMonth    = savings.filter(s => {
    const d = new Date(s.createdAt), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).reduce((s, item) => s + item.amount, 0);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">আমার সঞ্চয়</h1>
          <p className="text-sm text-gray-400 mt-0.5">সুদমুক্ত সঞ্চয়</p>
        </div>
        <Link href="/savings/apply">
          <button className="flex items-center gap-1.5 bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-xl">
            <Plus size={16} /> নতুন আবেদন
          </button>
        </Link>
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
            <Wallet size={24} className="text-white" />
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/80 text-xs">{toBn(pendingCount)}টি আবেদন যাচাইয়ের অপেক্ষায়</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {[
          { key: 'history',  label: 'সঞ্চয় ইতিহাস' },
          { key: 'requests', label: `আবেদনসমূহ${pendingCount > 0 ? ` (${toBn(pendingCount)})` : ''}` },
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Savings history tab */}
      {activeTab === 'history' && (
        loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse" />)}
          </div>
        ) : savings.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wallet size={28} className="text-primary-300" />
            </div>
            <p className="text-gray-400 mb-4">এখনো কোনো সঞ্চয় নেই</p>
            <Link href="/savings/apply">
              <button className="btn-primary text-sm px-6">প্রথম আবেদন করুন</button>
            </Link>
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
                    <Wallet size={16} className="text-primary-600" />
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
        )
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        requests.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-gray-400">কোনো আবেদন নেই</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const cfg = statusConfig[r.status];
              const Icon = cfg.icon;
              return (
                <div key={r.id} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-gray-900">{formatTaka(r.amount)}</p>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <span className="text-gray-400">মাধ্যম: </span>
                      <span className="font-medium text-gray-700 capitalize">{r.method}</span>
                    </div>
                    {r.transactionId && r.transactionId !== 'সরাসরি জমা' && (
                      <div>
                        <span className="text-gray-400">ট্রানজেকশন: </span>
                        <span className="font-medium text-gray-700">{r.transactionId}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{getRelativeTime(r.createdAt)}</p>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
