'use client';

import { useAuth } from '@/hooks/useAuth';
import { toBn, getBanglaDate } from '@/lib/utils';
import { LogOut, Copy, Check, User, Phone, MapPin, Briefcase, Users, Hash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth(true);
  const [copied, setCopied] = useState(false);

  if (loading) return <LoadingScreen />;
  if (!user)   return null;

  function copyRefCode() {
    navigator.clipboard.writeText(user!.refCode).then(() => {
      setCopied(true);
      toast.success('রেফারেল কোড কপি হয়েছে');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const fields = [
    { icon: Phone,    label: 'মোবাইল',          value: user.phone      },
    { icon: MapPin,   label: 'ঠিকানা',           value: user.address    },
    { icon: Briefcase,label: 'পেশা',             value: user.profession },
    { icon: Users,    label: 'পারিবারিক সদস্য', value: `${toBn(user.familyCount)} জন` },
    { icon: Hash,     label: 'NID নম্বর',        value: user.nidNumber  },
  ];

  const statusMap: Record<string, { label: string; cls: string }> = {
    active:    { label: 'সক্রিয়',         cls: 'badge-active'   },
    pending:   { label: 'অনুমোদন বাকি',  cls: 'badge-pending'  },
    suspended: { label: 'স্থগিত',         cls: 'badge-rejected' },
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

      {/* Profile card */}
      <div className="card-green text-center py-7">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-white text-xl font-bold">মো: {user.name}</h2>
        <p className="text-primary-300 text-sm mt-1">{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className={statusMap[user.status]?.cls}>{statusMap[user.status]?.label}</span>
          <span className="text-primary-300 text-xs">সদস্য</span>
        </div>
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

      {/* Info fields */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800">ব্যক্তিগত তথ্য</h3>
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={15} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
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
