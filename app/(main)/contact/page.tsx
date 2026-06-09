'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Send, Phone, Mail, MapPin, MessageSquare, CheckCircle } from 'lucide-react';

const SUBJECTS = [
  'সাধারণ জিজ্ঞাসা',
  'ঋণ সংক্রান্ত',
  'দান সংক্রান্ত',
  'সদস্যপদ',
  'অভিযোগ',
  'অন্যান্য',
];

export default function ContactPage() {
  const { user }  = useAuthStore();
  const [loading, setLoading]  = useState(false);
  const [sent,    setSent]     = useState(false);

  const [form, setForm] = useState({
    name:    user?.name    || '',
    phone:   user?.phone   || '',
    email:   user?.email   || '',
    subject: SUBJECTS[0],
    message: '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message.trim()) { toast.error('বার্তা লিখুন'); return; }
    if (!form.name.trim())    { toast.error('নাম দিন'); return; }

    setLoading(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        ...form,
        userId:    user?.uid  || null,
        createdAt: new Date().toISOString(),
        status:    'unread',
      });
      setSent(true);
    } catch {
      toast.error('পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5">
        <div className="card text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">বার্তা পাঠানো হয়েছে!</h2>
          <p className="text-gray-500 text-sm mb-6">
            আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
          </p>
          <button onClick={() => setSent(false)} className="btn-outline px-8">
            আবার পাঠান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">যোগাযোগ করুন</h1>
        <p className="text-sm text-gray-400 mt-0.5">আমরা সাহায্য করতে প্রস্তুত</p>
      </div>

      {/* Contact info cards */}
      <div className="grid grid-cols-1 gap-3">
        {[
          { icon: Phone,   label: 'ফোন',    value: '01872839294',                         color: 'bg-green-100 text-green-700', href: 'tel:+8801872839294' },
          { icon: Mail,    label: 'ইমেইল',  value: 'akummahfoundation@gmail.com',          color: 'bg-blue-100  text-blue-700',  href: 'mailto:akummahfoundation@gmail.com' },
          { icon: MapPin,  label: 'ঠিকানা', value: 'পঞ্চক্রোশী, উল্লাপাড়া, সিরাজগঞ্জ', color: 'bg-red-100   text-red-600',   href: null },
        ].map(({ icon: Icon, label, value, color, href }) => (
          <div key={label} className="card flex items-center gap-3 py-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              {href ? (
                <a href={href} className="text-sm font-medium text-gray-800 hover:text-primary-700">{value}</a>
              ) : (
                <p className="text-sm font-medium text-gray-800">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <MessageSquare size={16} className="text-primary-700" />
          </div>
          <h2 className="font-semibold text-gray-800">বার্তা পাঠান</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">নাম *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="আপনার নাম"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">ফোন</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">ইমেইল</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">বিষয়</label>
            <select name="subject" value={form.subject} onChange={handleChange} className="input-field">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">বার্তা *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="আপনার বার্তা লিখুন..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Send size={16} /> বার্তা পাঠান</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
