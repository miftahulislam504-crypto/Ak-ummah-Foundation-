'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { LoanPurpose, Guarantor } from '@/lib/types';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const PURPOSES: LoanPurpose[] = ['চিকিৎসা', 'ব্যবসা', 'শিক্ষা', 'কৃষি', 'জরুরি', 'অন্যান্য'];
const STEPS = ['ব্যক্তিগত তথ্য', 'ঋণের বিবরণ', 'জামিনদার', 'নিশ্চিত করুন'];

const purposeIcon: Record<string, string> = {
  চিকিৎসা: '🏥', ব্যবসা: '🏪', শিক্ষা: '📚',
  কৃষি: '🌾',   জরুরি: '🚨', অন্যান্য: '📋',
};

const emptyGuarantor: Guarantor = { name: '', phone: '', address: '', relation: '' };

export default function LoanApplyPage() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    profession:    user?.profession || '',
    address:       user?.address    || '',
    income:        '',
    amount:        '',
    purpose:       '' as LoanPurpose | '',
    repaymentPlan: '',
    note:          '',
  });

  const [guarantors, setGuarantors] = useState<Guarantor[]>([
    { ...emptyGuarantor },
    { ...emptyGuarantor },
  ]);
  const [pledged, setPledged] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function updateGuarantor(i: number, field: keyof Guarantor, val: string) {
    const g = [...guarantors];
    g[i] = { ...g[i], [field]: val };
    setGuarantors(g);
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.profession.trim()) { toast.error('পেশা দিন'); return false; }
      if (!form.address.trim())    { toast.error('ঠিকানা দিন'); return false; }
      if (!form.income || parseFloat(form.income) <= 0) { toast.error('মাসিক আয় দিন'); return false; }
    }
    if (step === 1) {
      if (!form.amount || parseFloat(form.amount) < 100) { toast.error('ন্যূনতম ১০০ টাকার ঋণ আবেদন করুন'); return false; }
      if (!form.purpose)           { toast.error('ঋণের উদ্দেশ্য বেছে নিন'); return false; }
      if (!form.repaymentPlan.trim()) { toast.error('পরিশোধের পরিকল্পনা লিখুন'); return false; }
    }
    if (step === 2) {
      for (let i = 0; i < 2; i++) {
        const g = guarantors[i];
        if (!g.name.trim())     { toast.error(`${i + 1}ম জামিনদারের নাম দিন`);     return false; }
        if (!g.phone.trim())    { toast.error(`${i + 1}ম জামিনদারের ফোন দিন`);     return false; }
        if (!g.address.trim())  { toast.error(`${i + 1}ম জামিনদারের ঠিকানা দিন`); return false; }
        if (!g.relation.trim()) { toast.error(`${i + 1}ম জামিনদারের সম্পর্ক দিন`); return false; }
      }
    }
    if (step === 3) {
      if (!pledged) { toast.error('অঙ্গীকারনামায় সম্মতি দিন'); return false; }
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    try {
      // Check existing pending/approved loans
      const q    = query(collection(db, 'loans'), where('userId', '==', user!.uid), where('status', 'in', ['pending', 'approved']));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('আপনার একটি সক্রিয় বা অপেক্ষারত ঋণ আছে');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'loans'), {
        userId:         user!.uid,
        userName:       user!.name,
        userPhone:      user!.phone,
        userAddress:    form.address.trim(),
        userProfession: form.profession.trim(),
        userIncome:     parseFloat(form.income),
        amount:         parseFloat(form.amount),
        purpose:        form.purpose,
        repaymentPlan:  form.repaymentPlan.trim(),
        guarantors,
        status:         'pending',
        note:           form.note.trim() || null,
        createdAt:      new Date().toISOString(),
      });

      toast.success('ঋণ আবেদন সফলভাবে জমা হয়েছে!');
      router.push('/loans');
    } catch {
      toast.error('জমা দিতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!validateStep()) return;
    if (step === 3) { handleSubmit(); return; }
    setStep(step + 1);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/loans">
          <button className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ঋণ আবেদন</h1>
          <p className="text-sm text-gray-400">ধাপ {step + 1} / {STEPS.length}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= step ? 'bg-primary-600' : 'bg-gray-200'
            }`} />
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold text-primary-700 -mt-3">{STEPS[step]}</p>

      {/* Step 0 — Personal info */}
      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">আবেদনকারীর তথ্য</h2>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">পেশা *</label>
            <input name="profession" value={form.profession} onChange={handleChange} placeholder="যেমন: কৃষক, ব্যবসায়ী" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">বর্তমান ঠিকানা *</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="গ্রাম, উপজেলা, জেলা" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">মাসিক আয় (টাকা) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">৳</span>
              <input name="income" type="number" value={form.income} onChange={handleChange} placeholder="০" className="input-field pl-8" />
            </div>
          </div>
        </div>
      )}

      {/* Step 1 — Loan details */}
      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800">ঋণের বিবরণ</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">ঋণের পরিমাণ (টাকা) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">৳</span>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="০" className="input-field pl-8 text-lg font-semibold" />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[1000, 2000, 5000, 10000, 20000, 50000].map(n => (
                <button key={n} type="button" onClick={() => setForm({ ...form, amount: String(n) })}
                  className={`px-3 py-1 rounded-lg text-xs border transition-all ${form.amount === String(n) ? 'bg-primary-700 text-white border-primary-700' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  ৳{n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">ঋণের উদ্দেশ্য *</label>
            <div className="grid grid-cols-3 gap-2">
              {PURPOSES.map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, purpose: p })}
                  className={`py-3 px-2 rounded-xl border text-sm flex flex-col items-center gap-1 transition-all ${
                    form.purpose === p ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  <span className="text-xl">{purposeIcon[p]}</span>
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">পরিশোধের পরিকল্পনা *</label>
            <textarea
              name="repaymentPlan"
              value={form.repaymentPlan}
              onChange={(e) => setForm({ ...form, repaymentPlan: e.target.value })}
              placeholder="কিভাবে ও কতদিনে পরিশোধ করবেন তা লিখুন"
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">অতিরিক্ত তথ্য (ঐচ্ছিক)</label>
            <textarea
              name="note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="ঋণের বিস্তারিত কারণ লিখতে পারেন"
              rows={2}
              className="input-field resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 2 — Guarantors */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">২ জন জামিনদার বাধ্যতামূলক</p>
            <p className="text-xs text-blue-500 mt-1">জামিনদার পরিবারের বাইরের সদস্য হতে হবে</p>
          </div>

          {[0, 1].map((i) => (
            <div key={i} className="card space-y-3">
              <h3 className="font-semibold text-gray-800">{i + 1}ম জামিনদার</h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">নাম *</label>
                <input value={guarantors[i].name} onChange={(e) => updateGuarantor(i, 'name', e.target.value)} placeholder="জামিনদারের নাম" className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">মোবাইল *</label>
                <input value={guarantors[i].phone} onChange={(e) => updateGuarantor(i, 'phone', e.target.value)} placeholder="01XXXXXXXXX" className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ঠিকানা *</label>
                <input value={guarantors[i].address} onChange={(e) => updateGuarantor(i, 'address', e.target.value)} placeholder="গ্রাম, উপজেলা, জেলা" className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">আবেদনকারীর সাথে সম্পর্ক *</label>
                <input value={guarantors[i].relation} onChange={(e) => updateGuarantor(i, 'relation', e.target.value)} placeholder="যেমন: বন্ধু, প্রতিবেশী" className="input-field" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3 — Confirm + Pledge */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-800">আবেদনের সারসংক্ষেপ</h2>
            {[
              { label: 'নাম',           value: user?.name },
              { label: 'পেশা',          value: form.profession },
              { label: 'মাসিক আয়',     value: `৳${form.income}` },
              { label: 'ঋণের পরিমাণ',  value: `৳${form.amount}` },
              { label: 'উদ্দেশ্য',     value: form.purpose },
              { label: 'পরিশোধ পরিকল্পনা', value: form.repaymentPlan },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          {/* Guarantors summary */}
          <div className="card space-y-2">
            <h3 className="font-semibold text-gray-800 mb-2">জামিনদারগণ</h3>
            {guarantors.map((g, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-800">{g.name} ({g.relation})</p>
                <p className="text-xs text-gray-500 mt-0.5">{g.phone} • {g.address}</p>
              </div>
            ))}
          </div>

          {/* Pledge */}
          <div className="card">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  আমি স্বেচ্ছায় স্বীকার করছি যে, এই ঋণ সুদমুক্ত এবং আমি নির্ধারিত সময়ে সম্পূর্ণ পরিমাণ ফেরত দিতে প্রতিশ্রুতিবদ্ধ। মিথ্যা তথ্য প্রদানে আইনগত ব্যবস্থা গ্রহণ করা হবে।
                </p>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pledged}
                onChange={(e) => setPledged(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-700 mt-0.5"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                আমি উপরের অঙ্গীকারনামার সাথে একমত এবং সকল তথ্য সঠিক বলে নিশ্চিত করছি।
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pb-4">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn-outline flex items-center gap-1.5 px-5">
            <ArrowLeft size={16} /> পিছনে
          </button>
        )}
        <button onClick={next} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : step === 3 ? (
            <><Check size={18} /> আবেদন জমা দিন</>
          ) : (
            <>পরবর্তী <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}
