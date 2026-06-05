'use client';

import { useState } from 'react';
import PrayerTimes from '@/components/islamic/PrayerTimes';
import QuranHadith from '@/components/islamic/QuranHadith';
import ZakatCalc   from '@/components/islamic/ZakatCalc';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'prayer', label: 'নামাজ'  },
  { key: 'quran',  label: 'কুরআন'  },
  { key: 'zakat',  label: 'যাকাত' },
];

export default function IslamicPage() {
  const [tab, setTab] = useState('prayer');

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">ইসলামিক সেবা</h1>
        <p className="text-sm text-gray-400 mt-0.5">নামাজের সময়, কুরআন ও যাকাত</p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
              tab === key
                ? 'bg-white text-primary-700 shadow-sm font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'prayer' && <PrayerTimes />}
      {tab === 'quran'  && <QuranHadith />}
      {tab === 'zakat'  && <ZakatCalc />}
    </div>
  );
}
