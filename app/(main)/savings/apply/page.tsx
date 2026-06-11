'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { SavingMethod } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import Link from 'next/link';

const METHODS: { key: SavingMethod; label: string; number: string; note: string }[] = [
  { key: 'bkash',  label: 'বিকাশ',     number: '01872839294',   note: 'Send Money' },
  { key: 'nagad',  label: 'নগদ',        number: '01872839294',   note: 'Send Money' },
  { key: 'rocket', label: 'রকেট',       number: '01872839294',   note: 'Send Money' },
  { key: 'dbbl',   label: 'ডাচ-বাংলা', number: '1577348553926', note: 'MIFTAHUL ISLAM' },
  { key: 'direct', label: 'সরাসরি জমা', number: '',              note: '' },
];

export default function SavingApplyPage() {
  const router   = useRouter();
  const { user } = useAuthStore();

  const [amount,    setAmount]    = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [method,    setMethod]    = useState<SavingMethod>('bkash');
  const [txId,    setTxId]    = useState('');
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const selectedMethod = METHODS.find(m => m.key === method);

  function copyNumber() {
    if (!selectedMethod?.number) return;
    navigator.clipboard.writeText(selectedMethod.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 50) { toast.error('ন্যূনতম ৫০ টাকা সঞ্চয় করুন'); return; }
    if (method !== 'direct' && !txId.trim()) { toast.error('ট্রানজেকশন আইডি দিন'); return; }

    setLoading(true);
    try {
      // পেন্ডিং আবেদন চেক
      const q    = query(collection(db, 'saving_requests'), where('userId', '==', user!.uid), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('আপনার একটি আবেদন ইতিমধ্যে যাচাইয়ের অপেক্ষায় আছে');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'saving_requests'), {
        userId:        user!.uid,
        userName:      user!.name,
        userPhone:     user!.phone,
        amount:        parseFloat(amount),
        frequency,
        method,
        transactionId: txId.trim() || 'সরাসরি জমা',
        note:          note.trim() || null,
        status:        'pending',
        createdAt:     new Date().toISOString(),
      });

      toast.success('সঞ্চয় আবেদন জমা হয়েছে! অ্যাডমিন অনুমোদন করলে নোটিফিকেশন পাবেন।');
      router.push('/savings');
    } catch {
      toast.error('জমা দিতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/savings">
          <button className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">সঞ্চয় আবেদন</h1>
          <p className="text-sm text-gray-400">অ্যাডমিন যাচাই করে অনুমোদন দেবেন</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Applicant info */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800 border-b pb-2">আবেদনকারীর তথ্য</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">নাম</label>
            <input value={user?.name || ''} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">মোবাইল</label>
            <input value={user?.phone || ''} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
        </div>

        {/* Amount */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800 border-b pb-2">সঞ্চয়ের পরিমাণ</h2>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">৳</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="০"
              min="50"
              className="input-field pl-8 text-lg font-semibold"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[100, 200, 500, 1000, 2000, 5000].map((n) => (
              <button key={n} type="button"
                onClick={() => setAmount(String(n))}
                className={`px-3 py-1 rounded-lg text-sm border transition-all ${
                  amount === String(n)
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                ৳{n.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-800 border-b pb-2">সঞ্চয়ের ধরন</h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'monthly' as const, label: '📅 মাসিক' },
              { key: 'weekly'  as const, label: '🗓️ সাপ্তাহিক' },
            ]).map((f) => (
              <button key={f.key} type="button"
                onClick={() => setFrequency(f.key)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  frequency === f.key
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">পেমেন্ট মাধ্যম</h2>

          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button key={m.key} type="button"
                onClick={() => { setMethod(m.key); setTxId(''); }}
                className={`py-2.5 px-3 rounded-xl border text-sm transition-all ${
                  method === m.key
                    ? 'bg-primary-700 text-white border-primary-700'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Send to number */}
          {selectedMethod?.number && (
            <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
              <p className="text-xs text-gray-500 mb-1">{selectedMethod.label} নম্বরে পাঠান</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-primary-800 tracking-wider">{selectedMethod.number}</p>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="w-8 h-8 bg-primary-700 text-white rounded-lg flex items-center justify-center transition-all active:scale-90"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              {selectedMethod.note && (
                <p className="text-xs text-primary-600 mt-1">{selectedMethod.note}</p>
              )}
            </div>
          )}

          {/* Transaction ID */}
          {method !== 'direct' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">ট্রানজেকশন আইডি *</label>
              <input
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="পেমেন্টের পর ট্রানজেকশন আইডি দিন"
                className="input-field"
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">মন্তব্য (ঐচ্ছিক)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="কোনো বিশেষ তথ্য থাকলে লিখুন"
              className="input-field"
            />
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            আবেদন জমার পর অ্যাডমিন যাচাই করে অনুমোদন দেবেন। অনুমোদিত হলে নোটিফিকেশনে রিসিট দেখতে পাবেন।
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Check size={18} /> আবেদন জমা দিন</>
          )}
        </button>
      </form>
    </div>
  );
}
