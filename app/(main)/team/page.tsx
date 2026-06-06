'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Phone, Mail, Linkedin } from 'lucide-react';

interface TeamMember {
  id:         string;
  name:       string;
  role:       string;
  bio?:       string;
  phone?:     string;
  email?:     string;
  linkedin?:  string;
  imageUrl?:  string;
  order:      number;
}

export default function TeamPage() {
  const [team,    setTeam]    = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'team'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setTeam(snap.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">আমাদের টিম</h1>
        <p className="text-sm text-gray-400 mt-0.5">ফাউন্ডেশনের পরিচালনা পর্ষদ</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="card h-48 animate-pulse" />)}
        </div>
      ) : team.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-gray-400">কোনো টিম সদস্য নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {team.map(member => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ member: m }: { member: TeamMember }) {
  return (
    <div className="card text-center p-4 hover:shadow-md transition-shadow">

      {/* Avatar */}
      <div className="mx-auto mb-3">
        {m.imageUrl ? (
          <img
            src={m.imageUrl}
            alt={m.name}
            className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-primary-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-primary-700 flex items-center justify-center mx-auto">
            <span className="text-white text-2xl font-bold">
              {m.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{m.name}</h3>
      <p className="text-xs text-primary-600 font-medium mt-0.5">{m.role}</p>

      {m.bio && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{m.bio}</p>
      )}

      {/* Contact icons */}
      {(m.phone || m.email || m.linkedin) && (
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-50">
          {m.phone && (
            <a href={`tel:${m.phone}`} className="w-7 h-7 bg-green-100 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-200 transition-colors">
              <Phone size={13} />
            </a>
          )}
          {m.email && (
            <a href={`mailto:${m.email}`} className="w-7 h-7 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors">
              <Mail size={13} />
            </a>
          )}
          {m.linkedin && (
            <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="w-7 h-7 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center hover:bg-sky-200 transition-colors">
              <Linkedin size={13} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
