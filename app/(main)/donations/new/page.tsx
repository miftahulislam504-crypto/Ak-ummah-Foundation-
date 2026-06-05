'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { DonationType, DonationMethod, FamilyMember } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, CreditCard, Smartphone } from 'lucide-react';
import Link from 'next/link';

const DONATION_TYPES: DonationType[] = ['সাধারণ', 'পারিবারিক সদস্য', 'বিশেষ', 'যাকাত', 'ফিতরা'];

const MANUAL_METHODS = [
  { key: 'bkash',  label: 'বিকাশ',       number: '01XXXXXXXXX' },
  { key: 'nagad',  label: 'নগদ',          number: '01XXXXXXXXX' },
  { key: 'rocket', label: 'রকেট',         number: '01XXXXXXXXX' },
  { key: 'dbbl',   label: 'ডাচ-বাংলা',   number: '01XXXXXXXXX' },
  { key: 'direct', label: 'সরাসরি জমা',   number: ''            },
];

export default function NewDonationPage() {
  const router       = useRouter();
  const { user }     = useAuthStore();

  const [donType,    setDonType]    = useState<DonationType>('সাধারণ');
  const [amount,     setAmount]     = useState('');
  const [method,     setMethod]     = useState<DonationMethod>('bkash');
  const [txId,       setTxId]       = useState('');
  const [note,       setNote]       = useState('');
  const [payMode,    setPayMode]    = useState<'manual' | 'online'>('manual');
  const [loading,    setLoading]    = useState(false);
  const [familyRows, setFamilyRows] = useState<FamilyMember[]>([{ name: '', relation: '' }]);

  function addFamilyRow() {
    setFamilyRows([...familyRows, { name: '', relation: '' }]);
  }

  function removeFamilyRow(i: number) {
    setFamilyRows(familyRows.filter((_, idx) => idx !== i));
  }

  function updateFamilyRow(i: number, field: keyof FamilyMember, val: string) {
    const rows = [...familyRows];
    rows[i] = { ...rows[i], [field]: val };
    setFamilyRows(rows);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 100) { toast.error('ন্যূনতম ১০০ টাকা দান করুন'); return; }
    if (!txId.trim())                         { toast.error('ট্রানজেকশন আইডি দিন'); return; }
    if (donType === 'পারিবারিক সদস্য') {
      const invalid = familyRows.some(r => !r.name.trim() || !r.relation.trim());
      if (invalid) { toast.error('পারিবারিক সদস্যদের নাম ও সম্পর্ক দিন'); return; }
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'donations'), {
        userId:        user!.uid,
        userName:      user!.name,
        userPhone:     user!.phone,
        amount:        parseFloat(amount),
        type:          donType,
        method,
        transactionId: txId.trim(),
        status:        'pending',
        familyMembers: donType === 'পারিবারিক সদস্য' ? familyRows : [],
        note:          note.trim() || null,
        createdAt:     new Date().toISOString(),
      });
      toast.success('দান আবেদন জমা হয়েছে! অ্যাডমিন যাচাই করবেন।');
      router.push('/donations');
    } catch {
      toast.error('জমা দিতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }

  async function handleOnlinePayment() {
    if (!amount || parseFloat(amount) < 100) { toast.error('ন্যূনতম ১০০ টাকা দিন'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PAYMENT_SERVER}/payment/init`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:   parseFloat(amount),
          userId:   user!.uid,
          userName: user!.name,
          userEmail:user!.email,
          userPhone:user!.phone,
          donType,
          note,
        }),
      });
      const data = await res.json();
      if (data.GatewayPageURL) {
        window.location.href = data.GatewayPageURL;
      } else {
        toast.error('পেমেন্ট শুরু করা যায়নি');
      }
    } catch {
      toast.error('পেমেন্ট সার্ভারে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }

  const selectedMethod = MANUAL_METHODS.find(m => m.key === method);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/donations">
          <button className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">নতুন দান</h1>
          <p className="text-sm text-gray-400">আল্লাহর পথে দান করুন</p>
        </div>
      </div>

      {/* Donation type */}
      <div className="card space-y-3">
        <label className="block text-sm font-semibold text-gray-700">দানের ধরন</label>
        <div className="flex flex-wrap gap-2">
          {DONATION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setDonType(t)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                donType === t
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Family members */}
      {donType === 'পারিবারিক সদস্য' && (
        <div className="card space-y-3">
          <label className="block text-sm font-semibold text-gray-700">পারিবারিক সদস্যদের তথ্য</label>
          {familyRows.map((row, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  value={row.name}
                  onChange={(e) => updateFamilyRow(i, 'name', e.target.value)}
                  placeholder="সদস্যের নাম"
                  className="input-field"
                />
                <input
                  value={row.relation}
                  onChange={(e) => updateFamilyRow(i, 'relation', e.target.value)}
                  placeholder="সম্পর্ক (যেমন: স্ত্রী, পুত্র)"
                  className="input-field"
                />
              </div>
              {familyRows.length > 1 && (
                <button onClick={() => removeFamilyRow(i)} className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center mt-1">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addFamilyRow} className="flex items-center gap-1.5 text-sm text-primary-700 font-medium">
            <Plus size={16} /> সদস্য যোগ করুন
          </button>
        </div>
      )}

      {/* Amount */}
      <div className="card space-y-3">
        <label className="block text-sm font-semibold text-gray-700">দানের পরিমাণ (টাকা)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">৳</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="০"
            min="100"
            className="input-field pl-8 text-lg font-semibold"
          />
        </div>
        {/* Quick amounts */}
        <div className="flex gap-2 flex-wrap">
          {[100, 200, 500, 1000, 2000, 5000].map((n) => (
            <button
              key={n}
              onClick={() => setAmount(String(n))}
              className={`px-3 py-1 rounded-lg text-sm border transition-all ${
                amount === String(n)
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              ৳{n}
            </button>
          ))}
        </div>
      </div>

      {/* Payment mode toggle */}
      <div className="card space-y-4">
        <label className="block text-sm font-semibold text-gray-700">পেমেন্ট পদ্ধতি</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPayMode('manual')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
              payMode === 'manual'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <Smartphone size={18} /> ম্যানুয়াল
          </button>
          <button
            onClick={() => setPayMode('online')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
              payMode === 'online'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <CreditCard size={18} /> অনলাইন
          </button>
        </div>

        {/* Manual payment */}
        {payMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            {/* Method select */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">মাধ্যম বেছে নিন</label>
              <div className="grid grid-cols-3 gap-2">
                {MANUAL_METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key as DonationMethod)}
                    className={`py-2 px-3 rounded-xl text-sm border transition-all ${
                      method === m.key
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment number */}
            {selectedMethod?.number && (
              <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
                <p className="text-xs text-gray-500 mb-1">{selectedMethod.label} নম্বরে পাঠান</p>
                <p className="text-lg font-bold text-primary-800 tracking-wider">{selectedMethod.number}</p>
              </div>
            )}

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">ট্রানজেকশন আইডি *</label>
              <input
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="পেমেন্টের পর ট্রানজেকশন আইডি দিন"
                className="input-field"
              />
            </div>

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

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'দান জমা দিন'
              }
            </button>
          </form>
        )}

        {/* Online payment */}
        {payMode === 'online' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-700 font-medium mb-1">SSLCommerz পেমেন্ট</p>
              <p className="text-xs text-blue-500">বিকাশ, নগদ, কার্ড সহ সব পদ্ধতিতে পেমেন্ট করা যাবে</p>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">মন্তব্য (ঐচ্ছিক)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="কোনো বিশেষ তথ্য"
                className="input-field"
              />
            </div>

            <button
              onClick={handleOnlinePayment}
              disabled={loading}
              className="btn-gold w-full flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CreditCard size={18} /> পেমেন্ট করুন</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
