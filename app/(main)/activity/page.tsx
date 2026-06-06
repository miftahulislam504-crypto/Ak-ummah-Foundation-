'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getBanglaDate, getRelativeTime } from '@/lib/utils';
import { Calendar, MapPin, Users } from 'lucide-react';

interface Activity {
  id:          string;
  title:       string;
  description: string;
  date:        string;
  location:    string;
  imageUrl?:   string;
  attendees?:  number;
  createdAt:   string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const upcoming = activities.filter(a => new Date(a.date) >= new Date());
  const past     = activities.filter(a => new Date(a.date) <  new Date());

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">কার্যক্রম</h1>
        <p className="text-sm text-gray-400 mt-0.5">ফাউন্ডেশনের সকল কার্যক্রম</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} className="text-primary-300" />
          </div>
          <p className="text-gray-400">কোনো কার্যক্রম নেই</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-primary-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                আসন্ন কার্যক্রম ({upcoming.length}টি)
              </h2>
              {upcoming.map(a => <ActivityCard key={a.id} activity={a} isUpcoming />)}
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 mt-4">
                অতীত কার্যক্রম ({past.length}টি)
              </h2>
              {past.map(a => <ActivityCard key={a.id} activity={a} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ActivityCard({ activity: a, isUpcoming }: { activity: Activity; isUpcoming?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card overflow-hidden transition-all ${isUpcoming ? 'border-l-4 border-l-primary-500' : ''}`}>

      {/* Image */}
      {a.imageUrl && (
        <div className="-mx-5 -mt-5 mb-4">
          <img
            src={a.imageUrl}
            alt={a.title}
            className="w-full h-40 object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">{a.title}</h3>
          {isUpcoming && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium shrink-0">
              আসন্ন
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={13} className="text-primary-500" />
            <span>{getBanglaDate(new Date(a.date))}</span>
          </div>
          {a.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={13} className="text-red-400" />
              <span>{a.location}</span>
            </div>
          )}
          {a.attendees && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users size={13} className="text-blue-400" />
              <span>{a.attendees} জন অংশগ্রহণকারী</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className={`text-sm text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {a.description}
        </p>
        {a.description?.length > 100 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary-600 font-medium hover:underline"
          >
            {expanded ? 'কম দেখুন' : 'আরও দেখুন'}
          </button>
        )}

        <p className="text-xs text-gray-300 pt-1">{getRelativeTime(a.createdAt)}</p>
      </div>
    </div>
  );
}
