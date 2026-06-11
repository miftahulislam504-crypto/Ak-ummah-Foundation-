'use client';

import { useAuth } from '@/hooks/useAuth';
import { toBn, getBanglaDate } from '@/lib/utils';
import { LogOut, Copy, Check, Phone, MapPin, Briefcase, Users, Hash, Camera, Pencil, X, Save } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth(true);
  const { setUser } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    phone:       '',
    address:     '',
    profession:  '',
    familyCount: '',
  });

  if (loading) return <LoadingScreen />;
  if (!user)   return null;

  function copyRefCode() {
    navigator.clipboard.writeText(user!.refCode).then(() => {
      setCopied(true);
      toast.success('রেফারেল কোড কপি হয়েছে');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function startEdit() {
    setForm({
      phone:       user!.phone       || '',
      address:     user!.address     || '',
      profession:  user!.profession  || '',
      familyCount: String(user!.familyCount || ''),
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!form.phone.trim())      { toast.error('মোবাইল নম্বর দিন'); return; }
    if (!form.address.trim())    { toast.error('ঠিকানা দিন'); return; }
    if (!form.profession.trim()) { toast.error('পেশা দিন'); return; }

    setSaving(true);
    try {
      const updates = {
        phone:       form.phone.trim(),
        address:     form.address.trim(),
        profession:  form.profession.trim(),
        familyCount: parseInt(form.familyCount) || user!.familyCount,
        updatedAt:   new Date().toISOString(),
      };
      await updateDoc(doc(db, 'users', user!.uid), updates);
      setUser({ ...user!, ...updates });
      setEditing(false);
      toast.success('তথ্য আপডেট হয়েছে');
    } catch {
      toast.error('আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('ছবি ৫ MB-র বেশি হওয়া যাবে না'); return; }

    setImgLoading(true);
    try {
      // Canvas দিয়ে compress করে Base64
      const base64 = await compressImage(file, 300, 0.75);
      await updateDoc(doc(db, 'users', user!.uid), {
        photoUrl:  base64,
        updatedAt: new Date().toISOString(),
      });
      setUser({ ...user!, photoUrl: base64 } as typeof user & { photoUrl: string });
      toast.success('ছবি আপডেট হয়েছে');
    } catch {
      toast.error('ছবি আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setImgLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
        else if (h > maxSize)     { w = (w * maxSize) / h; h = maxSize; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // photoUrl is stored as extra field, type-cast safely
  const photoUrl = (user as unknown as Record<string, string>).photoUrl || '';

  const statusMap: Record<string, { label: string; cls: string }> = {
    active:    { label: 'সক্রিয়',        cls: 'badge-active'   },
    pending:   { label: 'অনুমোদন বাকি', cls: 'badge-pending'  },
    suspended: { label: 'স্থগিত',        cls: 'badge-rejected' },
  };

  const fields = [
    { icon: Phone,     label: 'মোবাইল',          value: user.phone,      key: 'phone' },
    { icon: MapPin,    label: 'ঠিকানা',           value: user.address,    key: 'address' },
    { icon: Briefcase, label: 'পেশা',             value: user.profession, key: 'profession' },
    { icon: Users,     label: 'পারিবারিক সদস্য', value: `${toBn(user.familyCount)} জন`, key: 'familyCount' },
    { icon: Hash,      label: 'NID নম্বর',        value: user.nidNumber,  key: 'nid' },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

      {/* Profile card */}
      <div className="card-green text-center py-7 relative">
        {/* Photo */}
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold text-white overflow-hidden">
            {photoUrl
              ? <img src={photoUrl} alt="profile" className="w-full h-full object-cover" />
              : user.name.charAt(0).toUpperCase()
            }
          </div>
          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={imgLoading}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100"
          >
            {imgLoading
              ? <div className="w-3.5 h-3.5 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin" />
              : <Camera size={13} className="text-primary-700" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <h2 className="text-white text-xl font-bold">{user.name}</h2>
        <p className="text-primary-300 text-sm mt-1">{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className={statusMap[user.status]?.cls}>{statusMap[user.status]?.label}</span>
          <span className="text-primary-300 text-xs">সদস্য</span>
        </div>

        {/* Edit button */}
        <button
          onClick={editing ? () => setEditing(false) : startEdit}
          className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white"
        >
          {editing ? <X size={15} /> : <Pencil size={15} />}
        </button>
      </div>

      {/* Referral code */}
      <div className="card">
        <p className="text-xs text-gray-500 mb-2">আপনার রেফারেল কোড</p>
        <div className="flex items-center justify-between bg-primary-50 rounded-xl px-4 py-3 border border-primary-100">
          <span className="text-primary-800 font-bold text-lg tracking-widest">{user.refCode}</span>
          <button onClick={copyRefCode} className="w-8 h-8 bg-primary-700 text-white rounded-lg flex items-center justify-center transition-all active:scale-90">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">বন্ধুকে এই কোড দিলে সে নিবন্ধন করতে পারবে</p>
      </div>

      {/* Info fields — view or edit */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">ব্যক্তিগত তথ্য</h3>
          {!editing && (
            <button onClick={startEdit} className="flex items-center gap-1 text-xs text-primary-700 font-medium">
              <Pencil size={12} /> এডিট
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">মোবাইল</label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ঠিকানা</label>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="আপনার ঠিকানা"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">পেশা</label>
              <input
                value={form.profession}
                onChange={e => setForm({ ...form, profession: e.target.value })}
                placeholder="পেশা"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">পারিবারিক সদস্য সংখ্যা</label>
              <input
                type="number"
                value={form.familyCount}
                onChange={e => setForm({ ...form, familyCount: e.target.value })}
                placeholder="৬"
                className="input-field"
                min="1"
              />
            </div>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {saving
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={16} /> সংরক্ষণ করুন</>
              }
            </button>
          </div>
        ) : (
          fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Member since */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">সদস্যপদ শুরু</p>
          <p className="text-sm font-medium text-gray-700 mt-0.5">
            {getBanglaDate(new Date(user.createdAt))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">সদস্য আইডি</p>
          <p className="text-sm font-mono font-medium text-gray-700 mt-0.5">{user.refCode}</p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors active:scale-95"
      >
        <LogOut size={18} />
        লগআউট করুন
      </button>

    </div>
  );
}
