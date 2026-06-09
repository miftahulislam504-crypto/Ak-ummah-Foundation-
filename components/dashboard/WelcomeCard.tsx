'use client';

import { getBanglaDate, getHijriDate } from '@/lib/utils';
import { User } from '@/lib/types';

interface Props { user: User | null; }

export default function WelcomeCard({ user }: Props) {
  const banglaDate = getBanglaDate();
  const hijriDate  = getHijriDate();

  return (
    <div className="relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 rounded-3xl p-5 overflow-hidden shadow-lg">

      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
      <div className="absolute top-4 right-8 text-4xl opacity-10 font-arabic">هلال</div>

      {/* Bismillah */}
      <p className="font-arabic text-right text-white/80 text-lg mb-3 leading-relaxed">
        بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
      </p>

      {/* Greeting */}
      <p className="text-primary-200 text-sm mb-0.5">আসসালামু আলাইকুম,</p>
      <h2 className="text-white text-xl font-bold mb-3">
        মো: {user?.name || 'সদস্য'}
      </h2>

      {/* Date badge */}
      <div className="inline-flex flex-col bg-black/20 backdrop-blur-sm rounded-2xl px-4 py-2.5">
        <span className="text-white font-semibold text-sm">{banglaDate}</span>
        <span className="text-primary-300 text-xs mt-0.5">{hijriDate}</span>
      </div>

    </div>
  );
}
