'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Donation } from '@/lib/types';
import { formatTaka } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ArrowLeft, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  rejected:  'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'নিশ্চিত', pending: 'অপেক্ষারত', rejected: 'বাতিল',
};

export default function DonationsListPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, 'donations'), orderBy('createdAt', 'desc')))
      .then(snap => setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation))))
      .finally(() => setLoading(false));
  }, []);

  const total = donations.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">দানের তালিকা</h1>
          <p className="text-xs text-gray-400">সকল দানের বিবরণ</p>
        </div>
      </div>

      {/* Summary */}
      <div className="card bg-green-50 flex items-center gap-4 py-4">
        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
          <Heart size={22} className="text-green-700" />
        </div>
        <div>
          <p className="text-2xl font-bold text-green-700">{formatTaka(total)}</p>
          <p className="text-xs text-gray-500">মোট নিশ্চিত দান · {donations.length}টি এন্ট্রি</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">কোনো দান পাওয়া যায়নি</div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {donations.map(d => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{d.userName}</p>
                <p className="text-xs text-gray-400">{d.type} · {new Date(d.createdAt).toLocaleDateString('bn-BD')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{formatTaka(d.amount)}</p>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_STYLE[d.status])}>
                  {STATUS_LABEL[d.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
