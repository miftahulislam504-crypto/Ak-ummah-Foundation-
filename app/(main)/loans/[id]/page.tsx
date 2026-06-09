'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loan } from '@/lib/types';
import { formatTaka, getBanglaDate } from '@/lib/utils';
import { ArrowLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { use } from 'react';

const statusStyle: Record<string, string> = {
  pending:  'badge-pending',
  approved: 'badge-active',
  rejected: 'badge-rejected',
  repaid:   'badge-active',
};

const statusLabel: Record<string, string> = {
  pending:  'অনুমোদনের অপেক্ষায়',
  approved: 'অনুমোদিত হয়েছে',
  rejected: 'বাতিল হয়েছে',
  repaid:   'পরিশোধ হয়েছে',
};

const purposeIcon: Record<string, string> = {
  চিকিৎসা: '🏥', ব্যবসা: '🏪', শিক্ষা: '📚',
  কৃষি: '🌾',   জরুরি প্রয়োজন: '🚨', অন্যান্য: '📋',
};

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const [loan,    setLoan]    = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'loans', id)).then((snap) => {
      if (snap.exists()) setLoan({ id: snap.id, ...snap.data() } as Loan);
      setLoading(false);
    });
  }, [id]);

  function handlePrint() {
    if (!loan) return;
    const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ঋণ আবেদন — ${loan.id}</title>
        <style>
          body { font-family: 'Noto Sans Bengali', sans-serif; padding: 32px; color: #111; }
          h1   { color: #166534; font-size: 22px; margin-bottom: 4px; }
          h2   { font-size: 14px; color: #555; margin-bottom: 24px; }
          .row { display: flex; border-bottom: 1px solid #eee; padding: 8px 0; }
          .lbl { width: 180px; color: #666; font-size: 13px; }
          .val { font-weight: 600; font-size: 13px; }
          .section { margin-top: 20px; font-weight: bold; color: #166534; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>এক উম্মাহ ফাউন্ডেশন</h1>
        <h2>ঋণ আবেদন পত্র</h2>
        <div class="row"><span class="lbl">আবেদনকারী</span><span class="val">${loan.userName}</span></div>
        <div class="row"><span class="lbl">মোবাইল</span><span class="val">${loan.userPhone}</span></div>
        <div class="row"><span class="lbl">ঠিকানা</span><span class="val">${loan.userAddress}</span></div>
        <div class="row"><span class="lbl">পেশা</span><span class="val">${loan.userProfession}</span></div>
        <div class="row"><span class="lbl">মাসিক আয়</span><span class="val">৳${loan.userIncome}</span></div>
        <div class="row"><span class="lbl">ঋণের পরিমাণ</span><span class="val">৳${loan.amount}</span></div>
        <div class="row"><span class="lbl">উদ্দেশ্য</span><span class="val">${loan.purpose}</span></div>
        <div class="row"><span class="lbl">পরিশোধ পরিকল্পনা</span><span class="val">${loan.repaymentPlan}</span></div>
        <div class="row"><span class="lbl">অবস্থা</span><span class="val">${statusLabel[loan.status]}</span></div>
        <div class="row"><span class="lbl">আবেদনের তারিখ</span><span class="val">${getBanglaDate(new Date(loan.createdAt))}</span></div>
        <div class="section">জামিনদারগণ</div>
        ${loan.guarantors.map((g, i) => `
          <div style="margin-bottom:12px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            <p><strong>${i + 1}ম জামিনদার:</strong> ${g.name} (${g.relation})</p>
            <p>মোবাইল: ${g.phone} | ঠিকানা: ${g.address}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-16" />)}
    </div>
  );

  if (!loan) return (
    <div className="text-center py-20">
      <p className="text-gray-400">ঋণ আবেদন পাওয়া যায়নি</p>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">ঋণের বিবরণ</h1>
        </div>
        <button onClick={handlePrint} className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-700">
          <Printer size={18} />
        </button>
      </div>

      {/* Status + Amount card */}
      <div className="card-green">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-200 text-sm">ঋণের পরিমাণ</p>
            <p className="text-white text-3xl font-bold mt-1">{formatTaka(loan.amount)}</p>
            <p className="text-primary-300 text-sm mt-1">{loan.purpose} {purposeIcon[loan.purpose]}</p>
          </div>
          <span className={cn('text-xs px-3 py-1.5 rounded-full font-medium', statusStyle[loan.status])}>
            {statusLabel[loan.status]}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">আবেদনকারীর তথ্য</h3>
        {[
          { label: 'নাম',             value: loan.userName       },
          { label: 'মোবাইল',          value: loan.userPhone      },
          { label: 'ঠিকানা',          value: loan.userAddress    },
          { label: 'পেশা',            value: loan.userProfession },
          { label: 'মাসিক আয়',       value: formatTaka(loan.userIncome) },
          { label: 'পরিশোধ পরিকল্পনা',value: loan.repaymentPlan  },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-800 text-right max-w-[58%]">{value}</span>
          </div>
        ))}
      </div>

      {/* Guarantors */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">জামিনদারগণ</h3>
        <div className="space-y-3">
          {loan.guarantors.map((g, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-800">{i + 1}. {g.name}</p>
              <p className="text-xs text-gray-500 mt-1">সম্পর্ক: {g.relation}</p>
              <p className="text-xs text-gray-500">মোবাইল: {g.phone}</p>
              <p className="text-xs text-gray-500">ঠিকানা: {g.address}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="card">
        <div className="flex justify-between py-2">
          <span className="text-sm text-gray-500">আবেদনের তারিখ</span>
          <span className="text-sm font-medium">{getBanglaDate(new Date(loan.createdAt))}</span>
        </div>
        {loan.approvedAt && (
          <div className="flex justify-between py-2 border-t border-gray-50">
            <span className="text-sm text-gray-500">অনুমোদনের তারিখ</span>
            <span className="text-sm font-medium">{getBanglaDate(new Date(loan.approvedAt))}</span>
          </div>
        )}
        {loan.note && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-500 mb-1">অতিরিক্ত তথ্য</p>
            <p className="text-sm text-gray-700">{loan.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
