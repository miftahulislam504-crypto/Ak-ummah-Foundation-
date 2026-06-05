'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const CONTENT = [
  {
    quran: {
      arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      bangla: 'নিশ্চয়ই কষ্টের সাথে স্বস্তি আছে।',
      ref:    'সূরা আল-ইনশিরাহ: ৬',
    },
    hadith: {
      arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
      bangla: 'মুসলিম সে-ই, যার জিহ্বা ও হাত থেকে অন্য মুসলিমরা নিরাপদ।',
      ref:    'বুখারী: ১০',
    },
  },
  {
    quran: {
      arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
      bangla: 'যে আল্লাহকে ভয় করে, তিনি তার জন্য পথ বের করে দেন।',
      ref:    'সূরা আত-তালাক: ২',
    },
    hadith: {
      arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
      bangla: 'কাজের প্রতিফল নিয়তের উপর নির্ভরশীল।',
      ref:    'বুখারী: ১',
    },
  },
  {
    quran: {
      arabic: 'وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ',
      bangla: 'ধৈর্য ও নামাজের মাধ্যমে সাহায্য চাও।',
      ref:    'সূরা আল-বাকারাহ: ৪৫',
    },
    hadith: {
      arabic: 'الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ',
      bangla: 'দুনিয়া মুমিনের জন্য কারাগার এবং কাফেরের জন্য জান্নাত।',
      ref:    'মুসলিম: ২৯৫৬',
    },
  },
  {
    quran: {
      arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
      bangla: 'নিশ্চয়ই কষ্টের সাথে সহজ আছে।',
      ref:    'সূরা আল-ইনশিরাহ: ৫',
    },
    hadith: {
      arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
      bangla: 'যে আল্লাহ ও পরকালে বিশ্বাস করে, সে যেন ভালো কথা বলে অথবা চুপ থাকে।',
      ref:    'বুখারী: ৬০১৮',
    },
  },
  {
    quran: {
      arabic: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',
      bangla: 'তোমরা যেখানেই থাকো, তিনি তোমাদের সাথে আছেন।',
      ref:    'সূরা আল-হাদীদ: ৪',
    },
    hadith: {
      arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
      bangla: 'তোমাদের মধ্যে সেই উত্তম যে কুরআন শেখে এবং শেখায়।',
      ref:    'বুখারী: ৫০২৭',
    },
  },
  {
    quran: {
      arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
      bangla: 'নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।',
      ref:    'সূরা আল-বাকারাহ: ১৫৩',
    },
    hadith: {
      arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
      bangla: 'তোমাদের কেউ প্রকৃত মুমিন হবে না যতক্ষণ সে তার ভাইয়ের জন্য তাই পছন্দ না করে যা নিজের জন্য করে।',
      ref:    'বুখারী: ১৩',
    },
  },
  {
    quran: {
      arabic: 'وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَىٰ بِاللَّهِ وَكِيلًا',
      bangla: 'আল্লাহর উপর ভরসা করো, আল্লাহই কার্যনির্বাহী হিসেবে যথেষ্ট।',
      ref:    'সূরা আল-আহযাব: ৩',
    },
    hadith: {
      arabic: 'اتَّقِ اللهَ حَيْثُمَا كُنْتَ',
      bangla: 'তুমি যেখানেই থাকো আল্লাহকে ভয় করো।',
      ref:    'তিরমিযী: ১৯৮৭',
    },
  },
];

export default function QuranHadith() {
  const dayIndex = new Date().getDay() % CONTENT.length;
  const content  = CONTENT[dayIndex];
  const [activeTab, setActiveTab] = useState<'quran' | 'hadith'>('quran');

  const data = activeTab === 'quran' ? content.quran : content.hadith;

  return (
    <div className="space-y-4">

      {/* Sub tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {(['quran', 'hadith'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
              activeTab === t ? 'bg-white text-primary-700 shadow-sm font-semibold' : 'text-gray-500'
            )}
          >
            {t === 'quran' ? 'আজকের আয়াত' : 'আজকের হাদিস'}
          </button>
        ))}
      </div>

      {/* Content card */}
      <div className="card space-y-5">
        {/* Arabic */}
        <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100">
          <p className="font-arabic text-right text-2xl leading-loose text-primary-900">
            {data.arabic}
          </p>
        </div>

        {/* Bengali translation */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">বাংলা অনুবাদ</p>
          <p className="text-gray-800 text-base leading-relaxed font-medium">{data.bangla}</p>
        </div>

        {/* Reference */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
          <p className="text-sm text-primary-700 font-semibold">{data.ref}</p>
        </div>
      </div>

      {/* Daily reminder */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-700 rounded-2xl p-5 text-center">
        <p className="font-arabic text-white text-xl mb-2">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        <p className="text-primary-200 text-sm">প্রতিদিন নতুন আয়াত ও হাদিস পড়ুন</p>
      </div>
    </div>
  );
}
