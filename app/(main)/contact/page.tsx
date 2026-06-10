'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Send, Phone, Mail, MapPin, MessageSquare, CheckCircle } from 'lucide-react';

// Social media SVG icons
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}
function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

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

      {/* Social media links */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">আমাদের সোশ্যাল মিডিয়া</h3>
        <div className="grid grid-cols-4 gap-3">
          <a
            href="https://www.facebook.com/share/18nGSkzVPm/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all active:scale-95"
          >
            <FacebookIcon />
            <span className="text-xs font-medium">Facebook</span>
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-600 transition-all active:scale-95"
          >
            <InstagramIcon />
            <span className="text-xs font-medium">Instagram</span>
          </a>
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 transition-all active:scale-95"
          >
            <YouTubeIcon />
            <span className="text-xs font-medium">YouTube</span>
          </a>
          <a
            href="mailto:akummahfoundation@gmail.com"
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-green-50 hover:bg-green-100 text-green-700 transition-all active:scale-95"
          >
            <EmailIcon />
            <span className="text-xs font-medium">Email</span>
          </a>
        </div>
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
