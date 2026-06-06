import Link from 'next/link';
import { Users, Target, Eye, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

      {/* Hero */}
      <div className="card-green text-center py-8">
        <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl font-bold text-white font-arabic">ع</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-1">এক উম্মাহ ফাউন্ডেশন</h1>
        <p className="text-primary-200 text-sm">سُدْمُكْتَ সহায়তা, বিশ্বাসের বন্ধন</p>
        <p className="font-arabic text-white/70 text-lg mt-3">
          وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى
        </p>
        <p className="text-primary-300 text-xs mt-1">সৎকর্ম ও তাকওয়ায় পরস্পর সহযোগিতা করো — সূরা মায়িদাহ: ২</p>
      </div>

      {/* Mission & Vision */}
      {[
        {
          icon:  Target,
          color: 'bg-primary-100 text-primary-700',
          title: 'আমাদের লক্ষ্য',
          text:  'সুদমুক্ত ঋণ প্রদান ও সমাজের অসহায় মানুষদের আর্থিক সহায়তার মাধ্যমে একটি ন্যায়ভিত্তিক সমাজ গড়া।',
        },
        {
          icon:  Eye,
          color: 'bg-blue-100 text-blue-700',
          title: 'আমাদের দৃষ্টিভঙ্গি',
          text:  'ইসলামি অর্থনীতির আলোকে এমন একটি সমাজ গড়া যেখানে কেউ আর্থিক সংকটে একা থাকবে না।',
        },
        {
          icon:  Heart,
          color: 'bg-red-100 text-red-600',
          title: 'আমাদের মূল্যবোধ',
          text:  'আমানতদারিতা, স্বচ্ছতা, সহমর্মিতা এবং ইসলামি নীতিমালার উপর ভিত্তি করে কাজ করা।',
        },
        {
          icon:  Users,
          color: 'bg-amber-100 text-amber-700',
          title: 'আমাদের কার্যক্রম',
          text:  'সুদমুক্ত ঋণ, অনুদান, সঞ্চয় ব্যবস্থাপনা, শিক্ষা সহায়তা, চিকিৎসা সহায়তা এবং দুর্যোগ ত্রাণ।',
        },
      ].map(({ icon: Icon, color, title, text }) => (
        <div key={title} className="card flex gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
          </div>
        </div>
      ))}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/team">
          <div className="card text-center py-5 hover:shadow-md transition-shadow active:scale-98">
            <Users size={24} className="text-primary-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">আমাদের টিম</p>
          </div>
        </Link>
        <Link href="/activities">
          <div className="card text-center py-5 hover:shadow-md transition-shadow active:scale-98">
            <Heart size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">কার্যক্রম</p>
          </div>
        </Link>
        <Link href="/contact">
          <div className="card text-center py-5 hover:shadow-md transition-shadow active:scale-98 col-span-2">
            <p className="text-sm font-semibold text-primary-700">যোগাযোগ করুন →</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
