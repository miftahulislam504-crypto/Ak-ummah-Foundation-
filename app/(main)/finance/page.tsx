'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, orderBy,
  onSnapshot, limit, where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Saving, Expense } from '@/lib/types';
import { formatTaka, toBn, getRelativeTime } from '@/lib/utils';
import {
  PiggyBank, TrendingDown, TrendingUp,
  Wallet, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const EXPENSE_CATEGORIES = [
  'পরিচালনা', 'কার্যক্রম', 'বেতন',
  'যোগাযোগ',  'অন্যান্য',
];

const categoryColor: Record<string, string> = {
  পরিচালনা: 'bg-blue-100  text-blue-600',
  কার্যক্রম: 'bg-purple-100 text-purple-600',
  বেতন:      'bg-orange-100 text-orange-600',
  যোগাযোগ:  'bg-teal-100  text-teal-600',
  অন্যান্য: 'bg-gray-100  text-gray-600',
};

export default function FinancePage() {
  const { user }   = useAuthStore();
  const [savings,  setSavings]  = useState<Saving[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mySavings, setMySavings] = useState<Saving[]>([]);
  const [loading,  setLoading]  = useState(true);

  // All savings (for foundation totals — admin adds these)
  useEffect(() => {
    const q = query(collection(db, 'savings'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Saving)));
    });
    return () => unsub();
  }, []);

  // My savings
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'savings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMySavings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Saving)));
    });
    return () => unsub();
  }, [user]);

  // Recent expenses (public view)
  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalSavings  = savings.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
  const myTotalSaving = mySavings.reduce((s, i) => s + i.amount, 0);
  const balance       = totalSavings - totalExpenses;

  // Group expenses by category
  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">আর্থিক সারসংক্ষেপ</h1>
        <p className="text-sm text-gray-400 mt-0.5">ফাউন্ডেশনের আর্থিক অবস্থা</p>
      </div>

      {/* My savings shortcut */}
      <Link href="/savings">
        <div className="card-green flex items-center justify-between active:scale-98">
          <div>
            <p className="text-primary-200 text-sm">আমার সঞ্চয়</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatTaka(myTotalSaving)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <PiggyBank size={20} className="text-white" />
            </div>
            <ChevronRight size={18} className="text-primary-300" />
          </div>
        </div>
      </Link>

      {/* Foundation summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <TrendingUp size={18} className="text-green-600 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-green-700">{formatTaka(totalSavings)}</p>
          <p className="text-xs text-gray-400 mt-0.5">মোট সঞ্চয়</p>
        </div>
        <div className="card text-center py-4">
          <TrendingDown size={18} className="text-red-500 mx-auto mb-1.5" />
          <p className="text-lg font-bold text-red-600">{formatTaka(totalExpenses)}</p>
          <p className="text-xs text-gray-400 mt-0.5">মোট ব্যয়</p>
        </div>
        <div className="card text-center py-4">
          <Wallet size={18} className={`mx-auto mb-1.5 ${balance >= 0 ? 'text-primary-600' : 'text-red-500'}`} />
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-primary-700' : 'text-red-600'}`}>
            {formatTaka(Math.abs(balance))}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">ব্যালেন্স</p>
        </div>
      </div>

      {/* Expense by category */}
      {Object.keys(expenseByCategory).length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">বিভাগ অনুযায়ী ব্যয়</h3>
          <div className="space-y-3">
            {Object.entries(expenseByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => {
                const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[cat] || 'bg-gray-100 text-gray-600'}`}>
                          {cat}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-800">{formatTaka(amount)}</span>
                        <span className="text-xs text-gray-400 ml-1">({toBn(pct)}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400 text-sm">কোনো ব্যয়ের তথ্য নেই</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">সাম্প্রতিক ব্যয়</h3>
            <span className="text-xs text-gray-400">{toBn(expenses.length)}টি</span>
          </div>
          <div className="divide-y divide-gray-50">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${categoryColor[e.category] || 'bg-gray-100 text-gray-600'}`}>
                  {e.category.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${categoryColor[e.category] || 'bg-gray-100 text-gray-600'}`}>
                      {e.category}
                    </span>
                    <span className="text-xs text-gray-400">{getRelativeTime(e.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-red-600 shrink-0">-{formatTaka(e.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
