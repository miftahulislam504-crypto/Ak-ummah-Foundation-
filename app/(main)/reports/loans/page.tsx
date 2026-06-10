'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loan } from '@/lib/types';
import { formatTaka } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATUS_STYLE: Record<string, string> = {
  approved:  'bg-green-100 text-green-700',
  repaid:    'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  rejected:  'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  approved: 'অনুমোদিত', repaid: 'পরিশোধিত', pending: 'অপেক্ষারত', rejected: 'বাতিল',
};

export default function LoansListPage() {
  const router = useRouter();
  const [loans,   setLoans]   = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'loans'), orderBy('createdAt', 'desc')))
      .then(snap => setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Loan))))
      .finally(() => setLoading(false));
  }, []);

  const totalApproved = loans.filter(l => l.status === 'approved').reduce((s, l) => s + l.amount, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ঋণের তালিকা</h1>
          <p className="text-xs text-gray-400">সকল ঋণ আবেদনের বিবরণ</p>
        </div>
      </div>

      <div className="card bg-blue-50 flex items-center gap-4 py-4">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
          <CreditCard size={22} className="text-blue-700" />
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-700">{formatTaka(totalApproved)}</p>
          <p className="text-xs text-gray-500">অনুমোদিত ঋণ · মোট {loans.length}টি আবেদন</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : loans.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">কোনো ঋণ আবেদন পাওয়া যায়নি</div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {loans.map(l => (
            <div key={l.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{l.userName}</p>
                <p className="text-xs text-gray-400">{l.purpose} · {new Date(l.createdAt).toLocaleDateString('bn-BD')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{formatTaka(l.amount)}</p>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLE[l.status])}>
                  {STATUS_LABEL[l.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
