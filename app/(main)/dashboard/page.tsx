'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { getBanglaDate, getHijriDate, toBn, formatTaka } from '@/lib/utils';
import { Donation, Loan, Notice } from '@/lib/types';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import StatsCard from '@/components/dashboard/StatsCard';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const [donations,     setDonations]     = useState<Donation[]>([]);
  const [loans,         setLoans]         = useState<Loan[]>([]);
  const [notices,       setNotices]       = useState<Notice[]>([]);

  // Member's own donations
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'donations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
    });
    return () => unsub();
  }, [user]);

  // Member's own loans
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'loans'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Loan)));
    });
    return () => unsub();
  }, [user]);

  // Notices
  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(3));
    const unsub = onSnapshot(q, (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice)));
    });
    return () => unsub();
  }, []);

  // Computed member stats
  const totalDonated   = donations.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0);
  const activeLoans    = loans.filter(l => l.status === 'approved').length;
  const pendingLoans   = loans.filter(l => l.status === 'pending').length;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Welcome + Date */}
      <WelcomeCard user={user} />

      {/* Member quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatsCard label="মোট দান"    value={formatTaka(totalDonated)} color="green" />
        <StatsCard label="সক্রিয় ঋণ"  value={toBn(activeLoans)}        color="blue"  />
        <StatsCard label="ঋণ আবেদন"   value={toBn(pendingLoans)}       color="gold"  />
      </div>

      {/* Quick action buttons */}
      <QuickActions />

      {/* Notice board */}
      {notices.length > 0 && <NoticeBoard notices={notices} />}

      {/* Recent activity */}
      <RecentActivity donations={donations} loans={loans} />

    </div>
  );
}
