'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, updateDoc, doc, writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { Notification } from '@/lib/types';

export function useNotifications() {
  const { user }  = useAuthStore();
  const [notifs,       setNotifs]       = useState<Notification[]>([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifs(list);
      setUnreadCount(list.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  async function markRead(id: string) {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
  }

  return { notifs, unreadCount, loading, markRead, markAllRead };
}
