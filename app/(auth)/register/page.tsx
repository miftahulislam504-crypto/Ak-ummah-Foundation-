'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const STEPS = ['ব্যক্তিগত তথ্য', 'যোগাযোগ', 'সম্পন্ন'];

export default function RegisterPage() {
  const router = useRouter();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name:        '',
    email:       '',
    password:    '',
    confirmPass: '',
    phone:       '',
    address:     '',
    profession:  '',
    familyCount: '1',
    referredBy:  '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!form.name.trim())        { toast.error('নাম দিন'); return false; }
      if (!form.email.trim())       { toast.error('ইমেইল দিন'); return false; }
      if (form.password.length < 6) { toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে'); return false; }
      if (form.password !== form.confirmPass) { toast.error('পাসওয়ার্ড মিলছে না'); return false; }
    }
    if (step === 1) {
      if (!form.phone.trim())      { toast.error('ফোন নম্বর দিন'); return false; }
      if (!form.address.trim())    { toast.error('ঠিকানা দিন'); return false; }
      if (!form.profession.trim()) { toast.error('পেশা দিন'); return false; }
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    let authCreated = false;

    try {
      // ১. Referral চেক
      let referralValid = false;
      if (form.referredBy) {
        const q    = query(collection(db, 'users'), where('refCode', '==', form.referredBy.toUpperCase()));
        const snap = await getDocs(q);
        referralValid = !snap.empty;
        if (!referralValid) {
          toast.error('রেফারেল কোড সঠিক নয়');
          setLoading(false);
          return;
        }
      }

      // ২. Firebase Auth এ user তৈরি
      toast.loading('অ্যাকাউন্ট তৈরি হচ্ছে...', { id: 'reg' });
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      authCreated = true;
      await sendEmailVerification(cred.user);
      const uid = cred.user.uid;

      // ৩. Firestore এ save
      toast.loading('তথ্য সংরক্ষণ হচ্ছে...', { id: 'reg' });
      const refCode = generateId('EU');
      const now     = new Date().toISOString();

      await setDoc(doc(db, 'users', uid), {
        uid,
        name:        form.name.trim(),
        email:       form.email.trim().toLowerCase(),
        phone:       form.phone.trim(),
        address:     form.address.trim(),
        profession:  form.profession.trim(),
        familyCount: parseInt(form.familyCount),
        refCode,
        referredBy:  form.referredBy.toUpperCase() || null,
        role:        'member',
        status:      'active',
        createdAt:   now,
        updatedAt:   now,
      });

      // ৪. Referral record
      if (referralValid && form.referredBy) {
        await setDoc(doc(collection(db, 'referrals')), {
          referredBy:    form.referredBy.toUpperCase(),
          newMember:     uid,
          newMemberName: form.name.trim(),
          createdAt:     now,
        });
      }

      toast.success('নিবন্ধন সম্পন্ন!', { id: 'reg' });
      setStep(2);

    } catch (err: any) {
      toast.dismiss('reg');

      if (authCreated && auth.currentUser) {
        try { await auth.currentUser.delete(); } catch (_) {}
      }

      if (err.code === 'auth/email-already-in-use') {
        toast.error('এই ইমেইলে আগেই অ্যাকাউন্ট আছে');
      } else {
        toast.error('নিবন্ধন ব্যর্থ: ' + (err.message || 'আবার চেষ্টা করুন'));
      }
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!validateStep()) return;
    if (step === 1) { handleSubmit(); return; }
    setStep(step + 1);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">

      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-400 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <Image
              src="/logo.png"
              alt="AK Ummah Foundation"
              width={130}
              height={130}
              className="drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-white">সদস্য নিবন্ধন</h1>
        </div>

        {/* Step indicator */}
        {step < 2 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.slice(0, 2).map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step  ? 'bg-gold-500 text-white' :
                    i === step ? 'bg-white text-primary-800' :
                                 'bg-primary-700/50 text-primary-300'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-gold-500' : 'bg-primary-700/50'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-7">

          {/* Step 0 — ব্যক্তিগত তথ্য */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">ব্যক্তিগত তথ্য</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পূর্ণ নাম *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="আপনার পূর্ণ নাম" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@gmail.com" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="কমপক্ষে ৬ অক্ষর" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input name="confirmPass" type="password" value={form.confirmPass} onChange={handleChange} placeholder="পাসওয়ার্ড আবার দিন" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পারিবারিক সদস্য সংখ্যা</label>
                <select name="familyCount" value={form.familyCount} onChange={handleChange} className="input-field">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} জন</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 1 — যোগাযোগ */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">যোগাযোগের তথ্য</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">মোবাইল নম্বর *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">বর্তমান ঠিকানা *</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="গ্রাম/মহল্লা, উপজেলা, জেলা" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পেশা *</label>
                <input name="profession" value={form.profession} onChange={handleChange} placeholder="যেমন: কৃষক, ব্যবসায়ী, চাকরিজীবী" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">রেফারেল কোড (ঐচ্ছিক)</label>
                <input name="referredBy" value={form.referredBy} onChange={handleChange} placeholder="EU-XXXXXX" className="input-field uppercase" />
              </div>
            </div>
          )}

          {/* Step 2 — Success */}
          {step === 2 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">নিবন্ধন সম্পন্ন!</h2>
              <p className="text-gray-500 text-sm mb-2">আপনার আবেদন সফলভাবে জমা হয়েছে।</p>
              <p className="text-gray-500 text-sm mb-6">অ্যাডমিন অনুমোদনের পর আপনি লগইন করতে পারবেন।</p>
              <button onClick={() => router.push('/login')} className="btn-primary w-full">
                লগইন পেজে যান
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 2 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-outline flex items-center gap-1 px-4">
                  <ChevronLeft size={18} /> পিছনে
                </button>
              )}
              <button onClick={next} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : step === 1 ? (
                  <><Check size={18} /> জমা দিন</>
                ) : (
                  <>পরবর্তী <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          )}

          {step === 0 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              আগে থেকে অ্যাকাউন্ট আছে?{' '}
              <Link href="/login" className="text-primary-700 font-semibold hover:underline">লগইন করুন</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
