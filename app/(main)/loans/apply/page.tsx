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

const PURPOSES: LoanPurpose[] = ['চিকিৎসা', 'ব্যবসা', 'শিক্ষা', 'কৃষি', 'জরুরি প্রয়োজন', 'অন্যান্য'];
const STEPS = ['ব্যক্তিগত তথ্য', 'ঋণের বিবরণ', 'পরিশোধ পরিকল্পনা', 'জামিনদার', 'নিশ্চিত করুন'];

const emptyGuarantor: Guarantor = { name: '', phone: '', address: '', relation: '' };

export default function LoanApplyPage() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fatherName:      '',
    profession:      user?.profession || '',
    address:         user?.address    || '',
    income:          '',
    amount:          '',
    duration:        '',
    purpose:         '' as LoanPurpose | '',
    purposeOther:    '',
    reason:          '',
    repaymentMethod: '',
    installmentType: 'মাসিক' as 'মাসিক' | 'সাপ্তাহিক',
    installmentAmt:  '',
  });

  const [guarantors, setGuarantors] = useState<Guarantor[]>([
    { ...emptyGuarantor },
    { ...emptyGuarantor },
  ]);
  const [pledged, setPledged] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function updateGuarantor(i: number, field: keyof Guarantor, val: string) {
    const g = [...guarantors];
    g[i] = { ...g[i], [field]: val };
    setGuarantors(g);
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.fatherName.trim())  { toast.error('পিতার নাম দিন'); return false; }
      if (!form.profession.trim())  { toast.error('পেশা দিন'); return false; }
      if (!form.address.trim())     { toast.error('ঠিকানা দিন'); return false; }
      if (!form.income || parseFloat(form.income) <= 0) { toast.error('মাসিক আয় দিন'); return false; }
    }
    if (step === 1) {
      if (!form.amount || parseFloat(form.amount) < 100) { toast.error('ন্যূনতম ১০০ টাকার ঋণ আবেদন করুন'); return false; }
      if (!form.duration.trim())   { toast.error('কত দিনের জন্য তা লিখুন'); return false; }
      if (!form.purpose)           { toast.error('ঋণের উদ্দেশ্য বেছে নিন'); return false; }
      if (!form.reason.trim())     { toast.error('বিস্তারিত কারণ লিখুন'); return false; }
    }
    if (step === 2) {
      if (!form.repaymentMethod.trim()) { toast.error('পরিশোধের পদ্ধতি লিখুন'); return false; }
      if (!form.installmentAmt.trim())  { toast.error('কিস্তির পরিমাণ দিন'); return false; }
    }
    if (step === 3) {
      for (let i = 0; i < 2; i++) {
        const g = guarantors[i];
        if (!g.name.trim())     { toast.error(`${i + 1}ম জামিনদারের নাম দিন`);     return false; }
        if (!g.phone.trim())    { toast.error(`${i + 1}ম জামিনদারের ফোন দিন`);     return false; }
        if (!g.relation.trim()) { toast.error(`${i + 1}ম জামিনদারের সম্পর্ক দিন`); return false; }
      }
    }
    if (step === 4) {
      if (!pledged) { toast.error('অঙ্গীকারনামায় সম্মতি দিন'); return false; }
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const q    = query(collection(db, 'loans'), where('userId', '==', user!.uid), where('status', 'in', ['pending', 'approved']));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('আপনার একটি সক্রিয় বা অপেক্ষারত ঋণ আছে');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'loans'), {
        userId:          user!.uid,
        userName:        user!.name,
        userPhone:       user!.phone,
        userAddress:     form.address.trim(),
        userProfession:  form.profession.trim(),
        userFatherName:  form.fatherName.trim(),
        userIncome:      parseFloat(form.income),
        amount:          parseFloat(form.amount),
        duration:        form.duration.trim(),
        purpose:         form.purpose === 'অন্যান্য' && form.purposeOther
                           ? `অন্যান্য: ${form.purposeOther}`
                           : form.purpose,
        reason:          form.reason.trim(),
        repaymentMethod: form.repaymentMethod.trim(),
        installmentType: form.installmentType,
        installmentAmt:  parseFloat(form.installmentAmt),
        guarantors,
        status:          'pending',
        createdAt:       new Date().toISOString(),
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
    if (step === 4) { handleSubmit(); return; }
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
      <div className="flex items-center gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-sm font-semibold text-primary-700 -mt-3">{STEPS[step]}</p>

      {/* ── Step 0 — ব্যক্তিগত তথ্য ── */}
      {step === 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">আবেদনকারীর তথ্য</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">নাম</label>
            <input value={user?.name || ''} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">পিতার নাম *</label>
            <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="পিতার পূর্ণ নাম" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">বর্তমান ঠিকানা *</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="গ্রাম, উপজেলা, জেলা" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">মোবাইল নম্বর</label>
            <input value={user?.phone || ''} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">পেশা *</label>
            <input name="profession" value={form.profession} onChange={handleChange} placeholder="যেমন: কৃষক, ব্যবসায়ী" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">মাসিক আয় (টাকা) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">৳</span>
              <input name="income" type="number" value={form.income} onChange={handleChange} placeholder="০" className="input-field pl-8" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1 — ঋণের বিবরণ ── */}
      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">ঋণ সংক্রান্ত তথ্য</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">কত টাকা প্রয়োজন *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">৳</span>
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5">কত দিনের জন্য *</label>
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="যেমন: ৩০ দিন, ৬ মাস, ১ বছর" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">উদ্দেশ্য *</label>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSES.map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, purpose: p })}
                  className={`py-2.5 px-3 rounded-xl border text-sm text-left transition-all ${
                    form.purpose === p ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
            {form.purpose === 'অন্যান্য' && (
              <input name="purposeOther" value={form.purposeOther} onChange={handleChange}
                placeholder="উদ্দেশ্য লিখুন" className="input-field mt-2" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">বিস্তারিত কারণ *</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="ঋণের প্রয়োজনীয়তার বিস্তারিত কারণ লিখুন"
              rows={4}
              className="input-field resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Step 2 — পরিশোধ পরিকল্পনা ── */}
      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 border-b pb-2">পরিশোধ পরিকল্পনা</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">কিভাবে পরিশোধ করবেন *</label>
            <textarea
              name="repaymentMethod"
              value={form.repaymentMethod}
              onChange={(e) => setForm({ ...form, repaymentMethod: e.target.value })}
              placeholder="যেমন: ব্যবসার আয় থেকে, চাকরির বেতন থেকে..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">কিস্তির ধরন *</label>
            <div className="flex gap-3">
              {(['মাসিক', 'সাপ্তাহিক'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, installmentType: t })}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.installmentType === t ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {t} কিস্তি
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              {form.installmentType} কিস্তির পরিমাণ (টাকা) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">৳</span>
              <input name="installmentAmt" type="number" value={form.installmentAmt} onChange={handleChange}
                placeholder="০" className="input-field pl-8" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3 — জামিনদার ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium">জামিনদার তথ্য</p>
            <p className="text-xs text-blue-600 mt-1 leading-relaxed">
              পুরুষ হলে ২ জন পুরুষ জামিনদার এবং মহিলা হলে ১ জন পুরুষের পরিবর্তে ২ জন মহিলা।
            </p>
            <p className="text-xs text-blue-500 mt-1">(আল-বাকারাহ: ২৮২)</p>
          </div>

          {[0, 1].map((i) => (
            <div key={i} className="card space-y-3">
              <h3 className="font-semibold text-gray-800">জামিনদার {i + 1}</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">নাম *</label>
                <input value={guarantors[i].name} onChange={(e) => updateGuarantor(i, 'name', e.target.value)} placeholder="জামিনদারের নাম" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">মোবাইল *</label>
                <input value={guarantors[i].phone} onChange={(e) => updateGuarantor(i, 'phone', e.target.value)} placeholder="01XXXXXXXXX" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">সম্পর্ক *</label>
                <input value={guarantors[i].relation} onChange={(e) => updateGuarantor(i, 'relation', e.target.value)} placeholder="যেমন: বন্ধু, প্রতিবেশী" className="input-field" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Step 4 — নিশ্চিত করুন ── */}
      {step === 4 && (
        <div className="space-y-4">

          {/* Summary */}
          <div className="card space-y-2">
            <h2 className="font-semibold text-gray-800 border-b pb-2 mb-3">আবেদনের সারসংক্ষেপ</h2>
            {[
              { label: 'নাম',                value: user?.name },
              { label: 'পিতার নাম',          value: form.fatherName },
              { label: 'পেশা',               value: form.profession },
              { label: 'মাসিক আয়',          value: `৳${Number(form.income).toLocaleString()}` },
              { label: 'ঋণের পরিমাণ',        value: `৳${Number(form.amount).toLocaleString()}` },
              { label: 'মেয়াদ',             value: form.duration },
              { label: 'উদ্দেশ্য',           value: form.purpose === 'অন্যান্য' && form.purposeOther ? `অন্যান্য: ${form.purposeOther}` : form.purpose },
              { label: `${form.installmentType} কিস্তি`, value: `৳${Number(form.installmentAmt).toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800 text-right max-w-[55%]">{value}</span>
              </div>
            ))}
          </div>

          {/* Guarantors */}
          <div className="card space-y-2">
            <h3 className="font-semibold text-gray-800 mb-2">জামিনদারগণ</h3>
            {guarantors.map((g, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-800">{g.name} — {g.relation}</p>
                <p className="text-xs text-gray-500 mt-0.5">{g.phone}</p>
              </div>
            ))}
          </div>

          {/* Declaration */}
          <div className="card">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">ঘোষণা</p>
              <ul className="space-y-1.5">
                {[
                  'আমি সত্য তথ্য প্রদান করেছি।',
                  'আমি সময়মতো ঋণ পরিশোধের চেষ্টা করবো।',
                  'এই অর্থ কোনো হারাম বা অপ্রয়োজনীয় কাজে ব্যবহার করবো না।',
                  'এই ঋণ সম্পূর্ণ সুদমুক্ত এবং আমি অতিরিক্ত কোনো অর্থ প্রদান করবো না।',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                    <Check size={13} className="shrink-0 mt-0.5 text-amber-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-3 italic border-t border-amber-200 pt-2">
                রাসূল ﷺ বলেছেন: যে ব্যক্তি পরিশোধের নিয়তে ঋণ নেয়, আল্লাহ তা আদায়ের ব্যবস্থা করেন। (সহীহ বুখারী: ২৩৮৭)
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pledged}
                onChange={(e) => setPledged(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-700 mt-0.5"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                আমি উপরের সকল ঘোষণার সাথে একমত এবং সকল তথ্য সঠিক বলে নিশ্চিত করছি।
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
          ) : step === 4 ? (
            <><Check size={18} /> আবেদন জমা দিন</>
          ) : (
            <>পরবর্তী <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}
