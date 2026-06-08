'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification, SavingRequest } from '@/lib/types';
import { formatTaka, getRelativeTime } from '@/lib/utils';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  info:    { icon: Info,          cls: 'bg-blue-100  text-blue-600'  },
  success: { icon: CheckCircle,   cls: 'bg-green-100 text-green-600' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-100 text-amber-600' },
  error:   { icon: XCircle,       cls: 'bg-red-100   text-red-600'   },
};

function isSavingApprovalNotif(n: Notification) {
  return (
    n.type === 'success' &&
    (n.title.includes('সঞ্চয়') || n.message.includes('সঞ্চয়')) &&
    n.message.includes('অনুমোদন')
  );
}

function PrintReceipt({ notif, request }: { notif: Notification; request: SavingRequest | null }) {
  function handlePrint() {
    const now = new Date();
    const receiptNo = request?.receiptData?.receiptNo || `REC-${Date.now()}`;
    const approvedAt = request?.approvedAt
      ? new Date(request.approvedAt).toLocaleString('bn-BD')
      : now.toLocaleString('bn-BD');

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <title>সঞ্চয় রিসিট</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'SolaimanLipi', Arial, sans-serif; padding: 24px; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #1a5c2e; padding-bottom: 14px; margin-bottom: 16px; }
    .org-name { font-size: 20px; font-weight: bold; color: #1a5c2e; }
    .org-sub  { font-size: 12px; color: #888; margin-top: 2px; }
    .receipt-title { font-size: 15px; font-weight: bold; text-align: center; margin: 12px 0; background: #f0fdf4; padding: 6px; border-radius: 6px; color: #166534; }
    .receipt-no { text-align: center; font-size: 12px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px 4px; font-size: 13px; border-bottom: 1px solid #eee; }
    td:first-child { color: #555; width: 45%; }
    td:last-child   { font-weight: 600; }
    .amount-row td  { font-size: 16px; font-weight: bold; color: #1a5c2e; }
    .footer { margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 12px; }
    .footer p { font-size: 11px; color: #888; text-align: center; margin-top: 4px; }
    .status-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: bold; }
    @media print {
      body { padding: 0; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">AK Ummah Foundation</div>
    <div class="org-sub">এক উম্মাহ ফাউন্ডেশন — সুদমুক্ত সহায়তা</div>
  </div>
  <div class="receipt-title">সঞ্চয় রিসিট</div>
  <div class="receipt-no">রিসিট নং: ${receiptNo}</div>
  <table>
    <tr><td>সদস্যের নাম</td><td>${request?.userName || notif.title}</td></tr>
    <tr><td>মোবাইল</td><td>${request?.userPhone || '—'}</td></tr>
    <tr class="amount-row">
      <td>সঞ্চয়ের পরিমাণ</td>
      <td>৳${request ? Number(request.amount).toLocaleString('bn-BD') : '—'}</td>
    </tr>
    <tr><td>মাধ্যম</td><td>${request?.method ? request.method.toUpperCase() : '—'}</td></tr>
    ${request?.transactionId && request.transactionId !== 'সরাসরি জমা'
      ? `<tr><td>ট্রানজেকশন আইডি</td><td>${request.transactionId}</td></tr>`
      : ''}
    <tr><td>অনুমোদনের তারিখ</td><td>${approvedAt}</td></tr>
    <tr><td>অবস্থা</td><td><span class="status-badge">অনুমোদিত</span></td></tr>
  </table>
  <div class="footer">
    <p>এই রিসিটটি সঞ্চয় অনুমোদনের প্রমাণ হিসেবে সংরক্ষণ করুন।</p>
    <p>জারিকৃত: ${now.toLocaleString('bn-BD')}</p>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`);
    printWindow.document.close();
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1.5 text-xs font-medium bg-green-700 text-white px-3 py-1.5 rounded-lg mt-2"
    >
      <Printer size={13} /> রিসিট প্রিন্ট করুন
    </button>
  );
}

export default function NotificationsPage() {
  const { user }  = useAuthStore();
  const [notifs,  setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading]  = useState(true);
  const [savingRequests, setSavingRequests] = useState<Record<string, SavingRequest>>({});

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifs(list);
      setLoading(false);

      // সঞ্চয় অনুমোদনের নোটিফিকেশনের জন্য request data লোড করো
      const savingNotifs = list.filter(isSavingApprovalNotif);
      const map: Record<string, SavingRequest> = {};
      for (const n of savingNotifs) {
        if (n.relatedId) {
          try {
            const rSnap = await getDoc(doc(db, 'saving_requests', n.relatedId));
            if (rSnap.exists()) {
              map[n.id] = { id: rSnap.id, ...rSnap.data() } as SavingRequest;
            }
          } catch {}
        }
      }
      setSavingRequests(map);
    });
    return () => unsub();
  }, [user]);

  async function markRead(id: string) {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  }

  async function markAllRead() {
    const batch = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  }

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">নোটিফিকেশন</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{unreadCount}টি অপঠিত</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-primary-700 font-medium bg-primary-50 px-3 py-1.5 rounded-full">
            <CheckCheck size={14} />
            সব পড়া হয়েছে
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Bell size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400">কোনো নোটিফিকেশন নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => {
            const { icon: Icon, cls } = iconMap[n.type] || iconMap.info;
            const isSavingApproval   = isSavingApprovalNotif(n);
            const savingRequest      = savingRequests[n.id] || null;

            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={cn(
                  'card flex gap-3 cursor-pointer transition-all active:scale-98',
                  !n.read && 'border-l-4 border-l-primary-500 bg-primary-50/30'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cls)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium text-gray-800', !n.read && 'font-semibold')}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>

                  {/* সঞ্চয় অনুমোদন হলে প্রিন্ট বাটন দেখাও */}
                  {isSavingApproval && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <PrintReceipt notif={n} request={savingRequest} />
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-1.5">{getRelativeTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
