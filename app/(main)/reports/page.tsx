'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Donation, Loan } from '@/lib/types';
import { formatTaka, getBanglaDate, toBn } from '@/lib/utils';
import { FileText, Printer, Filter, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type RangeKey = 'this_month' | 'last_month' | 'this_year' | 'all';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'this_month', label: 'এই মাস'  },
  { key: 'last_month', label: 'গত মাস'  },
  { key: 'this_year',  label: 'এই বছর'  },
  { key: 'all',        label: 'সব'       },
];

function getDateRange(range: RangeKey): { from: Date; to: Date } {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  switch (range) {
    case 'this_month': return { from: new Date(year, month, 1),     to: new Date(year, month + 1, 0, 23, 59, 59) };
    case 'last_month': return { from: new Date(year, month - 1, 1), to: new Date(year, month, 0, 23, 59, 59)     };
    case 'this_year':  return { from: new Date(year, 0, 1),         to: new Date(year, 11, 31, 23, 59, 59)       };
    default:           return { from: new Date(2020, 0, 1),         to: new Date(2099, 11, 31)                    };
  }
}

export default function ReportsPage() {
  const { user } = useAuthStore();

  const [range,       setRange]       = useState<RangeKey>('this_month');
  const [donations,   setDonations]   = useState<Donation[]>([]);
  const [loans,       setLoans]       = useState<Loan[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [totalFund,   setTotalFund]   = useState(0); // মোট তহবিল from public_stats

  // ── মোট তহবিল: realtime ──
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'public_stats'), (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setTotalFund(data.totalDonation || 0);
      }
    });
    return () => unsub();
  }, []);

  // ── Member data ──
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const { from, to } = getDateRange(range);
    const fromISO = from.toISOString();
    const toISO   = to.toISOString();

    Promise.all([
      getDocs(query(
        collection(db, 'donations'),
        where('userId', '==', user.uid),
        where('createdAt', '>=', fromISO),
        where('createdAt', '<=', toISO),
        orderBy('createdAt', 'desc')
      )),
      getDocs(query(
        collection(db, 'loans'),
        where('userId', '==', user.uid),
        where('createdAt', '>=', fromISO),
        where('createdAt', '<=', toISO),
        orderBy('createdAt', 'desc')
      )),
    ])
      .then(([donSnap, loanSnap]) => {
        setDonations(donSnap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
        setLoans(loanSnap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
      })
      .catch(() => toast.error('ডেটা লোড করতে সমস্যা হয়েছে'))
      .finally(() => setLoading(false));
  }, [range, user]);

  // ── Computed stats ──
  const confirmedDons   = donations.filter(d => d.status === 'confirmed');
  const totalDonated    = confirmedDons.reduce((s, d) => s + d.amount, 0);
  const approvedLoans   = loans.filter(l => l.status === 'approved');
  const totalLoanAmt    = approvedLoans.reduce((s, l) => s + l.amount, 0);

  // ── Print ──
  function handlePrint() {
    const rangeLabel = RANGES.find(r => r.key === range)?.label || '';
    const html = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <title>রিপোর্ট — এক উম্মাহ ফাউন্ডেশন</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Noto Sans Bengali',sans-serif; padding:32px; color:#111; font-size:13px; }
          h1  { color:#166534; font-size:22px; margin-bottom:4px; }
          .sub { color:#555; font-size:12px; margin-bottom:20px; }
          .summary { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:24px; }
          .stat { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px; }
          .stat.blue { background:#eff6ff; border-color:#bfdbfe; }
          .stat.gold { background:#fefce8; border-color:#fde68a; }
          .stat-val { font-size:20px; font-weight:700; color:#166534; }
          .stat.blue .stat-val { color:#1d4ed8; }
          .stat.gold .stat-val { color:#92400e; }
          .stat-lbl { font-size:11px; color:#666; margin-top:2px; }
          table { width:100%; border-collapse:collapse; margin-bottom:24px; }
          th { background:#166534; color:white; padding:8px 10px; text-align:left; font-size:12px; }
          td { padding:7px 10px; border-bottom:1px solid #eee; font-size:12px; }
          tr:nth-child(even) td { background:#f9fafb; }
          .section-title { font-size:15px; font-weight:700; color:#166534; margin:20px 0 8px; }
          .footer { margin-top:32px; text-align:center; color:#999; font-size:11px; border-top:1px solid #eee; padding-top:12px; }
          .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; }
          .badge-pending   { background:#fef9c3; color:#854d0e; }
          .badge-confirmed,
          .badge-approved  { background:#dcfce7; color:#166534; }
          .badge-rejected  { background:#fee2e2; color:#991b1b; }
          @media print { body { padding:16px; } }
        </style>
      </head>
      <body>
        <h1>এক উম্মাহ ফাউন্ডেশন</h1>
        <p class="sub">সদস্য রিপোর্ট — ${rangeLabel} | সদস্য: ${user?.name} | তৈরি: ${getBanglaDate()}</p>

        <div class="summary">
          <div class="stat gold" style="grid-column:span 2">
            <div class="stat-val">৳${totalFund.toLocaleString()}</div>
            <div class="stat-lbl">ফাউন্ডেশনের মোট তহবিল</div>
          </div>
          <div class="stat">
            <div class="stat-val">৳${totalDonated.toLocaleString()}</div>
            <div class="stat-lbl">আপনার নিশ্চিত দান</div>
          </div>
          <div class="stat">
            <div class="stat-val">${confirmedDons.length}টি</div>
            <div class="stat-lbl">দানের সংখ্যা</div>
          </div>
          <div class="stat blue">
            <div class="stat-val">৳${totalLoanAmt.toLocaleString()}</div>
            <div class="stat-lbl">অনুমোদিত ঋণ</div>
          </div>
          <div class="stat blue">
            <div class="stat-val">${loans.length}টি</div>
            <div class="stat-lbl">ঋণ আবেদন</div>
          </div>
        </div>

        ${donations.length > 0 ? `
        <div class="section-title">দানের ইতিহাস</div>
        <table>
          <thead><tr><th>তারিখ</th><th>ধরন</th><th>মাধ্যম</th><th>পরিমাণ</th><th>অবস্থা</th></tr></thead>
          <tbody>
            ${donations.map(d => `
              <tr>
                <td>${new Date(d.createdAt).toLocaleDateString('bn-BD')}</td>
                <td>${d.type}</td><td>${d.method}</td>
                <td>৳${d.amount.toLocaleString()}</td>
                <td><span class="badge badge-${d.status}">${d.status === 'confirmed' ? 'নিশ্চিত' : d.status === 'pending' ? 'অপেক্ষারত' : 'বাতিল'}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}

        ${loans.length > 0 ? `
        <div class="section-title">ঋণের ইতিহাস</div>
        <table>
          <thead><tr><th>তারিখ</th><th>উদ্দেশ্য</th><th>পরিমাণ</th><th>পরিশোধ পরিকল্পনা</th><th>অবস্থা</th></tr></thead>
          <tbody>
            ${loans.map(l => `
              <tr>
                <td>${new Date(l.createdAt).toLocaleDateString('bn-BD')}</td>
                <td>${l.purpose}</td>
                <td>৳${l.amount.toLocaleString()}</td>
                <td>${l.repaymentPlan}</td>
                <td><span class="badge badge-${l.status}">${l.status === 'approved' ? 'অনুমোদিত' : l.status === 'pending' ? 'অপেক্ষারত' : 'বাতিল'}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}

        <div class="footer">এক উম্মাহ ফাউন্ডেশন — সুদমুক্ত সহায়তা, বিশ্বাসের বন্ধন</div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">রিপোর্ট</h1>
        <p className="text-sm text-gray-400 mt-0.5">আপনার কার্যক্রমের সারসংক্ষেপ</p>
      </div>

      {/* মোট তহবিল — full-width highlight card */}
      <div className="relative bg-gradient-to-br from-amber-600 to-amber-500 rounded-3xl p-5 shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <p className="text-amber-100 text-sm font-medium">ফাউন্ডেশনের মোট তহবিল</p>
        </div>
        <p className="text-white text-3xl font-bold">{formatTaka(totalFund)}</p>
        <p className="text-amber-200 text-xs mt-1">সকল নিশ্চিত দানের সমষ্টি</p>
      </div>

      {/* Date range filter */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">সময়কাল</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={cn(
                'py-2.5 rounded-xl text-sm font-medium border transition-all',
                range === key
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-gray-600 border-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="card bg-green-50 text-center py-4">
            <p className="text-xl font-bold text-green-700">{formatTaka(totalDonated)}</p>
            <p className="text-xs text-gray-500 mt-0.5">নিশ্চিত দান</p>
          </div>
          <div className="card bg-green-50 text-center py-4">
            <p className="text-xl font-bold text-green-700">{toBn(confirmedDons.length)}টি</p>
            <p className="text-xs text-gray-500 mt-0.5">দানের সংখ্যা</p>
          </div>
          <div className="card bg-blue-50 text-center py-4">
            <p className="text-xl font-bold text-blue-700">{formatTaka(totalLoanAmt)}</p>
            <p className="text-xs text-gray-500 mt-0.5">অনুমোদিত ঋণ</p>
          </div>
          <div className="card bg-blue-50 text-center py-4">
            <p className="text-xl font-bold text-blue-700">{toBn(loans.length)}টি</p>
            <p className="text-xs text-gray-500 mt-0.5">ঋণ আবেদন</p>
          </div>
        </div>
      )}

      {/* Print button */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-800">রিপোর্ট প্রিন্ট করুন</h3>
        <button
          onClick={handlePrint}
          disabled={loading}
          className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <div className="w-11 h-11 bg-gray-700 rounded-xl flex items-center justify-center">
            <Printer size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-800">প্রিন্ট করুন</p>
            <p className="text-xs text-gray-500">সরাসরি প্রিন্ট ডায়ালগ খুলবে</p>
          </div>
          <Printer size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Donation preview */}
      {!loading && donations.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-gray-800 mb-3">দানের তালিকা ({toBn(donations.length)}টি)</h3>
          <div className="space-y-2">
            {donations.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{d.type}</p>
                  <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('bn-BD')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{formatTaka(d.amount)}</p>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    d.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    d.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                                               'bg-red-100 text-red-700'
                  )}>
                    {d.status === 'confirmed' ? 'নিশ্চিত' : d.status === 'pending' ? 'অপেক্ষারত' : 'বাতিল'}
                  </span>
                </div>
              </div>
            ))}
            {donations.length > 5 && (
              <p className="text-center text-xs text-gray-400 pt-1">আরও {toBn(donations.length - 5)}টি — প্রিন্টে দেখুন</p>
            )}
          </div>
        </div>
      )}

      {/* Loans preview */}
      {!loading && loans.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-gray-800 mb-3">ঋণের তালিকা ({toBn(loans.length)}টি)</h3>
          <div className="space-y-2">
            {loans.slice(0, 5).map(l => (
              <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{l.purpose}</p>
                  <p className="text-xs text-gray-400">{new Date(l.createdAt).toLocaleDateString('bn-BD')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{formatTaka(l.amount)}</p>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    l.status === 'approved' ? 'bg-green-100 text-green-700' :
                    l.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-red-100 text-red-700'
                  )}>
                    {l.status === 'approved' ? 'অনুমোদিত' : l.status === 'pending' ? 'অপেক্ষারত' : 'বাতিল'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && donations.length === 0 && loans.length === 0 && (
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
