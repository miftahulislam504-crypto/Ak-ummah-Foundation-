'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Donation, Loan } from '@/lib/types';
import { formatTaka, getBanglaDate, toBn } from '@/lib/utils';
import { FileText, Download, Printer, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type RangeKey = 'this_month' | 'last_month' | 'this_year' | 'all';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'this_month',  label: 'এই মাস'    },
  { key: 'last_month',  label: 'গত মাস'    },
  { key: 'this_year',   label: 'এই বছর'    },
  { key: 'all',         label: 'সব'         },
];

function getDateRange(range: RangeKey): { from: Date; to: Date } {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  switch (range) {
    case 'this_month':
      return { from: new Date(year, month, 1), to: new Date(year, month + 1, 0, 23, 59, 59) };
    case 'last_month':
      return { from: new Date(year, month - 1, 1), to: new Date(year, month, 0, 23, 59, 59) };
    case 'this_year':
      return { from: new Date(year, 0, 1), to: new Date(year, 11, 31, 23, 59, 59) };
    default:
      return { from: new Date(2020, 0, 1), to: new Date(2099, 11, 31) };
  }
}

export default function ReportsPage() {
  const { user }      = useAuthStore();
  const [range,       setRange]       = useState<RangeKey>('this_month');
  const [donations,   setDonations]   = useState<Donation[]>([]);
  const [loans,       setLoans]       = useState<Loan[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [exporting,   setExporting]   = useState(false);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    try {
      const { from, to } = getDateRange(range);
      const fromISO = from.toISOString();
      const toISO   = to.toISOString();

      const [donSnap, loanSnap] = await Promise.all([
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
      ]);

      setDonations(donSnap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
      setLoans(loanSnap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
    } catch (err) {
      toast.error('ডেটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [range, user]);

  // Summary stats
  const confirmedDonations = donations.filter(d => d.status === 'confirmed');
  const totalDonated       = confirmedDonations.reduce((s, d) => s + d.amount, 0);
  const pendingDonations   = donations.filter(d => d.status === 'pending').length;
  const approvedLoans      = loans.filter(l => l.status === 'approved');
  const totalLoanAmount    = approvedLoans.reduce((s, l) => s + l.amount, 0);
  const pendingLoans       = loans.filter(l => l.status === 'pending').length;

  // ===== PDF Export =====
  async function exportPDF() {
    setExporting(true);
    try {
      const { jsPDF }       = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const rangeLabel = RANGES.find(r => r.key === range)?.label || '';

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(22, 101, 52);
      doc.text('Ek Ummah Foundation', 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Member Report — ${rangeLabel}`, 14, 28);
      doc.text(`Member: ${user?.name} | Generated: ${new Date().toLocaleDateString('en-BD')}`, 14, 35);

      // Summary box
      doc.setFillColor(240, 253, 244);
      doc.rect(14, 40, 182, 28, 'F');
      doc.setFontSize(10);
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 18, 48);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.text(`Total Donated: BDT ${totalDonated.toLocaleString()}`, 18, 55);
      doc.text(`Confirmed Donations: ${confirmedDonations.length}`, 18, 61);
      doc.text(`Active Loans: BDT ${totalLoanAmount.toLocaleString()}`, 110, 55);
      doc.text(`Loan Applications: ${loans.length}`, 110, 61);

      let y = 78;

      // Donations table
      if (donations.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(22, 101, 52);
        doc.text('Donation History', 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head:   [['Date', 'Type', 'Method', 'Amount', 'Status']],
          body:   donations.map(d => [
            new Date(d.createdAt).toLocaleDateString('en-BD'),
            d.type,
            d.method,
            `BDT ${d.amount.toLocaleString()}`,
            d.status,
          ]),
          headStyles:  { fillColor: [22, 101, 52], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          styles: { fontSize: 9, cellPadding: 3 },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
      }

      // Loans table
      if (loans.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(22, 101, 52);
        doc.text('Loan Applications', 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head:   [['Date', 'Purpose', 'Amount', 'Status']],
          body:   loans.map(l => [
            new Date(l.createdAt).toLocaleDateString('en-BD'),
            l.purpose,
            `BDT ${l.amount.toLocaleString()}`,
            l.status,
          ]),
          headStyles:  { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [239, 246, 255] },
          styles: { fontSize: 9, cellPadding: 3 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} — Ek Ummah Foundation`, 14, 290);
      }

      doc.save(`ekummah-report-${range}-${Date.now()}.pdf`);
      toast.success('PDF ডাউনলোড হচ্ছে');
    } catch (err) {
      toast.error('PDF তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setExporting(false);
    }
  }

  // ===== Excel Export =====
  async function exportExcel() {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const wb   = XLSX.utils.book_new();

      // Donations sheet
      const donData = [
        ['Date', 'Type', 'Method', 'Transaction ID', 'Amount (BDT)', 'Status'],
        ...donations.map(d => [
          new Date(d.createdAt).toLocaleDateString('en-BD'),
          d.type, d.method, d.transactionId,
          d.amount, d.status,
        ]),
      ];
      const donSheet = XLSX.utils.aoa_to_sheet(donData);
      donSheet['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, donSheet, 'Donations');

      // Loans sheet
      const loanData = [
        ['Date', 'Purpose', 'Amount (BDT)', 'Repayment Plan', 'Status'],
        ...loans.map(l => [
          new Date(l.createdAt).toLocaleDateString('en-BD'),
          l.purpose, l.amount, l.repaymentPlan, l.status,
        ]),
      ];
      const loanSheet = XLSX.utils.aoa_to_sheet(loanData);
      loanSheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, loanSheet, 'Loans');

      // Summary sheet
      const summaryData = [
        ['এক উম্মাহ ফাউন্ডেশন — সদস্য রিপোর্ট'],
        ['সদস্য:', user?.name],
        ['সময়কাল:', RANGES.find(r => r.key === range)?.label],
        ['তৈরির তারিখ:', new Date().toLocaleDateString('en-BD')],
        [],
        ['বিবরণ', 'মান'],
        ['মোট দান (নিশ্চিত)', totalDonated],
        ['দানের সংখ্যা', confirmedDonations.length],
        ['মোট ঋণ (অনুমোদিত)', totalLoanAmount],
        ['ঋণ আবেদনের সংখ্যা', loans.length],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 28 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      XLSX.writeFile(wb, `ekummah-report-${range}-${Date.now()}.xlsx`);
      toast.success('Excel ডাউনলোড হচ্ছে');
    } catch (err) {
      toast.error('Excel তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setExporting(false);
    }
  }

  // ===== Print =====
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
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans Bengali', sans-serif; padding: 32px; color: #111; font-size: 13px; }
          h1 { color: #166534; font-size: 22px; margin-bottom: 4px; }
          .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; }
          .stat-val { font-size: 20px; font-weight: 700; color: #166534; }
          .stat-lbl { font-size: 11px; color: #666; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #166534; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
          td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
          tr:nth-child(even) td { background: #f9fafb; }
          .section-title { font-size: 15px; font-weight: 700; color: #166534; margin: 20px 0 8px; }
          .footer { margin-top: 32px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 12px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
          .badge-pending  { background: #fef9c3; color: #854d0e; }
          .badge-confirmed,
          .badge-approved { background: #dcfce7; color: #166534; }
          .badge-rejected { background: #fee2e2; color: #991b1b; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <h1>এক উম্মাহ ফাউন্ডেশন</h1>
        <p class="sub">সদস্য রিপোর্ট — ${rangeLabel} | সদস্য: ${user?.name} | তৈরি: ${getBanglaDate()}</p>

        <div class="summary">
          <div class="stat"><div class="stat-val">৳${totalDonated.toLocaleString()}</div><div class="stat-lbl">মোট নিশ্চিত দান</div></div>
          <div class="stat"><div class="stat-val">${confirmedDonations.length}টি</div><div class="stat-lbl">দানের সংখ্যা</div></div>
          <div class="stat"><div class="stat-val">৳${totalLoanAmount.toLocaleString()}</div><div class="stat-lbl">অনুমোদিত ঋণ</div></div>
          <div class="stat"><div class="stat-val">${loans.length}টি</div><div class="stat-lbl">ঋণ আবেদন</div></div>
        </div>

        ${donations.length > 0 ? `
        <div class="section-title">দানের ইতিহাস</div>
        <table>
          <thead><tr><th>তারিখ</th><th>ধরন</th><th>মাধ্যম</th><th>পরিমাণ</th><th>অবস্থা</th></tr></thead>
          <tbody>
            ${donations.map(d => `
              <tr>
                <td>${new Date(d.createdAt).toLocaleDateString('bn-BD')}</td>
                <td>${d.type}</td>
                <td>${d.method}</td>
                <td>৳${d.amount.toLocaleString()}</td>
                <td><span class="badge badge-${d.status}">${d.status === 'confirmed' ? 'নিশ্চিত' : d.status === 'pending' ? 'অপেক্ষারত' : 'বাতিল'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

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
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">এক উম্মাহ ফাউন্ডেশন — সুদমুক্ত সহায়তা, বিশ্বাসের বন্ধন</div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">রিপোর্ট</h1>
        <p className="text-sm text-gray-400 mt-0.5">PDF, Excel বা প্রিন্ট করুন</p>
      </div>

      {/* Date range filter */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
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
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
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
          {[
            { label: 'নিশ্চিত দান',      value: formatTaka(totalDonated),       color: 'text-green-700',  bg: 'bg-green-50'  },
            { label: 'দানের সংখ্যা',     value: toBn(confirmedDonations.length) + 'টি', color: 'text-green-700',  bg: 'bg-green-50'  },
            { label: 'অনুমোদিত ঋণ',     value: formatTaka(totalLoanAmount),    color: 'text-blue-700',   bg: 'bg-blue-50'   },
            { label: 'ঋণ আবেদন',         value: toBn(loans.length) + 'টি',     color: 'text-blue-700',   bg: 'bg-blue-50'   },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`card ${bg} text-center py-4`}>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Export buttons */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-800">এক্সপোর্ট করুন</h3>

        <button
          onClick={exportPDF}
          disabled={exporting || loading || (donations.length === 0 && loans.length === 0)}
          className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl transition-all active:scale-98 disabled:opacity-50"
        >
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-800">PDF ডাউনলোড</p>
            <p className="text-xs text-gray-500">প্রিন্টযোগ্য ফরম্যাটে</p>
          </div>
          <Download size={18} className="text-red-500" />
        </button>

        <button
          onClick={exportExcel}
          disabled={exporting || loading || (donations.length === 0 && loans.length === 0)}
          className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl transition-all active:scale-98 disabled:opacity-50"
        >
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <FileText size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-800">Excel ডাউনলোড</p>
            <p className="text-xs text-gray-500">স্প্রেডশিট ফরম্যাটে</p>
          </div>
          <Download size={18} className="text-green-600" />
        </button>

        <button
          onClick={handlePrint}
          disabled={loading || (donations.length === 0 && loans.length === 0)}
          className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all active:scale-98 disabled:opacity-50"
        >
          <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
            <Printer size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-gray-800">প্রিন্ট করুন</p>
            <p className="text-xs text-gray-500">সরাসরি প্রিন্ট ডায়ালগ</p>
          </div>
          <Printer size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Data preview */}
      {!loading && donations.length === 0 && loans.length === 0 && (
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">এই সময়কালে কোনো তথ্য নেই</p>
        </div>
      )}

      {/* Donation preview table */}
      {!loading && donations.length > 0 && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-gray-800 mb-3">দানের তালিকা ({toBn(donations.length)}টি)</h3>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs text-primary-700 font-semibold">ধরন</th>
                  <th className="text-left px-3 py-2.5 text-xs text-primary-700 font-semibold">পরিমাণ</th>
                  <th className="text-left px-3 py-2.5 text-xs text-primary-700 font-semibold">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {donations.slice(0, 5).map(d => (
                  <tr key={d.id}>
                    <td className="px-5 py-2.5 text-gray-700">{d.type}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800">{formatTaka(d.amount)}</td>
                    <td className="px-3 py-2.5">
                      <span className={d.status === 'confirmed' ? 'badge-active' : d.status === 'pending' ? 'badge-pending' : 'badge-rejected'}>
                        {d.status === 'confirmed' ? 'নিশ্চিত' : d.status === 'pending' ? 'অপেক্ষারত' : 'বাতিল'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {donations.length > 5 && (
              <p className="text-center text-xs text-gray-400 py-2">আরও {toBn(donations.length - 5)}টি — PDF/Excel-এ দেখুন</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
