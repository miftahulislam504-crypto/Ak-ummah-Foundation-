'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Donation, Loan, Saving, Expense } from '@/lib/types';
import { formatTaka, getBanglaDate, toBn } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { FileText, Printer, Filter, Wallet, PiggyBank, ArrowDownCircle, Users, CreditCard, Heart, ArrowRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type RangeKey = 'this_month' | 'last_month' | 'this_year' | 'all';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'this_month', label: 'এই মাস' },
  { key: 'last_month', label: 'গত মাস' },
  { key: 'this_year',  label: 'এই বছর' },
  { key: 'all',        label: 'সব'      },
];

function getDateRange(range: RangeKey): { from: Date; to: Date } {
  const now = new Date(); const year = now.getFullYear(); const month = now.getMonth();
  switch (range) {
    case 'this_month': return { from: new Date(year, month, 1),     to: new Date(year, month + 1, 0, 23, 59, 59) };
    case 'last_month': return { from: new Date(year, month - 1, 1), to: new Date(year, month, 0, 23, 59, 59)     };
    case 'this_year':  return { from: new Date(year, 0, 1),         to: new Date(year, 11, 31, 23, 59, 59)       };
    default:           return { from: new Date(2020, 0, 1),         to: new Date(2099, 11, 31)                    };
  }
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  approved:  'bg-green-100 text-green-700',
  repaid:    'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  rejected:  'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'নিশ্চিত', approved: 'অনুমোদিত', repaid: 'পরিশোধিত',
  pending: 'অপেক্ষারত', rejected: 'বাতিল',
};

export default function ReportsPage() {
  const [range,     setRange]     = useState<RangeKey>('this_month');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loans,     setLoans]     = useState<Loan[]>([]);
  const [savings,   setSavings]   = useState<Saving[]>([]);
  const [expenses,  setExpenses]  = useState<Expense[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [members,   setMembers]   = useState(0);

  // মোট সদস্য realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'public_stats'), (snap) => {
      if (!snap.empty) setMembers(snap.docs[0].data().totalMembers || 0);
    });
    return () => unsub();
  }, []);

  // সব ডেটা date range অনুযায়ী
  useEffect(() => {
    setLoading(true);
    const { from, to } = getDateRange(range);
    const fromISO = from.toISOString();
    const toISO   = to.toISOString();

    Promise.all([
      getDocs(query(collection(db, 'donations'), where('createdAt', '>=', fromISO), where('createdAt', '<=', toISO), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'loans'),     where('createdAt', '>=', fromISO), where('createdAt', '<=', toISO), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'savings'),   where('createdAt', '>=', fromISO), where('createdAt', '<=', toISO), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'expenses'),  where('createdAt', '>=', fromISO), where('createdAt', '<=', toISO), orderBy('createdAt', 'desc'))),
    ])
      .then(([donSnap, loanSnap, savSnap, expSnap]) => {
        setDonations(donSnap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
        setLoans(loanSnap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
        setSavings(savSnap.docs.map(d => ({ id: d.id, ...d.data() } as Saving)));
        setExpenses(expSnap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
      })
      .catch(() => toast.error('ডেটা লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  }, [range]);

  // ── হিসাব ──
  const confirmedDons    = donations.filter(d => d.status === 'confirmed');
  const totalDonated     = confirmedDons.reduce((s, d) => s + d.amount, 0);
  const repaidLoans      = loans.filter(l => l.status === 'repaid');
  const totalRepaid      = repaidLoans.reduce((s, l) => s + l.amount, 0);
  const totalSavings     = savings.reduce((s, sv) => s + sv.amount, 0);
  const approvedLoans    = loans.filter(l => l.status === 'approved');
  const totalApproved    = approvedLoans.reduce((s, l) => s + l.amount, 0);
  const totalExpenses    = expenses.reduce((s, e) => s + e.amount, 0);

  // মোট তহবিল = (নিশ্চিত দান + পরিশোধিত ঋণ + সঞ্চয়) − (অনুমোদিত ঋণ + ব্যয়)
  const totalFund = (totalDonated + totalRepaid + totalSavings) - (totalApproved + totalExpenses);

  // ── প্রিন্ট ──
  function handlePrint() {
    const rangeLabel = RANGES.find(r => r.key === range)?.label || '';
    const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">
      <title>ফাউন্ডেশন রিপোর্ট</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Sans Bengali',sans-serif;padding:32px;color:#111;font-size:13px}
      h1{color:#166534;font-size:22px;margin-bottom:4px}.sub{color:#555;font-size:12px;margin-bottom:20px}
      .summary{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px}
      .stat{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px}
      .stat.blue{background:#eff6ff;border-color:#bfdbfe}.stat.gold{background:#fefce8;border-color:#fde68a}
      .stat.red{background:#fef2f2;border-color:#fecaca}.stat.purple{background:#faf5ff;border-color:#e9d5ff}
      .stat-val{font-size:18px;font-weight:700;color:#166534}.stat.blue .stat-val{color:#1d4ed8}
      .stat.gold .stat-val{color:#92400e}.stat.red .stat-val{color:#991b1b}.stat.purple .stat-val{color:#6b21a8}
      .stat-lbl{font-size:11px;color:#666;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#166534;color:white;padding:8px 10px;text-align:left;font-size:12px}
      td{padding:7px 10px;border-bottom:1px solid #eee;font-size:12px}tr:nth-child(even) td{background:#f9fafb}
      .section-title{font-size:15px;font-weight:700;color:#166534;margin:20px 0 8px}
      .footer{margin-top:32px;text-align:center;color:#999;font-size:11px;border-top:1px solid #eee;padding-top:12px}
      .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600}
      .badge-pending{background:#fef9c3;color:#854d0e}.badge-confirmed,.badge-approved{background:#dcfce7;color:#166534}
      .badge-rejected{background:#fee2e2;color:#991b1b}@media print{body{padding:16px}}</style></head><body>
      <h1>এক উম্মাহ ফাউন্ডেশন</h1>
      <p class="sub">ফাউন্ডেশন রিপোর্ট — ${rangeLabel} | তৈরি: ${getBanglaDate()}</p>
      <div class="summary">
        <div class="stat gold" style="grid-column:span 2"><div class="stat-val">৳${totalFund.toLocaleString()}</div><div class="stat-lbl">মোট তহবিল</div></div>
        <div class="stat"><div class="stat-val">৳${totalDonated.toLocaleString()}</div><div class="stat-lbl">মোট দান</div></div>
        <div class="stat"><div class="stat-val">${confirmedDons.length}টি</div><div class="stat-lbl">দানের সংখ্যা</div></div>
        <div class="stat blue"><div class="stat-val">৳${totalApproved.toLocaleString()}</div><div class="stat-lbl">অনুমোদিত ঋণ</div></div>
        <div class="stat blue"><div class="stat-val">${loans.length}টি</div><div class="stat-lbl">ঋণ আবেদন</div></div>
        <div class="stat purple"><div class="stat-val">৳${totalSavings.toLocaleString()}</div><div class="stat-lbl">মোট সঞ্চয়</div></div>
        <div class="stat red"><div class="stat-val">৳${totalExpenses.toLocaleString()}</div><div class="stat-lbl">মোট ব্যয়</div></div>
        <div class="stat" style="grid-column:span 2"><div class="stat-val">${members} জন</div><div class="stat-lbl">মোট সদস্য</div></div>
      </div>
      ${donations.length > 0 ? `<div class="section-title">দানের তালিকা</div><table><thead><tr><th>তারিখ</th><th>সদস্য</th><th>ধরন</th><th>পরিমাণ</th><th>অবস্থা</th></tr></thead><tbody>${donations.map(d=>`<tr><td>${new Date(d.createdAt).toLocaleDateString('bn-BD')}</td><td>${d.userName}</td><td>${d.type}</td><td>৳${d.amount.toLocaleString()}</td><td><span class="badge badge-${d.status}">${STATUS_LABEL[d.status]||d.status}</span></td></tr>`).join('')}</tbody></table>` : ''}
      ${loans.length > 0 ? `<div class="section-title">ঋণের তালিকা</div><table><thead><tr><th>তারিখ</th><th>সদস্য</th><th>উদ্দেশ্য</th><th>পরিমাণ</th><th>অবস্থা</th></tr></thead><tbody>${loans.map(l=>`<tr><td>${new Date(l.createdAt).toLocaleDateString('bn-BD')}</td><td>${l.userName}</td><td>${l.purpose}</td><td>৳${l.amount.toLocaleString()}</td><td><span class="badge badge-${l.status}">${STATUS_LABEL[l.status]||l.status}</span></td></tr>`).join('')}</tbody></table>` : ''}
      ${expenses.length > 0 ? `<div class="section-title">ব্যয়ের তালিকা</div><table><thead><tr><th>তারিখ</th><th>শিরোনাম</th><th>ক্যাটাগরি</th><th>পরিমাণ</th></tr></thead><tbody>${expenses.map(e=>`<tr><td>${new Date(e.createdAt).toLocaleDateString('bn-BD')}</td><td>${e.title}</td><td>${e.category}</td><td>৳${e.amount.toLocaleString()}</td></tr>`).join('')}</tbody></table>` : ''}
      <div class="footer">এক উম্মাহ ফাউন্ডেশন — সুদমুক্ত সহায়তা, বিশ্বাসের বন্ধন</div>
      <script>window.onload=()=>{window.print()}<\/script></body></html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">ফাউন্ডেশন রিপোর্ট</h1>
        <p className="text-sm text-gray-400 mt-0.5">ফাউন্ডেশনের সামগ্রিক কার্যক্রম</p>
      </div>

      {/* মোট তহবিল */}
      <div className="relative bg-gradient-to-br from-amber-600 to-amber-500 rounded-3xl p-5 shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-white" />
          </div>
          <p className="text-amber-100 text-sm font-medium">ফাউন্ডেশনের মোট তহবিল</p>
        </div>
        <p className="text-white text-3xl font-bold">{loading ? '...' : formatTaka(totalFund)}</p>
        <p className="text-amber-200 text-xs mt-1">দান + পরিশোধ + সঞ্চয় − ঋণ − ব্যয়</p>
      </div>

      {/* মোট সদস্য */}
      <div className="card flex items-center gap-4 py-4">
        <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center shrink-0">
          <Users size={22} className="text-primary-700" />
        </div>
        <div>
          <p className="text-2xl font-bold text-primary-700">{toBn(members)} জন</p>
          <p className="text-xs text-gray-500">মোট নিবন্ধিত সদস্য</p>
        </div>
      </div>

      {/* সময়কাল ফিল্টার */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">সময়কাল</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {RANGES.map(({ key, label }) => (
            <button key={key} onClick={() => setRange(key)}
              className={cn('py-2.5 rounded-xl text-sm font-medium border transition-all',
                range === key ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-200')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* স্ট্যাটস গ্রিড */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="card bg-green-50 text-center py-4">
            <Heart size={16} className="text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-700">{formatTaka(totalDonated)}</p>
            <p className="text-xs text-gray-500 mt-0.5">মোট দান</p>
          </div>
          <div className="card bg-green-50 text-center py-4">
            <Heart size={16} className="text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-green-700">{toBn(confirmedDons.length)}টি</p>
            <p className="text-xs text-gray-500 mt-0.5">দানের সংখ্যা</p>
          </div>
          <div className="card bg-blue-50 text-center py-4">
            <CreditCard size={16} className="text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-700">{formatTaka(totalApproved)}</p>
            <p className="text-xs text-gray-500 mt-0.5">অনুমোদিত ঋণ</p>
          </div>
          <div className="card bg-blue-50 text-center py-4">
            <CreditCard size={16} className="text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-700">{toBn(loans.length)}টি</p>
            <p className="text-xs text-gray-500 mt-0.5">ঋণ আবেদন</p>
          </div>
          <div className="card bg-purple-50 text-center py-4">
            <PiggyBank size={16} className="text-purple-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-purple-700">{formatTaka(totalSavings)}</p>
            <p className="text-xs text-gray-500 mt-0.5">মোট সঞ্চয়</p>
          </div>
          <div className="card bg-red-50 text-center py-4">
            <ArrowDownCircle size={16} className="text-red-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600">{formatTaka(totalExpenses)}</p>
            <p className="text-xs text-gray-500 mt-0.5">মোট ব্যয়</p>
          </div>
        </div>
      )}

      {/* প্রিন্ট */}
      <div className="card">
        <button onClick={handlePrint} disabled={loading}
          className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50">
          <div className="w-11 h-11 bg-gray-700 rounded-xl flex items-center justify-center">
            <Printer size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-800">রিপোর্ট প্রিন্ট করুন</p>
            <p className="text-xs text-gray-500">সম্পূর্ণ রিপোর্ট প্রিন্ট হবে</p>
          </div>
          <Printer size={18} className="text-gray-400" />
        </button>
      </div>

      {/* দানের তালিকা — ২টা preview */}
      {!loading && donations.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">দানের তালিকা</h3>
            <Link href="/reports/donations" className="flex items-center gap-1 text-xs text-primary-600 font-medium">
              আরো দেখুন <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {donations.slice(0, 2).map(d => (
              <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{d.userName}</p>
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
        </div>
      )}

      {/* ঋণের তালিকা — ২টা preview */}
      {!loading && loans.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">ঋণের তালিকা</h3>
            <Link href="/reports/loans" className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              আরো দেখুন <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {loans.slice(0, 2).map(l => (
              <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{l.userName}</p>
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
        </div>
      )}

      {/* ব্যয়ের তালিকা — ২টা preview */}
      {!loading && expenses.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">ব্যয়ের তালিকা</h3>
            <Link href="/reports/expenses" className="flex items-center gap-1 text-xs text-red-600 font-medium">
              আরো দেখুন <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 2).map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{e.title}</p>
                  <p className="text-xs text-gray-400">{e.category} · {new Date(e.createdAt).toLocaleDateString('bn-BD')}</p>
                </div>
                <p className="text-sm font-bold text-red-600">{formatTaka(e.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && donations.length === 0 && loans.length === 0 && expenses.length === 0 && (
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">এই সময়কালে কোনো তথ্য নেই</p>
        </div>
      )}
    </div>
  );
}
