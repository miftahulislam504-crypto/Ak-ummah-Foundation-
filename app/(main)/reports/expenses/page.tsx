'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense } from '@/lib/types';
import { formatTaka } from '@/lib/utils';
import { ArrowLeft, ArrowDownCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExpensesListPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'expenses'), orderBy('createdAt', 'desc')))
      .then(snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))))
      .finally(() => setLoading(false));
  }, []);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ব্যয়ের তালিকা</h1>
          <p className="text-xs text-gray-400">সকল ব্যয়ের বিবরণ</p>
        </div>
      </div>

      <div className="card bg-red-50 flex items-center gap-4 py-4">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
          <ArrowDownCircle size={22} className="text-red-600" />
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">{formatTaka(total)}</p>
          <p className="text-xs text-gray-500">মোট ব্যয় · {expenses.length}টি এন্ট্রি</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">কোনো ব্যয় পাওয়া যায়নি</div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {expenses.map(e => (
            <div key={e.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{e.title}</p>
                <p className="text-xs text-gray-400">{e.category} · {new Date(e.createdAt).toLocaleDateString('bn-BD')}</p>
              </div>
              <p className="text-sm font-bold text-red-600">{formatTaka(e.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
