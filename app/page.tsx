'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { formatTaka, toBn } from '@/lib/utils';
import {
  Users, ShieldCheck, HandCoins, Wallet,
  Scale, Eye, Heart, BookOpenCheck,
  Stethoscope, GraduationCap, Sprout, Siren,
  ArrowRight, CheckCircle2,
} from 'lucide-react';

interface PublicStats {
  totalFund:     number;
  totalMembers:  number;
  totalLoans:    number;
  totalHelped:   number;
}

const MONTHLY_DUE = 100; // ৳ — মাসিক চাঁদা

const PRINCIPLES = [
  { icon: Scale,      title: 'সম্পূর্ণ সুদমুক্ত',      text: 'প্রতিটি ঋণ শতভাগ সুদমুক্ত। অতিরিক্ত কোনো অর্থ কখনো নেওয়া হয় না।' },
  { icon: BookOpenCheck, title: 'ইসলামী নৈতিকতা',    text: 'সততা, আমানতদারিতা ও ইসলামী মূল্যবোধের ভিত্তিতে প্রতিটি সিদ্ধান্ত নেওয়া হয়।' },
  { icon: Eye,        title: 'স্বচ্ছ হিসাব ব্যবস্থা', text: 'প্রতিটি টাকার হিসাব লিখিত ও সংরক্ষিত, বছরে অন্তত একবার অডিট হয়।' },
  { icon: Users,      title: 'দলগত সিদ্ধান্ত',        text: 'কোনো বড় সিদ্ধান্ত একক ব্যক্তি নেয় না — কমিটির আলোচনা ও পরামর্শে হয়।' },
  { icon: ShieldCheck,title: 'জবাবদিহিতা',            text: 'প্রতিটি কর্মকর্তা সদস্যদের কাছে জবাবদিহি, ক্ষমতার অপব্যবহারের সুযোগ নেই।' },
  { icon: Heart,      title: 'বৈষম্যহীন সহযোগিতা',    text: 'রাজনৈতিক নিরপেক্ষতা বজায় রেখে সমাজের প্রকৃত অসহায় মানুষকে সাহায্য করা হয়।' },
];

const PRIORITY_AREAS = [
  { icon: Stethoscope,  label: 'জরুরি চিকিৎসা' },
  { icon: GraduationCap,label: 'শিক্ষার খরচ' },
  { icon: HandCoins,    label: 'ক্ষুদ্র ব্যবসা' },
  { icon: Sprout,       label: 'কৃষি সহায়তা' },
  { icon: Users,        label: 'কর্মসংস্থান' },
  { icon: Siren,        label: 'দুর্যোগ ত্রাণ' },
];

const MEMBER_TYPES = [
  { title: 'সাধারণ সদস্য', text: `যারা নিয়মিত মাসিক ${toBn(MONTHLY_DUE)} টাকা চাঁদা প্রদান করবেন।` },
  { title: 'দাতা সদস্য',   text: 'যারা বড় অংকের অনুদান প্রদান করবেন।' },
  { title: 'আজীবন সদস্য', text: 'কমিটির নির্ধারিত এককালীন অর্থ প্রদান করে আজীবন সদস্য হওয়া যাবে।' },
  { title: 'সম্মানিত সদস্য', text: 'সমাজের বিশেষ অবদানকারী ব্যক্তিকে সম্মানসূচক সদস্য করা হয়।' },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [stats, setStats] = useState<PublicStats | null>(null);

  // লগইন করা থাকলে সরাসরি ড্যাশবোর্ডে
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  // পাবলিক স্ট্যাটস (public_stats/summary ডকুমেন্ট থেকে)
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'public_stats', 'summary'));
        if (snap.exists()) setStats(snap.data() as PublicStats);
      } catch {
        // পাবলিক স্ট্যাটস না থাকলে নিরবে বাদ দেওয়া হবে
      }
    })();
  }, []);

  if (loading || user) return null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HERO ===== */}
      <section className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 -left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg mx-auto px-4 pt-10 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Image
              src="/logo.png"
              alt="এক উম্মাহ ফাউন্ডেশন"
              width={110}
              height={110}
              className="mx-auto drop-shadow-2xl"
              priority
            />
            <h1 className="text-2xl font-bold text-white mt-4">এক উম্মাহ ফাউন্ডেশন</h1>
            <p className="text-primary-200 text-sm mt-1">সুদমুক্ত সহায়তা, বিশ্বাসের বন্ধন</p>

            <p className="font-arabic text-white/80 text-xl mt-5 leading-relaxed">
              وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى
            </p>
            <p className="text-primary-300 text-xs mt-1.5">
              সৎকর্ম ও তাকওয়ায় পরস্পর সহযোগিতা করো — সূরা মায়িদাহ: ২
            </p>
          </motion.div>

          {/* লাইভ স্ট্যাটস */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mt-8"
          >
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
              <Wallet size={18} className="text-gold-400 mx-auto mb-1.5" />
              <p className="text-white font-bold text-sm">
                {stats ? formatTaka(stats.totalFund) : '—'}
              </p>
              <p className="text-primary-300 text-[11px] mt-0.5">মোট ফান্ড</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
              <Users size={18} className="text-gold-400 mx-auto mb-1.5" />
              <p className="text-white font-bold text-sm">
                {stats ? toBn(stats.totalMembers) : '—'}
              </p>
              <p className="text-primary-300 text-[11px] mt-0.5">সদস্য</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-3 text-center border border-white/10">
              <HandCoins size={18} className="text-gold-400 mx-auto mb-1.5" />
              <p className="text-white font-bold text-sm">
                {stats ? toBn(stats.totalHelped) : '—'}
              </p>
              <p className="text-primary-300 text-[11px] mt-0.5">উপকারভোগী</p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ===== কেন এই ফাউন্ডেশন ===== */}
        <div className="card">
          <p className="text-sm text-gray-600 leading-relaxed">
            বর্তমান সমাজে অসংখ্য মানুষ আর্থিক সংকট, চিকিৎসা ব্যয়, শিক্ষার খরচ, বেকারত্ব কিংবা
            হঠাৎ বিপদের কারণে সুদভিত্তিক ঋণের জালে জড়িয়ে পড়ে। এই বাস্তবতার আলোকে সমাজের
            মানুষের পারস্পরিক সহযোগিতা, করযে হাসানাহ ও ইসলামী মূল্যবোধের ভিত্তিতে
            <span className="font-semibold text-primary-800"> সমাজভিত্তিক সুদমুক্ত সহায়তা ফান্ড</span> প্রতিষ্ঠা করা হয়েছে।
          </p>
        </div>

        {/* ===== উদ্দেশ্য ===== */}
        <div>
          <h2 className="section-title">আমাদের উদ্দেশ্য</h2>
          <p className="section-sub mb-3">সংবিধানের ধারা ৪ অনুযায়ী</p>
          <div className="space-y-2.5">
            {[
              'সমাজের মানুষকে সুদভিত্তিক ঋণ থেকে রক্ষা করা',
              'করযে হাসানাহ বা সুদমুক্ত ঋণের প্রচলন করা',
              'চিকিৎসা, শিক্ষা, ক্ষুদ্র ব্যবসা ও বিপদে সহযোগিতা করা',
              'দরিদ্র, অসহায় ও মধ্যবিত্ত মানুষকে সম্মানের সাথে সহায়তা করা',
              'মানুষের মাঝে দান, সাদাকাহ ও সামাজিক দায়িত্ববোধ বৃদ্ধি করা',
            ].map((text) => (
              <div key={text} className="flex items-start gap-2.5">
                <CheckCircle2 size={17} className="text-primary-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== মূলনীতি ===== */}
        <div>
          <h2 className="section-title">যেভাবে পরিচালিত হয়</h2>
          <p className="section-sub mb-3">আমাদের মূলনীতি</p>
          <div className="grid grid-cols-2 gap-3">
            {PRINCIPLES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card !p-4">
                <div className="w-9 h-9 bg-primary-50 text-primary-700 rounded-xl flex items-center justify-center mb-2.5">
                  <Icon size={17} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== অগ্রাধিকার ক্ষেত্র ===== */}
        <div>
          <h2 className="section-title">অগ্রাধিকার ক্ষেত্র</h2>
          <p className="section-sub mb-3">যেসব ক্ষেত্রে সহায়তা দেওয়া হয়</p>
          <div className="grid grid-cols-3 gap-2.5">
            {PRIORITY_AREAS.map(({ icon: Icon, label }) => (
              <div key={label} className="card !p-3.5 text-center">
                <Icon size={18} className="text-primary-600 mx-auto mb-1.5" />
                <p className="text-[11px] font-medium text-gray-700 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== সদস্যপদ ===== */}
        <div>
          <h2 className="section-title">সদস্যপদ ও চাঁদা</h2>
          <p className="section-sub mb-3">সংবিধানের দ্বিতীয় ভাগ অনুযায়ী</p>

          <div className="card-green mb-3 flex items-center justify-between">
            <div>
              <p className="text-primary-200 text-xs">মাসিক সদস্য চাঁদা</p>
              <p className="text-white text-2xl font-bold mt-0.5">{formatTaka(MONTHLY_DUE)}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
          </div>

          <div className="space-y-2">
            {MEMBER_TYPES.map(({ title, text }) => (
              <div key={title} className="card !p-3.5 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== ঋণ নীতিমালা সংক্ষেপে ===== */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">ঋণ ও কিস্তি নীতিমালা</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• সকল ঋণ সম্পূর্ণ সুদমুক্ত, লিখিত চুক্তির মাধ্যমে প্রদান করা হয়</p>
            <p>• মেয়াদ ৩, ৬ বা ১২ মাস — কমিটির সিদ্ধান্ত অনুযায়ী</p>
            <p>• ছোট কিস্তিতে পরিশোধের সুযোগ রয়েছে</p>
            <p>• প্রকৃত অসহায় হলে সময় বৃদ্ধি বা আংশিক মওকুফের বিবেচনা করা হয়</p>
          </div>
        </div>

        {/* ===== CTA ===== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="pt-2"
        >
          <div className="bg-gradient-to-br from-primary-800 to-primary-900 rounded-3xl p-6 text-center shadow-xl">
            <h3 className="text-white text-lg font-bold mb-1.5">আজই যুক্ত হোন</h3>
            <p className="text-primary-200 text-sm mb-5 leading-relaxed">
              সৎ, সহযোগিতাপ্রবণ ও সমাজকল্যাণে আগ্রহী প্রতিটি মানুষ সদস্য হতে পারবেন।
            </p>
            <Link href="/register">
              <button className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-lg">
                সদস্য হন
                <ArrowRight size={18} />
              </button>
            </Link>
            <p className="text-primary-300 text-xs mt-4">
              ইতিমধ্যে সদস্য?{' '}
              <Link href="/login" className="text-white font-semibold hover:underline">
                লগইন করুন
              </Link>
            </p>
          </div>
        </motion.div>

        {/* ===== Footer ===== */}
        <p className="text-center text-gray-400 text-xs pt-2">
          © {new Date().getFullYear()} এক উম্মাহ ফাউন্ডেশন — একটি অলাভজনক, সমাজকল্যাণমূলক ও স্বেচ্ছাসেবী প্রতিষ্ঠান
        </p>
      </div>
    </div>
  );
}
