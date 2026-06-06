'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';
import { Upload, X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

// ─── Cloudinary config ───────────────────────────────────────────────────────
const CLOUD_NAME   = 'dat7lfp1l';
const UPLOAD_PRESET = 'ek-ummah-nid';

async function uploadToCloudinary(file: File, side: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'ek-ummah-nid');
  formData.append('public_id', `${side}_${Date.now()}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }

  const data = await res.json();
  if (!data.secure_url) throw new Error('URL পাওয়া যায়নি');
  return data.secure_url;
}
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ['ব্যক্তিগত তথ্য', 'যোগাযোগ', 'NID যাচাই', 'সম্পন্ন'];

export default function RegisterPage() {
  const router = useRouter();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);

  const nidFrontRef = useRef<HTMLInputElement>(null);
  const nidBackRef  = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name:        '',
    email:       '',
    password:    '',
    confirmPass: '',
    phone:       '',
    address:     '',
    profession:  '',
    nidNumber:   '',
    familyCount: '1',
    referredBy:  '',
  });

  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack,  setNidBack]  = useState<File | null>(null);
  const [nidFrontPreview, setNidFrontPreview] = useState('');
  const [nidBackPreview,  setNidBackPreview]  = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ ৫MB এর বেশি হবে না');
      return;
    }
    const url = URL.createObjectURL(file);
    if (side === 'front') { setNidFront(file); setNidFrontPreview(url); }
    else                  { setNidBack(file);  setNidBackPreview(url); }
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
    if (step === 2) {
      if (!form.nidNumber.trim()) { toast.error('NID নম্বর দিন'); return false; }
      if (!nidFront)              { toast.error('NID-এর সামনের ছবি দিন'); return false; }
      if (!nidBack)               { toast.error('NID-এর পিছনের ছবি দিন'); return false; }
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

      // ৩. Cloudinary তে NID ছবি upload
      toast.loading('NID ছবি আপলোড হচ্ছে...', { id: 'reg' });
      const [frontUrl, backUrl] = await Promise.all([
        uploadToCloudinary(nidFront!, `${uid}_front`),
        uploadToCloudinary(nidBack!,  `${uid}_back`),
      ]);

      // ৪. Firestore এ save
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
        nidNumber:   form.nidNumber.trim(),
        nidFrontUrl: frontUrl,
        nidBackUrl:  backUrl,
        familyCount: parseInt(form.familyCount),
        refCode,
        referredBy:  form.referredBy.toUpperCase() || null,
        role:        'member',
        status:      'pending',
        createdAt:   now,
        updatedAt:   now,
      });

      // ৫. Referral record
      if (referralValid && form.referredBy) {
        await setDoc(doc(collection(db, 'referrals')), {
          referredBy:    form.referredBy.toUpperCase(),
          newMember:     uid,
          newMemberName: form.name.trim(),
          createdAt:     now,
        });
      }

      toast.success('নিবন্ধন সম্পন্ন!', { id: 'reg' });
      setStep(3);

    } catch (err: any) {
      toast.dismiss('reg');

      // Auth তৈরি হলে কিন্তু পরে fail হলে — delete করো
      // যাতে একই email দিয়ে আবার register করা যায়
      if (authCreated && auth.currentUser) {
        try { await auth.currentUser.delete(); } catch (_) {}
      }

      if (err.code === 'auth/email-already-in-use') {
        toast.error('এই ইমেইলে আগেই অ্যাকাউন্ট আছে');
      } else if (err.message?.includes('Cloudinary') || err.message?.includes('upload')) {
        toast.error('NID ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন');
      } else {
        toast.error('নিবন্ধন ব্যর্থ: ' + (err.message || 'আবার চেষ্টা করুন'));
      }
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!validateStep()) return;
    if (step === 2) { handleSubmit(); return; }
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 rounded-2xl mb-3 shadow-xl">
            <span className="text-2xl font-bold text-white font-arabic">ع</span>
          </div>
          <h1 className="text-xl font-bold text-white">সদস্য নিবন্ধন</h1>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step  ? 'bg-gold-500 text-white' :
                    i === step ? 'bg-white text-primary-800' :
                                 'bg-primary-700/50 text-primary-300'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 ${i < step ? 'bg-gold-500' : 'bg-primary-700/50'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-7">

          {/* Step 0 — Personal info */}
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

          {/* Step 1 — Contact */}
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

          {/* Step 2 — NID */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">NID যাচাই</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">জাতীয় পরিচয়পত্র নম্বর *</label>
                <input name="nidNumber" value={form.nidNumber} onChange={handleChange} placeholder="NID নম্বর দিন" className="input-field" />
              </div>

              {/* NID Front */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">NID সামনের অংশ *</label>
                <input ref={nidFrontRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'front')} />
                {nidFrontPreview ? (
                  <div className="relative">
                    <img src={nidFrontPreview} alt="NID Front" className="w-full h-36 object-cover rounded-xl border-2 border-primary-200" />
                    <button onClick={() => { setNidFront(null); setNidFrontPreview(''); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => nidFrontRef.current?.click()} className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
                    <Upload size={24} />
                    <span className="text-sm">ক্লিক করে ছবি যোগ করুন</span>
                  </button>
                )}
              </div>

              {/* NID Back */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">NID পিছনের অংশ *</label>
                <input ref={nidBackRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'back')} />
                {nidBackPreview ? (
                  <div className="relative">
                    <img src={nidBackPreview} alt="NID Back" className="w-full h-36 object-cover rounded-xl border-2 border-primary-200" />
                    <button onClick={() => { setNidBack(null); setNidBackPreview(''); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => nidBackRef.current?.click()} className="w-full h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
                    <Upload size={24} />
                    <span className="text-sm">ক্লিক করে ছবি যোগ করুন</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-400 text-center">
                ছবি সর্বোচ্চ ৫MB • JPG / PNG
              </p>
            </div>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">নিবন্ধন সম্পন্ন!</h2>
              <p className="text-gray-500 text-sm mb-2">
                আপনার আবেদন সফলভাবে জমা হয়েছে।
              </p>
              <p className="text-gray-500 text-sm mb-6">
                অ্যাডমিন অনুমোদনের পর আপনি লগইন করতে পারবেন।
              </p>
              <button onClick={() => router.push('/login')} className="btn-primary w-full">
                লগইন পেজে যান
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 3 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-outline flex items-center gap-1 px-4">
                  <ChevronLeft size={18} /> পিছনে
                </button>
              )}
              <button onClick={next} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : step === 2 ? (
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
